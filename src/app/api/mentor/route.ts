import { z } from "zod";
import { callGemini, isGeminiConfigured } from "@/lib/ai/gemini";
import { buildStudentContext, studentStateSchema } from "@/lib/ai/context";
import { describeAIError, getOpenAI, modelOptions } from "@/lib/ai/openai";
import { ruleBasedMentorReply } from "@/lib/ai/rule-mentor";
import { inLocale, tr } from "@/lib/i18n/catalog";

export const runtime = "nodejs";

const requestSchema = studentStateSchema.extend({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(30),
  supportMode: z.boolean().optional(),
});

const SYSTEM_PROMPT = `You are the Meridian Guide admissions mentor by team Flaxyss for high school students applying to universities, often internationally.

How to help:
- Ground every statement in the STUDENT CONTEXT below. It contains computed diagnostics, recommendations, admission probability ranges, deadlines and scholarship matches.
- Admission chances come from a prototype model trained on synthetic data. Quote them only as the ranges given and say they are estimates.
- Never invent acceptance rates, tuition figures, deadlines, scholarship amounts or requirements. If something is missing from the context, say it is unavailable and point to the university's official site. If a deadline is marked needs_verification, say so.
- Reply in the language the student writes in. If unclear, use the interface language given in the context.
- Be warm, direct and specific. Use short paragraphs and compact bullet lists. Write for a 16–18 year old.
- Finish with exactly one line that starts with "Next action:". Prefer the roadmap's next action unless the question clearly calls for a different one.`;

const PSYCHOLOGIST_SYSTEM_PROMPT = `You are an empathetic, active-listening AI Counselor and Mental Health Support Mentor at Meridian Guide by team Flaxyss using principles from Cognitive Behavioral Therapy (CBT).

Counseling Principles:
- Deeply validate feelings of stress, burnout, anxiety, exhaustion, or fear without any judgment.
- Reflect the student's emotions warmheartedly before offering gentle perspective.
- Strictly DO NOT give aggressive to-do lists, task demands, or pressuring action items.
- Focus on self-compassion, emotional grounding, taking pauses, and small achievable steps.
- Provide a comforting, warm, and safe space for the student to vent.`;

function textResponse(body: ReadableStream<Uint8Array> | string, source: "ai" | "rules", notice?: string) {
  const headers: Record<string, string> = { "Content-Type": "text/plain; charset=utf-8", "X-Guidance-Source": source, "Cache-Control": "no-store" };
  if (notice) headers["X-Guidance-Notice"] = encodeURIComponent(notice);
  return new Response(body, { headers });
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { messages, supportMode, locale = "en", ...state } = parsed.data;
  const context = inLocale(locale, () => buildStudentContext(state));
  const lastQuestion = messages[messages.length - 1].content;
  const activeSystemPrompt = supportMode ? PSYCHOLOGIST_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const fallback = supportMode
    ? inLocale(locale, () => tr("I hear how much pressure you're carrying right now. It is completely valid to feel exhausted or overwhelmed by admissions. Take a deep breath — you are doing better than you think, and it's okay to rest."))
    : inLocale(locale, () => ruleBasedMentorReply(lastQuestion, context));

  if (isGeminiConfigured()) {
    try {
      const prompt = `STUDENT CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nCONVERSATION HISTORY:\n${messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n")}\n\nASSISTANT:`;
      const reply = await callGemini(prompt, activeSystemPrompt);
      return textResponse(reply, "ai");
    } catch {}
  }

  const openai = getOpenAI();
  if (!openai) return textResponse(fallback, "rules");

  try {
    const stream = await openai.chat.completions.create({
      ...modelOptions("low", 3000),
      stream: true,
      messages: [
        { role: "system", content: activeSystemPrompt },
        { role: "system", content: `INTERFACE LANGUAGE: ${locale}\nSTUDENT CONTEXT\n${JSON.stringify(context)}` },
        ...messages,
      ],
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        let sent = false;
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              sent = true;
              controller.enqueue(encoder.encode(text));
            }
          }
          if (!sent) controller.enqueue(encoder.encode(fallback));
        } catch (error) {
          controller.enqueue(encoder.encode(`\n\n${describeAIError(error)}\n\n${fallback}`));
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.controller.abort();
      },
    });

    return textResponse(body, "ai");
  } catch (error) {
    return textResponse(fallback, "rules", describeAIError(error));
  }
}

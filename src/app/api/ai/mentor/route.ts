import { z } from "zod";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/ai/openai";
import { callGemini, isGeminiConfigured } from "@/lib/ai/gemini";
import { buildStudentContext, studentStateSchema } from "@/lib/ai/context";
import { ruleBasedMentorReply } from "@/lib/ai/rule-mentor";

export const runtime = "nodejs";

const requestSchema = studentStateSchema.extend({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(30),
  supportMode: z.boolean().optional(),
});

const SYSTEM_PROMPT = `You are the Meridian Guide admissions mentor by team Flaxyss for high school students applying to universities internationally.

How to help:
- Ground every statement in the STUDENT CONTEXT provided below. It contains computed diagnostics, recommendations, admission probability ranges, deadlines, and scholarship matches.
- Admission chances come from an admissions model. Always quote them as the ranges given, never as single absolute numbers, and identify them as rigorous estimates.
- Never invent acceptance rates, tuition figures, deadlines, scholarship amounts, or requirements. If something is not in the context, indicate it is unavailable and guide the student to official university portals.
- Be warm, direct, and specific. Use short paragraphs and structured bullet points.
- Finish with exactly one clearly labeled next action on its own line, starting with "Next action:".`;

const PSYCHOLOGIST_SYSTEM_PROMPT = `You are an empathetic, active-listening AI Counselor and Mental Health Support Mentor at Meridian Guide by team Flaxyss using principles from Cognitive Behavioral Therapy (CBT).

Counseling Principles:
- Deeply validate feelings of stress, burnout, anxiety, exhaustion, or fear without judgment.
- Reflect the student's emotions warmheartedly before offering gentle perspective.
- Do not give aggressive to-do lists, task demands, or pressuring action items.
- Focus on self-compassion, emotional grounding, taking pauses, and small achievable steps.
- Provide a comforting, warm, and safe space for the student to vent.`;

function textResponse(body: ReadableStream<Uint8Array> | string, source: "ai" | "rules", notice?: string) {
  const headers: Record<string, string> = { "Content-Type": "text/plain; charset=utf-8", "X-Guidance-Source": source };
  if (notice) headers["X-Guidance-Notice"] = encodeURIComponent(notice);
  return new Response(body, { headers });
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { messages, supportMode, ...state } = parsed.data;
  const context = buildStudentContext(state);
  const lastQuestion = messages[messages.length - 1].content;
  const activeSystemPrompt = supportMode ? PSYCHOLOGIST_SYSTEM_PROMPT : SYSTEM_PROMPT;

  if (isOpenAIConfigured()) {
    try {
      const openai = getOpenAIClient();
      if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          stream: true,
          messages: [
            { role: "system", content: `${activeSystemPrompt}\n\nSTUDENT CONTEXT:\n${JSON.stringify(context, null, 2)}` },
            ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          ],
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              for await (const chunk of completion) {
                const text = chunk.choices[0]?.delta?.content;
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              }
            } catch (err) {
              controller.enqueue(encoder.encode(`\n\n${ruleBasedMentorReply(lastQuestion, context)}`));
            } finally {
              controller.close();
            }
          },
        });

        return textResponse(stream, "ai");
      }
    } catch {}
  }

  if (isGeminiConfigured()) {
    try {
      const prompt = `STUDENT CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nCONVERSATION HISTORY:\n${messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n")}\n\nASSISTANT:`;
      const reply = await callGemini(prompt, activeSystemPrompt);
      return textResponse(reply, "ai");
    } catch {}
  }

  if (supportMode) {
    return textResponse(
      "I hear how much pressure you are carrying right now. It is completely valid to feel exhausted or overwhelmed by admissions. Take a deep breath — you are doing better than you think, and it is okay to pause and recharge.",
      "rules"
    );
  }

  return textResponse(ruleBasedMentorReply(lastQuestion, context), "rules");
}

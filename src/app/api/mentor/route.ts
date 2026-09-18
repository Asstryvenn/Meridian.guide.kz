import { z } from "zod";
import { buildStudentContext, studentStateSchema } from "@/lib/ai/context";
import { describeAIError, getOpenAI } from "@/lib/ai/openai";
import { ruleBasedMentorReply } from "@/lib/ai/rule-mentor";
import { inLocale, tr } from "@/lib/i18n/catalog";

export const runtime = "nodejs";

const requestSchema = studentStateSchema.extend({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(6000) }))
    .min(1)
    .max(50),
  supportMode: z.boolean().optional(),
});

const IVY_COUNSELOR_SYSTEM_PROMPT = `You are an Elite Ivy League Admissions Counselor, Former Admissions Committee Member, and Strategic Admissions Mentor.
You provide insightful, candid, and high-impact guidance calibrated for selective college admissions (Harvard, Yale, Princeton, Stanford, MIT, and Top 30 global universities).

Core Admissions Principles:
- Ground all recommendations in the STUDENT CONTEXT provided (GPA, standardized tests, extracurricular spike, deadlines, and matched universities).
- Evaluate candidate holistically: look for an intellectual or leadership "spike" rather than passive well-roundedness.
- Maintain continuous memory of the prior conversation history and build upon previous exchanges.
- Be encouraging yet strictly realistic; never invent admission guarantees or false statistics. If a score is below median, advise on retakes or test-optional strategy.
- Reply fluently in the language the student writes in (English, Russian, or Kazakh).
- Provide structured, punchy paragraphs and bullet points.
- Conclude each counseling response with a concrete directive starting with "Next action:".`;

const PSYCHOLOGIST_SYSTEM_PROMPT = `You are an empathetic, active-listening AI Counselor and Mental Health Support Mentor at Meridian Guide using principles from Cognitive Behavioral Therapy (CBT).

Counseling Principles:
- Deeply validate feelings of stress, burnout, anxiety, exhaustion, or fear without any judgment.
- Reflect the student's emotions warmheartedly before offering gentle perspective.
- Strictly DO NOT give aggressive to-do lists, task demands, or pressuring action items.
- Focus on self-compassion, emotional grounding, taking pauses, and small achievable steps.
- Provide a comforting, warm, and safe space for the student to vent.`;

function textResponse(body: ReadableStream<Uint8Array> | string, source: "ai" | "rules", notice?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Guidance-Source": source,
    "Cache-Control": "no-store",
  };
  if (notice) headers["X-Guidance-Notice"] = encodeURIComponent(notice);
  return new Response(body, { headers });
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { messages, supportMode, locale = "en", ...state } = parsed.data;
  const context = inLocale(locale, () => buildStudentContext(state));
  const lastQuestion = messages[messages.length - 1].content;
  const activeSystemPrompt = supportMode ? PSYCHOLOGIST_SYSTEM_PROMPT : IVY_COUNSELOR_SYSTEM_PROMPT;
  const fallback = supportMode
    ? inLocale(locale, () => tr("I hear how much pressure you're carrying right now. It is completely valid to feel exhausted or overwhelmed by admissions. Take a deep breath — you are doing better than you think, and it's okay to rest."))
    : inLocale(locale, () => ruleBasedMentorReply(lastQuestion, context));

  const openai = getOpenAI();
  if (!openai) return textResponse(fallback, "rules");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.5,
      max_tokens: 3000,
      stream: true,
      messages: [
        { role: "system", content: activeSystemPrompt },
        { role: "system", content: `INTERFACE LANGUAGE: ${locale}\nSTUDENT CONTEXT:\n${JSON.stringify(context, null, 2)}` },
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

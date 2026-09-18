import { z } from "zod";
import { buildStudentContext, studentStateSchema } from "@/lib/ai/context";
import { describeAIError, getOpenAI, OPENAI_MODEL } from "@/lib/ai/openai";
import { inLocale } from "@/lib/i18n/catalog";

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

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request format" }, { status: 400 });
  }

  const { messages, supportMode, locale = "en", ...state } = parsed.data;
  const context = inLocale(locale, () => buildStudentContext(state));
  const activeSystemPrompt = supportMode ? PSYCHOLOGIST_SYSTEM_PROMPT : IVY_COUNSELOR_SYSTEM_PROMPT;

  const openai = getOpenAI();
  if (!openai) {
    return Response.json(
      { error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment or .env.local file." },
      { status: 500 }
    );
  }

  try {
    const stream = await openai.chat.completions.create({
      model: OPENAI_MODEL || "gpt-4o-mini",
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
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (error) {
          controller.enqueue(encoder.encode(`\n\n[OpenAI Stream Error: ${describeAIError(error)}]`));
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.controller.abort();
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Guidance-Source": "openai",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json({ error: describeAIError(error) }, { status: 502 });
  }
}

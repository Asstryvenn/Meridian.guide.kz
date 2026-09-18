import { z } from "zod";
import { describeAIError, getOpenAIClient, isOpenAIConfigured, modelOptions } from "@/lib/ai/openai";
import { buildStudentContext, studentStateSchema } from "@/lib/ai/context";

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

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { messages, supportMode, ...state } = parsed.data;
  const context = buildStudentContext(state);
  const activeSystemPrompt = supportMode ? PSYCHOLOGIST_SYSTEM_PROMPT : SYSTEM_PROMPT;

  const customKey = request.headers.get("x-openai-key") || null;
  if (!isOpenAIConfigured(customKey)) {
    return Response.json(
      {
        error: "OPENAI_KEY_MISSING",
        message: "OpenAI API key is missing. Add OPENAI_API_KEY in Vercel Project Settings > Environment Variables and redeploy, or configure your API key in the app.",
      },
      { status: 503 }
    );
  }

  try {
    const openai = getOpenAIClient(customKey);
    if (!openai) {
      return Response.json({ error: "Failed to initialize OpenAI client" }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      ...modelOptions("low", 3000),
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
          controller.enqueue(encoder.encode(`\n\n[OpenAI Stream Error: ${describeAIError(err)}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
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

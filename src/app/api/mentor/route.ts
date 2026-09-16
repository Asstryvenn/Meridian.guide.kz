import { z } from "zod";
import { CLAUDE_MODEL, describeClaudeError, getClaude } from "@/lib/ai/claude";
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

const SYSTEM_PROMPT = `You are the LOCUS admissions mentor for high school students applying to universities, often internationally.

How to help:
- Ground every statement in the STUDENT CONTEXT provided below. It contains computed diagnostics, recommendations, admission probability ranges, deadlines and scholarship matches.
- Admission chances come from a prototype model trained on synthetic data. Always quote them as the ranges given, never as precise numbers, and say they are estimates.
- Never invent acceptance rates, tuition figures, deadlines, scholarship amounts or requirements. If something is not in the context, say it is unavailable and point the student to the university's official site. If a deadline is marked needs_verification, say so.
- Be warm, direct and specific. Prefer short paragraphs and compact lists. Write for a 16–18 year old.
- Finish with exactly one clearly labelled next action on its own line, starting with "Next action:". Prefer the roadmap's next action unless the student's question clearly calls for a different one.`;

const PSYCHOLOGIST_SYSTEM_PROMPT = `You are an empathetic, active-listening AI Counselor and Mental Health Support Mentor using principles from Cognitive Behavioral Therapy (CBT).

Counseling Principles:
- Deeply validate feelings of stress, burnout, anxiety, exhaustion, or fear without any judgment.
- Reflect the student's emotions warmheartedly before offering gentle perspective.
- Strictly DO NOT give aggressive to-do lists, task demands, or pressuring action items.
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
  const claude = getClaude();

  if (!claude) {
    if (supportMode) {
      return textResponse("I hear how much pressure you're carrying right now. It is completely valid to feel exhausted or overwhelmed by admissions. Take a deep breath — you are doing better than you think, and it's okay to rest.", "rules");
    }
    return textResponse(ruleBasedMentorReply(lastQuestion, context), "rules");
  }

  const activeSystemPrompt = supportMode ? PSYCHOLOGIST_SYSTEM_PROMPT : SYSTEM_PROMPT;

  try {
    const stream = claude.beta.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: [
        { type: "text", text: activeSystemPrompt },
        { type: "text", text: `STUDENT CONTEXT\n${JSON.stringify(context, null, 2)}` },
      ],
      messages,
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") {
            controller.enqueue(encoder.encode(`\n\n${ruleBasedMentorReply(lastQuestion, context)}`));
          }
        } catch (error) {
          controller.enqueue(encoder.encode(`\n\n${describeClaudeError(error)}\n\n${ruleBasedMentorReply(lastQuestion, context)}`));
        } finally {
          controller.close();
        }
      },
    });

    return textResponse(body, "ai");
  } catch (error) {
    return textResponse(ruleBasedMentorReply(lastQuestion, context), "rules", describeClaudeError(error));
  }
}

import { z } from "zod";
import { buildStudentContext, studentStateSchema } from "@/lib/ai/context";
import { describeAIError, getOpenAI, modelOptions } from "@/lib/ai/openai";
import { ruleBasedMentorReply } from "@/lib/ai/rule-mentor";

export const runtime = "nodejs";

const requestSchema = studentStateSchema.extend({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(30),
});

const SYSTEM_PROMPT = `You are the LOCUS admissions mentor for high school students applying to universities, often internationally.

How to help:
- Ground every statement in the STUDENT CONTEXT below. It contains computed diagnostics, recommendations, admission probability ranges, deadlines and scholarship matches.
- Admission chances come from a prototype model trained on synthetic data. Quote them only as the ranges given and say they are estimates.
- Never invent acceptance rates, tuition figures, deadlines, scholarship amounts or requirements. If something is missing from the context, say it is unavailable and point to the university's official site. If a deadline is marked needs_verification, say so.
- Reply in the same language the student writes in.
- Be warm, direct and specific. Use short paragraphs and compact bullet lists. Write for a 16–18 year old.
- Finish with exactly one line that starts with "Next action:". Prefer the roadmap's next action unless the question clearly calls for a different one.`;

function textResponse(body: ReadableStream<Uint8Array> | string, source: "ai" | "rules", notice?: string) {
  const headers: Record<string, string> = { "Content-Type": "text/plain; charset=utf-8", "X-Guidance-Source": source, "Cache-Control": "no-store" };
  if (notice) headers["X-Guidance-Notice"] = encodeURIComponent(notice);
  return new Response(body, { headers });
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { messages, ...state } = parsed.data;
  const context = buildStudentContext(state);
  const lastQuestion = messages[messages.length - 1].content;
  const openai = getOpenAI();

  if (!openai) return textResponse(ruleBasedMentorReply(lastQuestion, context), "rules");

  try {
    const stream = await openai.chat.completions.create({
      ...modelOptions("low", 3000),
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `STUDENT CONTEXT\n${JSON.stringify(context)}` },
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
          if (!sent) controller.enqueue(encoder.encode(ruleBasedMentorReply(lastQuestion, context)));
        } catch (error) {
          controller.enqueue(encoder.encode(`\n\n${describeAIError(error)}\n\n${ruleBasedMentorReply(lastQuestion, context)}`));
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
    return textResponse(ruleBasedMentorReply(lastQuestion, context), "rules", describeAIError(error));
  }
}

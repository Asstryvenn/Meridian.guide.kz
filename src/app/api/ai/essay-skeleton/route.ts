import { z } from "zod";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/ai/openai";
import { callGemini, isGeminiConfigured } from "@/lib/ai/gemini";

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().min(3).max(2000),
  university: z.string().optional().default("University Admissions Committee"),
  fieldOfStudy: z.string().optional().default("General Academic"),
  studentBackground: z.string().optional().default(""),
  locale: z.enum(["en", "kk", "ru"]).optional().default("en"),
});

const ESSAY_SYSTEM_PROMPT = `You are an elite university admissions essay architect at Meridian Guide by team Flaxyss.
Your mission is to transform undergraduate admissions prompts into structurally irresistible, authentic 4-part essay skeletons.

Format the output strictly into four distinct architectural sections:
### Section 1: In Media Res Narrative Hook
A vivid sensory opening placed right in the middle of action or tension. No clichés ("Since childhood", "Webster dictionary defines...").

### Section 2: The Intellectual Crucible & Internal Friction
The core struggle, failure, paradox, or challenge. Detail specific choices, hypotheses tested, and cognitive vulnerability.

### Section 3: Epiphany & Skill Metamorphosis
The qualitative turning point. What underlying philosophy, technical realization, or worldview shift occurred?

### Section 4: Forward Vision & Institutional Symbiosis
Connecting this trajectory to specific university labs, professors, seminars, and campus ethos.

Avoid emojis, buzzwords, or superficial bragging. Ground everything in authentic human agency.`;

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid essay prompt data" }, { status: 400 });

  const { prompt, university, fieldOfStudy, studentBackground, locale } = parsed.data;

  const userQuery = `Target University: ${university}
Intended Field: ${fieldOfStudy}
Student Background: ${studentBackground || "High school applicant"}
Essay Prompt: "${prompt}"

Provide the 4-part architectural essay skeleton in ${locale === "kk" ? "Kazakh" : locale === "ru" ? "Russian" : "English"}.`;

  if (isOpenAIConfigured()) {
    try {
      const openai = getOpenAIClient();
      if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          stream: true,
          messages: [
            { role: "system", content: ESSAY_SYSTEM_PROMPT },
            { role: "user", content: userQuery },
          ],
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              for await (const chunk of completion) {
                const text = chunk.choices[0]?.delta?.content;
                if (text) controller.enqueue(encoder.encode(text));
              }
            } catch {
              controller.enqueue(encoder.encode("Essay skeleton generation encountered an interruption."));
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "X-Source": "openai" },
        });
      }
    } catch {}
  }

  if (isGeminiConfigured()) {
    try {
      const reply = await callGemini(userQuery, ESSAY_SYSTEM_PROMPT);
      return new Response(reply, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Source": "gemini" },
      });
    } catch {}
  }

  const fallbackSkeleton = `### Section 1: In Media Res Narrative Hook\nOpen immediately in the middle of a concrete experiment or project setback related to ${fieldOfStudy}.\n\n### Section 2: The Intellectual Crucible & Internal Friction\nDescribe the point where conventional answers failed, requiring you to rethink your assumptions.\n\n### Section 3: Epiphany & Skill Metamorphosis\nDetail the moment of clarity where disciplined inquiry resolved the initial ambiguity.\n\n### Section 4: Forward Vision & Institutional Symbiosis\nConnect this realization to specific research centers and faculty initiatives at ${university}.`;

  return new Response(fallbackSkeleton, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Source": "fallback" },
  });
}

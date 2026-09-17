import { z } from "zod";
import { getOpenAIClient, isOpenAIConfigured, modelOptions } from "@/lib/ai/openai";
import { callGemini, isGeminiConfigured } from "@/lib/ai/gemini";
import { diagnose } from "@/lib/engine/diagnostics";
import type { StudentProfile } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  profile: z.custom<StudentProfile>((value) => typeof value === "object" && value !== null),
  locale: z.enum(["en", "kk", "ru"]).optional().default("en"),
});

const DIAGNOSTIC_SYSTEM_PROMPT = `You are the Principal Admissions Strategist at Meridian Guide by team Flaxyss.
Your objective is to provide a senior-level, honest, and empowering diagnostic assessment of the student's applicant profile.

Evaluation Guidelines:
1. Executive Competitiveness Summary: Assess overall academic rigor, testing standing, and extracurricular depth.
2. Distinctive Spike Analysis: Identify what differentiates this student from tens of thousands of applicants with similar GPA and test scores.
3. Vulnerabilities & Gaps: Point out blind spots without sugarcoating (e.g. missing quantitative rigor, generic community service, lacks national/international recognition).
4. High-Leverage Strategic Directives: Give 3 specific actions that produce the highest mathematical boost in admission probability.

Maintain a professional, supportive, and rigorous tone. Do not use decorative emojis.`;

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid profile data" }, { status: 400 });

  const { profile, locale } = parsed.data;
  const diagnostics = diagnose(profile);

  const contextData = {
    diagnostics: {
      overall: diagnostics.overall,
      summary: diagnostics.summary,
      dimensions: diagnostics.dimensions.map((d) => ({
        label: d.label,
        score: d.score,
        band: d.band,
        improvement: d.improvement,
      })),
    },
    student: {
      country: profile.country || "International",
      grade: profile.grade,
      intendedFields: profile.fields,
      gpa: profile.gpa,
      sat: profile.sat,
      ielts: profile.ielts,
      toefl: profile.toefl,
      activities: profile.activities.map((a) => `${a.title} (${a.role}, ${a.level}) - ${a.impact}`),
    },
  };

  const userPrompt = `Analyze this student applicant profile and provide an exhaustive admissions diagnostic assessment in ${locale === "kk" ? "Kazakh" : locale === "ru" ? "Russian" : "English"}:\n\n${JSON.stringify(contextData, null, 2)}`;

  if (isOpenAIConfigured()) {
    try {
      const openai = getOpenAIClient();
      if (openai) {
        const completion = await openai.chat.completions.create({
          ...modelOptions("low", 3000),
          stream: true,
          messages: [
            { role: "system", content: DIAGNOSTIC_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
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
              controller.enqueue(encoder.encode(diagnostics.summary));
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
      const reply = await callGemini(userPrompt, DIAGNOSTIC_SYSTEM_PROMPT);
      return new Response(reply, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Source": "gemini" },
      });
    } catch {}
  }

  return new Response(diagnostics.summary, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Source": "rules" },
  });
}

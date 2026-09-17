import { buildStudentContext, studentStateSchema } from "@/lib/ai/context";
import { getOpenAI, modelOptions } from "@/lib/ai/openai";

export const runtime = "nodejs";

const INSTRUCTIONS = `You write a short, honest portfolio review for a high school student applying to universities.

Use only the computed diagnostics and profile data provided. Write 3–4 sentences in second person: what stands out, what is holding the profile back, and the single most valuable improvement over the next three months. Do not invent achievements, scores or statistics. No headings, no lists.`;

export async function POST(request: Request) {
  const parsed = studentStateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const context = buildStudentContext(parsed.data);
  const openai = getOpenAI();
  if (!openai) return Response.json({ narrative: null, source: "rules" });

  try {
    const completion = await openai.chat.completions.create({
      ...modelOptions("low", 1500),
      messages: [
        { role: "system", content: INSTRUCTIONS },
        { role: "user", content: JSON.stringify({ student: context.student, diagnostics: context.diagnostics }) },
      ],
    });
    const narrative = completion.choices[0]?.message.content?.trim() || null;
    return Response.json({ narrative, source: narrative ? "ai" : "rules" });
  } catch {
    return Response.json({ narrative: null, source: "rules" });
  }
}

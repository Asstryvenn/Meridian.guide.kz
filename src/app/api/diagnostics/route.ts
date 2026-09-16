import { CLAUDE_MODEL, getClaude } from "@/lib/ai/claude";
import { buildStudentContext, studentStateSchema } from "@/lib/ai/context";

export const runtime = "nodejs";

const INSTRUCTIONS = `You write a short, honest portfolio review for a high school student applying to universities.

Use only the computed diagnostics and profile data provided. Write 3–4 sentences in second person: what stands out, what is holding the profile back, and the single most valuable improvement over the next three months. Do not invent achievements, scores or statistics. No headings, no lists.`;

export async function POST(request: Request) {
  const parsed = studentStateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const context = buildStudentContext(parsed.data);
  const claude = getClaude();
  if (!claude) return Response.json({ narrative: null, source: "rules" });

  try {
    const response = await claude.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: INSTRUCTIONS,
      messages: [
        {
          role: "user",
          content: JSON.stringify({ student: context.student, diagnostics: context.diagnostics }, null, 2),
        },
      ],
    });
    if (response.stop_reason === "refusal") return Response.json({ narrative: null, source: "rules" });
    const narrative = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    return Response.json({ narrative: narrative || null, source: "ai" });
  } catch {
    return Response.json({ narrative: null, source: "rules" });
  }
}

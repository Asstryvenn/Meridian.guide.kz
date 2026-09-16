import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CLAUDE_MODEL, getClaude } from "@/lib/ai/claude";
import { countries, regions } from "@/lib/data/universities";
import { fieldOptions, parseQueryLocally, sanitizeFilters, searchFiltersSchema } from "@/lib/engine/search";

export const runtime = "nodejs";

const requestSchema = z.object({ query: z.string().min(1).max(300) });

const INSTRUCTIONS = `Convert a student's natural-language university search into structured filters.

Allowed fields of study: ${fieldOptions.join(", ")}.
Allowed countries: ${countries.join(", ")}.
Allowed regions: ${regions.join(", ")}.

Rules:
- maxTuitionUsd is annual international tuition in US dollars, or null when the query sets no limit. Words like "cheap" or "affordable" mean 25000.
- difficulty: "accessible" for easy/safety schools, "moderate" for target-level, "highly_selective" for elite/top schools, otherwise "any".
- scholarshipsOnly is true when the student asks about scholarships, funding or financial aid.
- keywords holds only specific names or cities that don't fit another filter. Leave it empty otherwise.
- Only use values from the allowed lists.`;

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { query } = parsed.data;

  const claude = getClaude();
  if (!claude) return Response.json({ filters: parseQueryLocally(query), source: "rules" });

  try {
    const response = await claude.beta.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(searchFiltersSchema) },
      system: INSTRUCTIONS,
      messages: [{ role: "user", content: query }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ filters: parseQueryLocally(query), source: "rules" });
    }
    return Response.json({ filters: sanitizeFilters(response.parsed_output), source: "ai" });
  } catch {
    return Response.json({ filters: parseQueryLocally(query), source: "rules" });
  }
}

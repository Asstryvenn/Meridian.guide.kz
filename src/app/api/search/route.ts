import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getOpenAI, modelOptions } from "@/lib/ai/openai";
import { countries, regions } from "@/lib/data/universities";
import { fieldOptions, parseQueryLocally, sanitizeFilters, searchFiltersSchema } from "@/lib/engine/search";

export const runtime = "nodejs";

const requestSchema = z.object({ query: z.string().min(1).max(300) });

const INSTRUCTIONS = `Convert a student's natural-language university search (in any language) into structured filters.

Allowed fields of study: ${fieldOptions.join(", ")}.
Allowed countries: ${countries.join(", ")}.
Allowed regions: ${regions.join(", ")}.

Rules:
- maxTuitionUsd is annual international tuition in US dollars, or null when no limit is given. "Cheap" or "affordable" means 25000.
- difficulty: "accessible" for easy/safety schools, "moderate" for target-level, "highly_selective" for elite/top schools, otherwise "any".
- scholarshipsOnly is true when the student asks about scholarships, grants, funding or financial aid.
- keywords holds only specific university names or cities that fit no other filter; otherwise it is empty.
- Only use values from the allowed lists.`;

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { query } = parsed.data;

  const openai = getOpenAI();
  if (!openai) return Response.json({ filters: parseQueryLocally(query), source: "rules" });

  try {
    const completion = await openai.chat.completions.parse({
      ...modelOptions("minimal", 1500),
      response_format: zodResponseFormat(searchFiltersSchema, "search_filters"),
      messages: [
        { role: "system", content: INSTRUCTIONS },
        { role: "user", content: query },
      ],
    });
    const filters = completion.choices[0]?.message.parsed;
    if (!filters) return Response.json({ filters: parseQueryLocally(query), source: "rules" });
    return Response.json({ filters: sanitizeFilters(filters), source: "ai" });
  } catch {
    return Response.json({ filters: parseQueryLocally(query), source: "rules" });
  }
}

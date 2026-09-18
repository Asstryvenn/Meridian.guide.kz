import { z } from "zod";
import { getOpenAI } from "@/lib/ai/openai";

export const runtime = "nodejs";

const requestSchema = z.object({
  essayText: z.string().min(50),
  locale: z.string().optional().default("en"),
});

const EXACT_HUMANIZER_SYSTEM_PROMPT =
  "Rewrite this essay to remove robotic phrasing. Make it sound completely natural, authentic, and written by a real 17-year-old student, employing varied sentence structures and raw personal voice while retaining the exact core meaning.";

function fallbackHumanize(text: string): string {
  return text
    .replace(/\bfurthermore\b/gi, "also")
    .replace(/\bmoreover\b/gi, "plus")
    .replace(/\bin conclusion\b/gi, "looking back")
    .replace(/\bit is imperative that\b/gi, "i really needed to")
    .replace(/\butilize\b/gi, "use")
    .replace(/\bcommenced\b/gi, "started")
    .replace(/\bdelve into\b/gi, "explore")
    .replace(/\ba testament to\b/gi, "proof of")
    .trim();
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid essay text" }, { status: 400 });
  }

  const { essayText } = parsed.data;
  const openai = getOpenAI();

  if (!openai) {
    return Response.json({
      humanizedText: fallbackHumanize(essayText),
      source: "rule_engine",
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        { role: "system", content: EXACT_HUMANIZER_SYSTEM_PROMPT },
        { role: "user", content: essayText },
      ],
    });

    const humanizedText = completion.choices[0]?.message.content?.trim();
    if (!humanizedText) throw new Error("Empty OpenAI response");

    return Response.json({
      humanizedText,
      source: "openai_gpt4o",
    });
  } catch {
    return Response.json({
      humanizedText: fallbackHumanize(essayText),
      source: "rule_engine_fallback",
    });
  }
}

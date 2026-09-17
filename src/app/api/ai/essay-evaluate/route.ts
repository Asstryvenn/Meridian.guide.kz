import { z } from "zod";
import { generateText } from "@/lib/ai/text";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { isOpenAIConfigured } from "@/lib/ai/openai";
import {
  computeStage1MlMetrics,
  generateHybridFallback,
} from "@/lib/engine/essay-dataset-corpus";
import type { HybridEssayEvaluationResult, Locale } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  essayText: z.string().min(50).max(12000),
  prompt: z.string().optional().default("Personal Statement / Admissions Essay"),
  targetUniversity: z.string().optional().default("Selective Global University"),
  locale: z.enum(["en", "kk", "ru"]).optional().default("en"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid essay payload. Essay text must be at least 50 characters." }, { status: 400 });
    }

    const { essayText, prompt, targetUniversity, locale } = parsed.data;
    const mlMetrics = computeStage1MlMetrics(essayText);
    const hasAiKey = isOpenAIConfigured() || isGeminiConfigured();

    if (!hasAiKey) {
      const fallback = generateHybridFallback(essayText, prompt, targetUniversity, locale as Locale);
      return Response.json({ result: fallback, source: "ml_calibrated" });
    }

    const systemPrompt = `You are an Elite Admissions Dean supervising a hybrid Machine Learning admissions evaluation pipeline at Meridian Guide by team Flaxyss.
You supervise and validate the Stage 1 ML baseline metrics:
- ML Baseline Score: ${mlMetrics.ml_baseline_score}/100
- ML Structural Coherence: ${mlMetrics.structural_coherence}/100
- ML Lexical Density: ${(mlMetrics.lexical_density * 100).toFixed(1)}% (Kaggle admissions dataset baseline: 64.8%)
- ML Admission Probability: ${mlMetrics.admission_probability}%
- Word Count: ${mlMetrics.word_count}
- Avg Sentence Length: ${mlMetrics.avg_sentence_length} words

Your mission:
1. Validate and fine-tune the final score (0–100) based on narrative arc, core impact, distinctiveness, and personal authenticity.
2. Determine the ml_confidence_match (a percentage score 0–100 indicating alignment with selective admissions standards).
3. Provide a thorough narrative_evaluation summarizing the candidate's trajectory and depth.
4. Detail actionable strengths (array of strings).
5. Detail concrete weaknesses / areas for high-impact improvement (array of strings).
6. Provide sentence_improvements (array of objects with exact keys: "original", "issue", "suggested").

Respond ONLY with a valid JSON object matching this exact schema:
{
  "final_score": number (0-100),
  "ml_confidence_match": number (0-100),
  "narrative_evaluation": "string",
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "sentence_improvements": [
    {
      "original": "exact sentence from essay",
      "issue": "specific reason this sentence is weak, passive, or cliché",
      "suggested": "punchy active rewrite"
    }
  ]
}

Language requirement: All narrative_evaluation, strengths, weaknesses, issues, and suggestions MUST be written in ${locale === "kk" ? "Kazakh" : locale === "ru" ? "Russian" : "English"}.`;

    const userPrompt = `Target Institution: ${targetUniversity}
Prompt: ${prompt}
Applicant Corpus Statistics:
- Word Count: ${mlMetrics.word_count}
- Sentence Count: ${mlMetrics.sentence_count}
- Lexical Density: ${(mlMetrics.lexical_density * 100).toFixed(1)}%
- Avg Sentence Length: ${mlMetrics.avg_sentence_length} words
- Structural Coherence Score: ${mlMetrics.structural_coherence}/100
- Admission Probability Estimate: ${mlMetrics.admission_probability}%

Applicant Essay Text:
"${essayText}"`;

    try {
      const { text, source } = await generateText(userPrompt, systemPrompt, 3500);
      const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsedAi = JSON.parse(cleaned);

      const final_score = Math.min(100, Math.max(20, Math.round(Number(parsedAi.final_score) || mlMetrics.ml_baseline_score)));
      const ml_confidence_match = Math.min(100, Math.max(40, Math.round(Number(parsedAi.ml_confidence_match) || 88)));

      const result: HybridEssayEvaluationResult = {
        id: `eval_${Date.now()}`,
        evaluatedAt: new Date().toISOString(),
        final_score,
        ml_confidence_match,
        narrative_evaluation: typeof parsedAi.narrative_evaluation === "string" ? parsedAi.narrative_evaluation : "",
        strengths: Array.isArray(parsedAi.strengths) ? parsedAi.strengths : [],
        weaknesses: Array.isArray(parsedAi.weaknesses) ? parsedAi.weaknesses : [],
        sentence_improvements: Array.isArray(parsedAi.sentence_improvements) ? parsedAi.sentence_improvements : [],
        ml_metrics: mlMetrics,
        source,
      };

      return Response.json({ result, source });
    } catch {
      const fallback = generateHybridFallback(essayText, prompt, targetUniversity, locale as Locale);
      return Response.json({ result: fallback, source: "ml_calibrated" });
    }
  } catch {
    return Response.json({ error: "Internal essay evaluation failure" }, { status: 500 });
  }
}

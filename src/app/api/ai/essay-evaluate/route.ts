import { z } from "zod";
import { generateText } from "@/lib/ai/text";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { isOpenAIConfigured } from "@/lib/ai/openai";
import {
  calculateCorpusPercentile,
  extractEssayCorpusMetrics,
  generateCalibratedFallbackEvaluation,
} from "@/lib/engine/essay-dataset-corpus";
import type { EssayEvaluationResult, Locale } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  essayText: z.string().min(50).max(10000),
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
    const metrics = extractEssayCorpusMetrics(essayText);
    const hasAiKey = isOpenAIConfigured() || isGeminiConfigured();

    if (!hasAiKey) {
      const fallback = generateCalibratedFallbackEvaluation(essayText, prompt, targetUniversity, locale as Locale);
      return Response.json({ result: fallback, source: "corpus_calibrated" });
    }

    const systemPrompt = `You are a Senior Admissions Dean and admissions essay evaluator at Meridian Guide by team Flaxyss.
You evaluate undergraduate admissions essays calibrated against a corpus benchmark of 1,002 admitted student essays.
Statistical corpus benchmarks:
- Mean Lexical Richness: 0.65 (Top quartile > 0.79)
- Mean Sentence Length: 9.2 words (optimal dynamic variation: 8-16 words)
- Mean Admitted Score: 74.5/100 (90th percentile = 85.5/100)

Evaluate the applicant's essay strictly across these 4 core dimensions (scale 0-100):
1. Content Depth & Substance (Content Value): authenticity, technical or cognitive depth, avoiding superficial platitudes.
2. Significance, Impact, and Story Arc: narrative friction, vulnerability, personal stakes, transformational realization.
3. Clarity, Tone, and Voice: lexical richness, active agency verbs, syntactic cadence, avoiding passive bloat.
4. Overall Admission Competitiveness: institutional compatibility, distinctiveness among 1,000+ applicants.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "scores": {
    "contentDepth": number (1-100),
    "storyArc": number (1-100),
    "clarityTone": number (1-100),
    "competitiveness": number (1-100)
  },
  "structuralCritique": [
    {
      "sectionTitle": "In Media Res Narrative Hook",
      "status": "strong" | "needs_work" | "excellent",
      "analysis": "Specific critique of the opening",
      "recommendation": "Actionable revision advice"
    },
    {
      "sectionTitle": "Intellectual Crucible & Friction",
      "status": "strong" | "needs_work" | "excellent",
      "analysis": "Specific critique of the core tension/problem",
      "recommendation": "Actionable revision advice"
    },
    {
      "sectionTitle": "Epiphany & Skill Metamorphosis",
      "status": "strong" | "needs_work" | "excellent",
      "analysis": "Specific critique of the turning point",
      "recommendation": "Actionable revision advice"
    },
    {
      "sectionTitle": "Forward Vision & Institutional Fit",
      "status": "strong" | "needs_work" | "excellent",
      "analysis": "Specific critique of future orientation and fit",
      "recommendation": "Actionable revision advice"
    }
  ],
  "sentenceImprovements": [
    {
      "original": "exact sentence from the essay needing work",
      "suggested": "revised punchy rewrite demonstrating active voice and precision",
      "reason": "precise pedagogical explanation of why this revision is stronger",
      "category": "clarity" | "impact" | "tone" | "conciseness"
    }
  ],
  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "weaknesses": ["Actionable improvement 1", "Actionable improvement 2", "Actionable improvement 3"],
  "admissionsVerdict": "Two-sentence conclusive admissions committee appraisal"
}

Language requirement: All analyses, recommendations, reasons, strengths, weaknesses, and verdicts MUST be written in ${locale === "kk" ? "Kazakh" : locale === "ru" ? "Russian" : "English"}.`;

    const userPrompt = `Target Institution: ${targetUniversity}
Prompt: ${prompt}
Applicant Corpus Statistics:
- Word Count: ${metrics.wordCount}
- Sentence Count: ${metrics.sentenceCount}
- Lexical Richness: ${(metrics.lexicalRichness * 100).toFixed(1)}%
- Avg Sentence Length: ${metrics.avgSentenceLength} words

Applicant Essay:
"${essayText}"`;

    try {
      const { text, source } = await generateText(userPrompt, systemPrompt, 3500);
      const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsedAi = JSON.parse(cleaned);

      const contentDepth = Number(parsedAi.scores?.contentDepth) || 75;
      const storyArc = Number(parsedAi.scores?.storyArc) || 75;
      const clarityTone = Number(parsedAi.scores?.clarityTone) || 75;
      const competitiveness = Number(parsedAi.scores?.competitiveness) || 75;

      const overallScore = Math.round(
        (contentDepth * 0.3) +
        (storyArc * 0.3) +
        (clarityTone * 0.2) +
        (competitiveness * 0.2)
      );

      const percentile = calculateCorpusPercentile(Number((overallScore / 10).toFixed(2)));

      const result: EssayEvaluationResult = {
        id: `eval_${Date.now()}`,
        evaluatedAt: new Date().toISOString(),
        overallScore,
        percentile,
        scores: {
          contentDepth,
          storyArc,
          clarityTone,
          competitiveness,
        },
        metrics,
        structuralCritique: Array.isArray(parsedAi.structuralCritique) ? parsedAi.structuralCritique : [],
        sentenceImprovements: Array.isArray(parsedAi.sentenceImprovements) ? parsedAi.sentenceImprovements : [],
        strengths: Array.isArray(parsedAi.strengths) ? parsedAi.strengths : [],
        weaknesses: Array.isArray(parsedAi.weaknesses) ? parsedAi.weaknesses : [],
        admissionsVerdict: typeof parsedAi.admissionsVerdict === "string" ? parsedAi.admissionsVerdict : "",
      };

      return Response.json({ result, source });
    } catch {
      const fallback = generateCalibratedFallbackEvaluation(essayText, prompt, targetUniversity, locale as Locale);
      return Response.json({ result: fallback, source: "corpus_fallback" });
    }
  } catch {
    return Response.json({ error: "Internal essay evaluation failure" }, { status: 500 });
  }
}

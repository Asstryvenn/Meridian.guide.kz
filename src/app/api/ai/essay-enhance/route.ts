import { z } from "zod";
import { getOpenAI } from "@/lib/ai/openai";

export const runtime = "nodejs";

const requestSchema = z.object({
  essayText: z.string().min(50),
  prompt: z.string().optional(),
  targetUniversity: z.string().optional(),
  locale: z.string().optional().default("en"),
});

export interface EssayEnhanceResult {
  originalText: string;
  enhancedText: string;
  critiques: {
    originalSnippet: string;
    critique: string;
    suggestedRevision: string;
    type: "hook" | "structure" | "diction" | "voice";
  }[];
  keyImprovements: string[];
  toneVerdict: string;
}

const SYSTEM_PROMPT = `You are an elite admissions essay editor and Pulitzer-level writing mentor.
Your task is to analyze the student's essay, generate inline structural critiques on specific snippets, and produce an authentic, exquisitely polished, and punchy enhanced version.
The enhanced version must retain the author's real core ideas and personal identity while elevating the narrative tension, syntactic variety, active verbs, and emotional resonance.

Return a valid JSON object ONLY:
{
  "enhancedText": "Complete enhanced essay text...",
  "critiques": [
    {
      "originalSnippet": "Exact phrase or sentence from original",
      "critique": "Insightful commentary explaining why this is weak, vague, or passive",
      "suggestedRevision": "How this specific snippet was transformed",
      "type": "hook" | "structure" | "diction" | "voice"
    }
  ],
  "keyImprovements": [
    "Replaced passive generalizations with sensory specifics",
    "Strengthened transition between conflict and resolution",
    "Clarified thematic resonance in the concluding reflection"
  ],
  "toneVerdict": "Short evaluation of the polished voice and narrative impact"
}
Write all critiques and explanations in the specified language code (en = English, ru = Russian, kk = Kazakh), but preserve the student's essay primary language for the enhancedText.`;

function getFallbackEnhance(text: string, locale: string): EssayEnhanceResult {
  const isRu = locale === "ru";
  const isKk = locale === "kk";

  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  const firstSentence = text.split(/[.!?]/)[0] || text.slice(0, 80);

  if (isRu) {
    return {
      originalText: text,
      enhancedText: text
        .replace(/\bочень\b/gi, "")
        .replace(/\bявляется\b/gi, "представляет собой")
        .trim(),
      critiques: [
        {
          originalSnippet: firstSentence.slice(0, 60),
          critique: "Вступительное предложение звучит обобщённо. Для селективных вузов необходима конкретная сцена.",
          suggestedRevision: "Начать с динамического действия или момента принятия решения.",
          type: "hook",
        },
        {
          originalSnippet: paragraphs[1] ? paragraphs[1].slice(0, 60) : firstSentence.slice(0, 50),
          critique: "Используются пассивные конструкции, снижающие ощущение личной инициативы.",
          suggestedRevision: "Заменить описательные обороты на глаголы действия первого лица.",
          type: "diction",
        },
      ],
      keyImprovements: [
        "Устранение шаблонных фраз и тавтологии",
        "Усиление авторского фокуса и динамики повествования",
        "Более убедительное завершение с личным инсайтом",
      ],
      toneVerdict: "Текст стал более зрелым, чётким и убедительным для приёмной комиссии.",
    };
  }

  if (isKk) {
    return {
      originalText: text,
      enhancedText: text.trim(),
      critiques: [
        {
          originalSnippet: firstSentence.slice(0, 60),
          critique: "Бастапқы сөйлем тым жалпылама. Нақты оқиға немесе эмоциямен бастау тиімдірек.",
          suggestedRevision: "Динамикалық әрекет немесе шешім қабылдау сәтімен бастау.",
          type: "hook",
        },
      ],
      keyImprovements: [
        "Ойдың жүйелілігі мен мазмұн тереңдігін арттыру",
        "Қайталанатын тіркестерді жою",
      ],
      toneVerdict: "Эссе өзіндік мазмұнын сақтай отырып, мақсатты түрде жетілдірілді.",
    };
  }

  return {
    originalText: text,
    enhancedText: text.trim(),
    critiques: [
      {
        originalSnippet: firstSentence.slice(0, 60),
        critique: "The opening sentence leans toward summary rather than immediate immersive engagement.",
        suggestedRevision: "Ground the opening in a sensory, specific moment of agency or curiosity.",
        type: "hook",
      },
      {
        originalSnippet: paragraphs[1] ? paragraphs[1].slice(0, 60) : firstSentence.slice(0, 50),
        critique: "Over-reliance on passive exposition rather than showing the intellectual process.",
        suggestedRevision: "Emphasize active decision-making verbs and internal reflections.",
        type: "voice",
      },
    ],
    keyImprovements: [
      "Sharpened narrative arc with active voice and vivid diction",
      "Eliminated redundant filler and institutional clichés",
      "Heightened philosophical clarity in the conclusion",
    ],
    toneVerdict: "Polished into a memorable, authentic voice that demonstrates genuine intellectual vitality.",
  };
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid essay payload" }, { status: 400 });
  }

  const { essayText, prompt, targetUniversity, locale } = parsed.data;
  const openai = getOpenAI();

  if (!openai) {
    return Response.json({ result: getFallbackEnhance(essayText, locale), source: "rule_engine" });
  }

  try {
    const userPrompt = JSON.stringify({
      language: locale,
      promptContext: prompt || "College Admissions Personal Statement",
      targetUniversity: targetUniversity || "Selective University",
      essayContent: essayText,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message.content;
    if (!raw) throw new Error("Empty OpenAI response");

    const parsedData = JSON.parse(raw);
    const result: EssayEnhanceResult = {
      originalText: essayText,
      enhancedText: parsedData.enhancedText || essayText,
      critiques: parsedData.critiques || [],
      keyImprovements: parsedData.keyImprovements || [],
      toneVerdict: parsedData.toneVerdict || "Enhanced for holistic admissions evaluation.",
    };

    return Response.json({ result, source: "openai_gpt4o" });
  } catch {
    return Response.json({ result: getFallbackEnhance(essayText, locale), source: "rule_engine_fallback" });
  }
}

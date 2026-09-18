import { z } from "zod";
import { getOpenAI } from "@/lib/ai/openai";
import type { StudentProfile } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  profile: z.custom<StudentProfile>((v) => typeof v === "object" && v !== null),
  locale: z.string().optional().default("en"),
  targetUniversities: z.array(z.string()).optional().default([]),
});

export interface PortfolioAnalysisResult {
  overallScore: number;
  competitivenessTier: string;
  holisticEvaluation: string;
  narrativeStrengths: {
    title: string;
    description: string;
    impact: "exceptional" | "high" | "moderate";
  }[];
  criticalWeaknesses: {
    title: string;
    description: string;
    mitigation: string;
    urgency: "urgent" | "important";
  }[];
  strategicNextSteps: {
    timeframe: string;
    action: string;
    rationale: string;
  }[];
  recommendedSpike: string;
  admissionsOddsOutlook: string;
}

const SYSTEM_PROMPT = `You are a Senior Dean of Undergraduate Admissions at an Ivy League university conducting a holistic admissions portfolio evaluation.
Evaluate the student's complete academic, testing, extracurricular, demographic, and narrative profile.
Return a valid JSON object ONLY with the following exact schema:
{
  "overallScore": number (0-100),
  "competitivenessTier": string (e.g. "Ivy League / Tier-1 Contender", "Top 30 Competitive", "Strong Target Profile"),
  "holisticEvaluation": string (150-250 words thorough executive summary),
  "narrativeStrengths": [
    {
      "title": string,
      "description": string,
      "impact": "exceptional" | "high" | "moderate"
    }
  ],
  "criticalWeaknesses": [
    {
      "title": string,
      "description": string,
      "mitigation": string,
      "urgency": "urgent" | "important"
    }
  ],
  "strategicNextSteps": [
    {
      "timeframe": string,
      "action": string,
      "rationale": string
    }
  ],
  "recommendedSpike": string,
  "admissionsOddsOutlook": string
}
Write all text fields in the specified language code (en = English, ru = Russian, kk = Kazakh). Do not invent false credentials. Give honest, tough, and strategic advice.`;

function getFallbackAnalysis(profile: StudentProfile, locale: string): PortfolioAnalysisResult {
  const isRu = locale === "ru";
  const isKk = locale === "kk";

  const gpa = profile.gpa || 3.7;
  const sat = profile.sat || 1420;
  const score = Math.min(95, Math.round((gpa / 4.0) * 50 + (sat / 1600) * 45 + 5));

  if (isRu) {
    return {
      overallScore: score,
      competitivenessTier: score >= 85 ? "Конкурентоспособен для Топ-20 и Лиги Плюща" : "Сильный кандидат для Топ-50 университетов",
      holisticEvaluation: `Анализ профиля показывает уверенную академическую базу с GPA ${gpa} и SAT ${sat}. Основной потенциал раскрывается в сопоставлении академических результатов с внеучебной деятельностью. Профилю требуется более акцентированный фокус («spike») в выбранной специальности для выделения среди международных абитуриентов.`,
      narrativeStrengths: [
        {
          title: "Уверенный академический индекс",
          description: `GPA ${gpa} демонстрирует стабильную успеваемость и готовность к университетской нагрузке.`,
          impact: "high",
        },
        {
          title: "Сбалансированный профиль интересов",
          description: `Выбранные направления (${profile.fields.join(", ") || "STEM"}) хорошо соотносятся с целями.`,
          impact: "moderate",
        },
      ],
      criticalWeaknesses: [
        {
          title: "Недостаток подтверждённого лидерства",
          description: "Внеучебные активности не показывают измеримого внешнего масштаба или побед на национальном уровне.",
          mitigation: "Инициировать собственный проект или подать заявку на престижное летнее исследование/олимпиаду.",
          urgency: "urgent",
        },
        {
          title: "Стандартизированные тесты",
          description: "Для топовых вузов США желателен балл SAT от 1520+ либо сдача предметных олимпиад.",
          mitigation: "Пройти целевой курс пересдачи SAT с упором на секцию Reading & Writing.",
          urgency: "important",
        },
      ],
      strategicNextSteps: [
        {
          timeframe: "1-2 месяца",
          action: "Сформировать авторский исследовательский проект или публикацию",
          rationale: "Позволит выделить глубокий интерес за рамками школьной программы.",
        },
        {
          timeframe: "3-4 месяца",
          action: "Сфокусироваться на Common App Personal Statement",
          rationale: "Убедительная личная история компенсирует пробелы в конкурсных баллах.",
        },
      ],
      recommendedSpike: "Исследовательское лидерство и социальное влияние в выбранной области",
      admissionsOddsOutlook: "Высокие шансы на поступление с финансированием в селективные вузы при условии качественных эссе и усиления внеучебного блока.",
    };
  }

  if (isKk) {
    return {
      overallScore: score,
      competitivenessTier: score >= 85 ? "Топ-20 және Айви Лигасы үшін бәсекеге қабілетті" : "Топ-50 университеттер үшін мықты үміткер",
      holisticEvaluation: `Профиль талдауы GPA ${gpa} және SAT ${sat} көрсеткіштерімен сенімді академиялық базаны көрсетеді. Халықаралық үміткерлер арасында ерекшелену үшін таңдалған бағытта айқын сараптамалық көшбасшылық («spike») қажет.`,
      narrativeStrengths: [
        {
          title: "Жоғары академиялық көрсеткіштер",
          description: `GPA ${gpa} тұрақты үлгерімді және халықаралық стандарттарға сай білім деңгейін көрсетеді.`,
          impact: "high",
        },
      ],
      criticalWeaknesses: [
        {
          title: "Ауқымды жобалардың жетіспеуі",
          description: "Сыныптан тыс белсенділіктерде ұлттық немесе халықаралық деңгейдегі жетекшілік жеткіліксіз.",
          mitigation: "Жеке зерттеу немесе қоғамдық бастаманы іске қосу қажет.",
          urgency: "urgent",
        },
      ],
      strategicNextSteps: [
        {
          timeframe: "1-2 ай",
          action: "Жеке ғылыми немесе қоғамдық жобаны бастау",
          rationale: "Мектеп бағдарламасынан тыс терең қызығушылықты дәлелдейді.",
        },
      ],
      recommendedSpike: "Таңдалған мамандықтағы ғылыми көшбасшылық пен тәжірибелік жобалар",
      admissionsOddsOutlook: "Эссе мен портфолионы дұрыс стратегиялаған жағдайда шетелдік үздік оқу орындарына түсу мүмкіндігі жоғары.",
    };
  }

  return {
    overallScore: score,
    competitivenessTier: score >= 85 ? "Top 20 / Ivy League Contender" : "Strong Top 50 University Candidate",
    holisticEvaluation: `Your aggregated profile shows a solid academic baseline with GPA ${gpa} and SAT ${sat}. To maximize conversion into elite global admissions, your application narrative must sharpen its focus around a defined intellectual spike rather than well-rounded participation.`,
    narrativeStrengths: [
      {
        title: "Competitive Academic Rigor",
        description: `Your GPA of ${gpa} reflects consistent performance across rigorous coursework.`,
        impact: "high",
      },
      {
        title: "Clear Disciplinary Alignment",
        description: `Targeting ${profile.fields.join(", ") || "your declared fields"} provides an authentic narrative thread.`,
        impact: "moderate",
      },
    ],
    criticalWeaknesses: [
      {
        title: "Absence of High-Impact Spike",
        description: "Your activities demonstrate participation but lack institutional scale, national recognition, or published impact.",
        mitigation: "Launch a tangible independent research paper or lead a high-visibility initiative before submission deadlines.",
        urgency: "urgent",
      },
      {
        title: "Testing Target Gap",
        description: "For Top 20 admissions, a competitive SAT benchmark is 1520+ with balanced sub-scores.",
        mitigation: "Complete focused diagnostic drills with emphasis on reading section time management.",
        urgency: "important",
      },
    ],
    strategicNextSteps: [
      {
        timeframe: "Next 30 Days",
        action: "Define and execute your capstone extracurricular initiative",
        rationale: "Provides admissions officers with a memorable talking point during committee deliberation.",
      },
      {
        timeframe: "Next 60 Days",
        action: "Draft and polish the Common App Personal Statement",
        rationale: "Reframes quantitative metrics into a cohesive, memorable human narrative.",
      },
    ],
    recommendedSpike: "Quantitative Rigor & Practical Problem Solving in Chosen Field",
    admissionsOddsOutlook: "Highly competitive for selective national universities and viable for Top 20 institutions with distinguished essays and focused recommendations.",
  };
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { profile, locale, targetUniversities } = parsed.data;
  const openai = getOpenAI();

  if (!openai) {
    return Response.json({
      result: getFallbackAnalysis(profile, locale),
      source: "rule_engine",
    });
  }

  try {
    const userPrompt = JSON.stringify({
      language: locale,
      studentData: {
        fullName: profile.fullName,
        country: profile.country,
        grade: profile.grade,
        gpa: profile.gpa,
        gradingSystem: profile.gradingSystem,
        sat: profile.sat,
        act: profile.act,
        ielts: profile.ielts,
        toefl: profile.toefl,
        duolingo: profile.duolingo,
        fieldsOfStudy: profile.fields,
        careerGoal: profile.careerGoal,
        activities: profile.activities,
        targetUniversities,
        annualBudgetUsd: profile.annualBudgetUsd,
      },
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message.content;
    if (!raw) {
      throw new Error("Empty OpenAI response");
    }

    const parsedResult = JSON.parse(raw) as PortfolioAnalysisResult;
    return Response.json({
      result: parsedResult,
      source: "openai_gpt4o",
    });
  } catch {
    return Response.json({
      result: getFallbackAnalysis(profile, locale),
      source: "rule_engine_fallback",
    });
  }
}

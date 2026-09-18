import { z } from "zod";
import { getOpenAI } from "@/lib/ai/openai";
import type { StudentProfile } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().min(10),
  profile: z.custom<StudentProfile>((v) => typeof v === "object" && v !== null),
  locale: z.string().optional().default("en"),
});

export interface BrainstormAngle {
  angleNumber: number;
  hookTheme: string;
  narrativeArc: string;
  profileConnection: string;
  outlinePoints: string[];
}

const SYSTEM_PROMPT = `You are an elite Ivy League admissions essay strategist and narrative coach.
Given an admissions essay prompt and the student's profile (extracurriculars, interests, background, archetype), generate exactly 3 distinct, creative, and non-cliché brainstorming angles/outline paths.
Return a valid JSON object ONLY:
{
  "angles": [
    {
      "angleNumber": 1,
      "hookTheme": "Short compelling theme/title",
      "narrativeArc": "2-3 sentences explaining the overarching story journey",
      "profileConnection": "How this connects to the student's specific extracurriculars or interests",
      "outlinePoints": [
        "Opening Scene / Vivid Hook",
        "Rising Action & Conflict / Turning Point",
        "Reflection, Self-Discovery & Realization",
        "Forward-Looking Vision for College"
      ]
    },
    ...
  ]
}
Write all text in the requested language code (en = English, ru = Russian, kk = Kazakh). Provide innovative, unforgettable storytelling angles that avoid common cliches like the sports injury, mission trip, or standard immigrant parent narrative unless given a fresh philosophical spin.`;

function getFallbackAngles(prompt: string, profile: StudentProfile, locale: string): BrainstormAngle[] {
  const isRu = locale === "ru";
  const isKk = locale === "kk";

  if (isRu) {
    return [
      {
        angleNumber: 1,
        hookTheme: "Интеллектуальный поиск через нестандартный проект",
        narrativeArc: "История начинается с неожиданного провала в исследовании или проекте, который привёл к глубокому пониманию научной этики и упорства.",
        profileConnection: `Связывает интерес к ${profile.fields.join(", ") || "выбранному направлению"} с личным развитием.`,
        outlinePoints: [
          "Яркая завязка: ключевой момент эксперимента или идеи",
          "Препятствие: технический сбой и переосмысление подхода",
          "Инсайт: переход от погони за результатом к удовольствию от познания",
          "Связь с будущим обучением в университете",
        ],
      },
      {
        angleNumber: 2,
        hookTheme: "Лидерство как объединение сообщества",
        narrativeArc: "Фокус на незаметной инициативе: создание локального решения для реальной проблемы сверстников или города.",
        profileConnection: "Демонстрирует способность влиять на окружение без формальных титулов.",
        outlinePoints: [
          "Наблюдение за проблемой, которую другие игнорировали",
          "Первые шаги и сомнения команды",
          "Измеримый позитивный эффект для сообщества",
          "Философский вывод об ответственности лидера",
        ],
      },
      {
        angleNumber: 3,
        hookTheme: "Культурный синтез и личный голос",
        narrativeArc: "Исследование точки пересечения национального наследия, семейных традиций и современных амбиций в науке/технологиях.",
        profileConnection: "Раскрывает уникальный контекст и зрелость мышления.",
        outlinePoints: [
          "Специфическая деталь из детства или семейной беседы",
          "Конфликт поколений или ожиданий",
          "Синтез двух миров как суперсила",
          "Чёткое видение своего вклада в кампус",
        ],
      },
    ];
  }

  if (isKk) {
    return [
      {
        angleNumber: 1,
        hookTheme: "Ғылыми ізденіс пен тәжірибелік сынақ",
        narrativeArc: "Жоба барысындағы күтпеген кедергі арқылы зерттеушілік төзімділікті көрсету.",
        profileConnection: `Таңдалған ${profile.fields.join(", ") || "мамандықпен"} тығыз байланыс.`,
        outlinePoints: [
          "Әсерлі бастама: сәтсіз эксперимент сәті",
          "Кедергіні талдау және жаңа шешім табу",
          "Жеке көзқарастың өзгеруі мен ізденіс құндылығы",
          "Университеттегі болашақ мақсаттармен байланыс",
        ],
      },
      {
        angleNumber: 2,
        hookTheme: "Қоғамға қызмет ету және көшбасшылық",
        narrativeArc: "Шағын ортадағы өзекті мәселені шешу арқылы көшбасшылық қасиетті ашу.",
        profileConnection: "Әлеуметтік жауапкершілік пен бастамашылдықты көрсетеді.",
        outlinePoints: [
          "Айналадағы мәселені байқау",
          "Команданы біріктіру және алғашқы қадамдар",
          "Нақты нәтиже және адамдарға тигізген пайдасы",
          "Көшбасшылық туралы терең ой-толғау",
        ],
      },
      {
        angleNumber: 3,
        hookTheme: "Дәстүр мен заманауи білім тоғысы",
        narrativeArc: "Ұлттық болмыс пен заманауи ғылымды ұштастыру жолындағы ойлар.",
        profileConnection: "Даралық пен тұлғалық ерекшелікті айқындайды.",
        outlinePoints: [
          "Отбасылық немесе мәдени маңызды деталь",
          "Заманауи білімге деген құштарлық",
          "Екі дүниенің үйлесімі",
          "Университет қауымдастығына қосатын үлес",
        ],
      },
    ];
  }

  return [
    {
      angleNumber: 1,
      hookTheme: "Intellectual Curiosity via the Unexpected Failure",
      narrativeArc: "Opening with a specific micro-failure in an independent project that unexpectedly catalyzed a mature philosophical pivot in your approach to learning.",
      profileConnection: `Directly grounds your passion for ${profile.fields.join(", ") || "your field"} in authentic resilience.`,
      outlinePoints: [
        "In Media Res Hook: The exact moment the initial hypothesis failed",
        "The Pivot: Questioning assumptions and rebuilding the methodology",
        "The Insight: Shifting from outcome-obsession to intellectual joy",
        "Campus Trajectory: How this rigor will translate into collegiate research",
      ],
    },
    {
      angleNumber: 2,
      hookTheme: "Micro-Impact & Quiet Leadership",
      narrativeArc: "Examining an initiative where you spotted an overlooked inefficiency in your school or community and engineered a sustained solution.",
      profileConnection: "Demonstrates high agency, empathy, and institutional impact without needing formal titles.",
      outlinePoints: [
        "The Anomaly: Noticing what everyone else accepted as normal",
        "Friction: Overcoming initial indifference from peers or administrators",
        "The Ripple Effect: Quantitative and qualitative community impact",
        "Core Value: How you intend to be a positive catalyst on campus",
      ],
    },
    {
      angleNumber: 3,
      hookTheme: "The Synthesis of Competing Worlds",
      narrativeArc: "Juxtaposing two seemingly incompatible parts of your identity or interests to reveal your distinctive worldview.",
      profileConnection: "Creates an unmistakable personal narrative signature that sticks in admissions committee memory.",
      outlinePoints: [
        "Vivid Anecdote: A sensory clash between two worlds or disciplines",
        "Internal Dialogue: The struggle to harmonize competing expectations",
        "The Synthesis: Embracing nuance and interdisciplinary perspective",
        "Contribution: The distinctive lens you bring to late-night dormitory discussions",
      ],
    },
  ];
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { prompt, profile, locale } = parsed.data;
  const openai = getOpenAI();

  if (!openai) {
    return Response.json({ angles: getFallbackAngles(prompt, profile, locale), source: "rule_engine" });
  }

  try {
    const userMessage = JSON.stringify({
      prompt,
      language: locale,
      studentProfile: {
        fields: profile.fields,
        careerGoal: profile.careerGoal,
        activities: profile.activities.map((a) => ({ title: a.title, role: a.role, category: a.category, impact: a.impact })),
        archetype: profile.archetype,
      },
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message.content;
    if (!raw) throw new Error("Empty OpenAI response");

    const parsedData = JSON.parse(raw) as { angles: BrainstormAngle[] };
    return Response.json({ angles: parsedData.angles || [], source: "openai_gpt4o" });
  } catch {
    return Response.json({ angles: getFallbackAngles(prompt, profile, locale), source: "rule_engine_fallback" });
  }
}

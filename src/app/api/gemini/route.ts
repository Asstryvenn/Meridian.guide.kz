import { callGemini, isGeminiConfigured } from "@/lib/ai/gemini";
import type { InterviewFeedback } from "@/lib/types";

export const runtime = "nodejs";

interface GeminiRequestBody {
  action:
    | "extracurricular_recommendations"
    | "interview_feedback"
    | "essay_outline"
    | "major_matching"
    | "psychologist_vent";
  payload: any;
  locale?: "en" | "kk" | "ru";
}

export async function POST(request: Request) {
  try {
    const body: GeminiRequestBody = await request.json().catch(() => null);
    if (!body || !body.action) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { action, payload, locale = "en" } = body;
    const hasKey = isGeminiConfigured();

    if (action === "interview_feedback") {
      const question = payload?.question || "Tell me about yourself.";
      const answer = payload?.answer || "";
      const university = payload?.university || "Top University";

      if (hasKey && answer.trim().length > 10) {
        const systemPrompt = `You are a Senior Admissions Interviewer for top global universities (${university}).
Evaluate the student's mock interview answer in language ${locale}.
Return ONLY a valid JSON object matching this exact schema:
{
  "overallScore": number (1-100),
  "cadenceScore": number (1-100),
  "clarityScore": number (1-100),
  "poiseScore": number (1-100),
  "contentScore": number (1-100),
  "strengths": ["string", "string"],
  "improvements": ["string", "string"],
  "qualitativeSummary": "string"
}`;
        const prompt = `Interview Question: "${question}"
Candidate Transcript: "${answer}"`;

        try {
          const raw = await callGemini(prompt, systemPrompt);
          const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          return Response.json({ feedback: parsed, source: "gemini" });
        } catch {
          return Response.json({
            feedback: getFallbackInterviewFeedback(locale),
            source: "rules",
          });
        }
      }

      return Response.json({
        feedback: getFallbackInterviewFeedback(locale),
        source: "rules",
      });
    }

    if (action === "extracurricular_recommendations") {
      const field = payload?.field || "Computer Science";
      const existing = payload?.activities || [];

      if (hasKey) {
        const systemPrompt = `You are an elite university admissions advisor at Meridian Guide by Flaxyss.
Generate 3 high-impact extracurricular recommendations for a student aiming for ${field} in language ${locale}.
Return ONLY a valid JSON array of objects:
[
  {
    "id": "rec-1",
    "title": "string",
    "category": "Competition" | "Research" | "Project" | "Leadership",
    "field": "${field}",
    "role": "string",
    "description": "string",
    "impactPotential": "High" | "Very High" | "Elite",
    "level": "national" | "international",
    "estimatedHoursPerWeek": number,
    "xpReward": number,
    "roadmapTaskTitle": "string"
  }
]`;
        const prompt = `Student Current Activities: ${JSON.stringify(existing)}`;

        try {
          const raw = await callGemini(prompt, systemPrompt);
          const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          return Response.json({ recommendations: parsed, source: "gemini" });
        } catch {
          return Response.json({
            recommendations: getFallbackRecommendations(field, locale),
            source: "rules",
          });
        }
      }

      return Response.json({
        recommendations: getFallbackRecommendations(field, locale),
        source: "rules",
      });
    }

    if (action === "essay_outline") {
      const university = payload?.university || "Stanford University";
      const essayPrompt = payload?.prompt || "Why our university?";
      const studentInterests = payload?.interests || "STEM and leadership";

      if (hasKey) {
        const systemPrompt = `You are a master admissions essay strategist at Meridian Guide by Flaxyss.
Generate an engaging, high-yield 4-paragraph outline in ${locale} for:
University: ${university}
Prompt: ${essayPrompt}
Candidate context: ${studentInterests}`;

        try {
          const text = await callGemini(
            "Provide the 4-part essay structure: Hook & Context, Intellectual Curiosity, Specific Institutional Alignment, and Future Vision.",
            systemPrompt
          );
          return Response.json({ outline: text, source: "gemini" });
        } catch {
          return Response.json({
            outline: getFallbackEssayOutline(university, essayPrompt, locale),
            source: "rules",
          });
        }
      }

      return Response.json({
        outline: getFallbackEssayOutline(university, essayPrompt, locale),
        source: "rules",
      });
    }

    if (action === "psychologist_vent") {
      const userMessage = payload?.message || "I feel overwhelmed";

      if (hasKey) {
        const systemPrompt = `You are an empathetic, compassionate AI Counselor and Mental Health Support Mentor at Meridian Guide by Flaxyss using Cognitive Behavioral Therapy principles.
Language: ${locale}.
Validate stress and burnout warmly. Do not issue stressful to-do lists. Focus on emotional grounding and deep self-compassion.`;

        try {
          const text = await callGemini(userMessage, systemPrompt);
          return Response.json({ reply: text, source: "gemini" });
        } catch {
          return Response.json({
            reply: getFallbackPsychologistReply(locale),
            source: "rules",
          });
        }
      }

      return Response.json({
        reply: getFallbackPsychologistReply(locale),
        source: "rules",
      });
    }

    if (action === "major_matching") {
      const interests = payload?.interests || "Technology and analytics";

      if (hasKey) {
        const systemPrompt = `You are an academic advisor at Meridian Guide by Flaxyss.
Suggest the top 3 best-fitting majors for this student profile in language ${locale}.`;
        try {
          const text = await callGemini(interests, systemPrompt);
          return Response.json({ result: text, source: "gemini" });
        } catch {
          return Response.json({
            result: `Recommended majors based on profile: Computer Science, Artificial Intelligence, and Data Science.`,
            source: "rules",
          });
        }
      }

      return Response.json({
        result: `Recommended majors based on profile: Computer Science, Artificial Intelligence, and Data Science.`,
        source: "rules",
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

function getFallbackInterviewFeedback(locale: "en" | "kk" | "ru"): InterviewFeedback {
  if (locale === "kk") {
    return {
      overallScore: 84,
      cadenceScore: 82,
      clarityScore: 88,
      poiseScore: 85,
      contentScore: 81,
      strengths: [
        "Нақты және сенімді дауыс ырғағы",
        "Мақсатты нақты дәлелдермен көрсету",
      ],
      improvements: [
        "Қысқа үзілістер жасап, ойды жүйелеу",
        "Нақты тәжірибеден мысал келтіру",
      ],
      qualitativeSummary:
        "Жауап өте жақсы құрылымдалған және сенімді естіледі. Дәлелдемелерді нақтылай түсу сұхбатты одан әрі күшейтеді.",
    };
  }

  if (locale === "ru") {
    return {
      overallScore: 85,
      cadenceScore: 83,
      clarityScore: 89,
      poiseScore: 86,
      contentScore: 82,
      strengths: [
        "Уверенная подача и хорошая дикция",
        "Логичная последовательность изложения мыслей",
      ],
      improvements: [
        "Добавить больше конкретных метрик из личного опыта",
        "Сфокусироваться на ценности для университетского сообщества",
      ],
      qualitativeSummary:
        "Отличная аргументация и контакт с аудиторией. Ответ звучит естественно и демонстрирует лидерский потенциал.",
    };
  }

  return {
    overallScore: 86,
    cadenceScore: 84,
    clarityScore: 89,
    poiseScore: 87,
    contentScore: 84,
    strengths: [
      "Natural and engaging vocal presence",
      "Clear articulation of personal motivation",
    ],
    improvements: [
      "Incorporate more quantifiable milestones from your past work",
      "Connect personal goals more explicitly with the university curriculum",
    ],
    qualitativeSummary:
      "Compelling delivery with good pacing and self-assurance. Adding 1-2 vivid personal anecdotes will make this response memorable to the committee.",
  };
}

function getFallbackRecommendations(field: string, locale: "en" | "kk" | "ru") {
  if (field === "Artificial Intelligence" || field === "Computer Science") {
    return [
      {
        id: "cs-kaggle",
        title: "Kaggle Machine Learning Competition",
        category: "Competition",
        field,
        role: "Lead ML Developer",
        description:
          "Compete in a global tabular or computer vision challenge to demonstrate applied modeling capability.",
        impactPotential: "Very High",
        level: "international",
        estimatedHoursPerWeek: 5,
        xpReward: 350,
        roadmapTaskTitle: "Submit baseline model to Kaggle competition",
      },
      {
        id: "cs-opensource",
        title: "Open-Source Repository Contributions",
        category: "Project",
        field,
        role: "Open-Source Contributor",
        description:
          "Submit pull requests, bug fixes, or new documentation to established GitHub developer tools.",
        impactPotential: "High",
        level: "international",
        estimatedHoursPerWeek: 4,
        xpReward: 300,
        roadmapTaskTitle: "Contribute 3 merged pull requests to open-source",
      },
      {
        id: "cs-research",
        title: "Preprint Research Paper on arXiv",
        category: "Research",
        field,
        role: "Co-Author / Researcher",
        description:
          "Collaborate with a university professor on a reproducible empirical study in machine learning.",
        impactPotential: "Elite",
        level: "international",
        estimatedHoursPerWeek: 6,
        xpReward: 500,
        roadmapTaskTitle: "Draft and submit research abstract to advisor",
      },
    ];
  }

  return [
    {
      id: "gen-olympiad",
      title: "National Academic Olympiad",
      category: "Olympiad",
      field,
      role: "Participant / Finalist",
      description:
        "Compete against top regional students to earn recognized awards and test rigorous analytical depth.",
      impactPotential: "Very High",
      level: "national",
      estimatedHoursPerWeek: 5,
      xpReward: 350,
      roadmapTaskTitle: "Register and complete qualifying round of Olympiad",
    },
    {
      id: "gen-leadership",
      title: "Student Organization Initiative",
      category: "Leadership",
      field,
      role: "Founder / President",
      description:
        "Launch an impactful peer-led club, seminar series, or mentorship drive serving at least 50 members.",
      impactPotential: "High",
      level: "city",
      estimatedHoursPerWeek: 4,
      xpReward: 250,
      roadmapTaskTitle: "Organize first community workshop or seminar",
    },
    {
      id: "gen-research",
      title: "Independent Inquiry Capstone",
      category: "Research",
      field,
      role: "Principal Author",
      description:
        "Write an evidence-backed inquiry paper addressing an unsolved problem in your field.",
      impactPotential: "Elite",
      level: "national",
      estimatedHoursPerWeek: 6,
      xpReward: 450,
      roadmapTaskTitle: "Complete capstone paper draft with citations",
    },
  ];
}

function getFallbackEssayOutline(university: string, prompt: string, locale: "en" | "kk" | "ru") {
  return `### Strategic Essay Architecture for ${university}

**Part 1: The Intellectual Spark (15% of word count)**
- Ground yourself in an authentic problem or project you encountered.
- Show curiosity in action rather than merely stating interest.

**Part 2: Active Exploration & Struggle (35% of word count)**
- Detail your journey: what obstacles you hit, what you learned, and how your thinking evolved.
- Demonstrate leadership, collaboration, and resilience.

**Part 3: The Direct Institutional Fit (35% of word count)**
- Connect your trajectory directly to specific professors, research labs, or distinctive culture at ${university}.
- Explain not just what you will take from the institution, but what you will contribute.

**Part 4: Forward Horizon (15% of word count)**
- Envision your long-term legacy after graduation.
- End on an inspiring, grounded, and memorable note.`;
}

function getFallbackPsychologistReply(locale: "en" | "kk" | "ru") {
  if (locale === "kk") {
    return "Өзіңізге тым қатал қарамаңыз. Университетке түсу — үлкен қажыр-қайратты талап ететін кезең, және шаршау сезімі әбден орынды. Қазір терең тыныс алып, аз ғана уақыт тынығыңыз. Сіз дұрыс жолда келе жатырсыз.";
  }
  if (locale === "ru") {
    return "Я прекрасно понимаю, какую нагрузку вы сейчас несете. Поступление — это действительно непростой период, и чувствовать усталость или тревогу совершенно нормально. Сделайте глубокий вдох: вы справляетесь лучше, чем кажется. Позвольте себе немного отдохнуть.";
  }
  return "I hear how much pressure you are carrying right now. University applications can feel completely all-consuming, and feeling drained or anxious is completely natural. Take a slow, deep breath: you are doing far better than you give yourself credit for, and taking pause to rest is an essential part of success.";
}

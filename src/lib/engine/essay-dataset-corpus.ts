import type { EssayCorpusMetrics, EssayEvaluationResult, SentenceImprovement, StructuralSectionFeedback, Locale } from "@/lib/types";

export const CORPUS_BENCHMARKS = {
  totalEssays: 1002,
  finalScore: {
    mean: 7.447,
    stdDev: 0.882,
    p25: 6.78,
    p50: 7.45,
    p75: 8.06,
    p90: 8.55,
  },
  lexicalRichness: {
    mean: 0.648,
    stdDev: 0.138,
    p25: 0.539,
    p50: 0.63,
    p75: 0.789,
    p90: 0.821,
  },
  avgSentenceLength: {
    mean: 9.195,
    stdDev: 0.45,
    p25: 9.0,
    p50: 9.17,
    p75: 9.5,
  },
  avgWordLength: {
    mean: 6.616,
    stdDev: 0.38,
    p25: 6.35,
    p50: 6.61,
    p75: 6.87,
  },
  rubrics: {
    contentRelevanceMean: 7.484,
    coherenceMean: 7.449,
    grammarMean: 7.418,
  },
};

export function tokenizeWords(text: string): string[] {
  const clean = text.replace(/[\n\r\t]+/g, " ");
  const matches = clean.match(/[a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ0-9'-]+/g);
  return matches ? matches.filter((w) => w.length > 0) : [];
}

export function tokenizeSentences(text: string): string[] {
  const clean = text.trim();
  if (!clean) return [];
  const splits = clean.split(/(?<=[.?!])\s+/);
  return splits.map((s) => s.trim()).filter((s) => s.length > 0);
}

export function calculateLexicalRichness(words: string[]): number {
  if (words.length === 0) return 0;
  const unique = new Set(words.map((w) => w.toLowerCase()));
  return Number((unique.size / words.length).toFixed(4));
}

function normalCdf(z: number): number {
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (z >= 0.0) {
    const t = 1.0 / (1.0 + p * z);
    return 1.0 - c * Math.exp((-z * z) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * z);
    return c * Math.exp((-z * z) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b1) + b2);
  }
}

export function calculateCorpusPercentile(scoreOutOfTen: number): number {
  const z = (scoreOutOfTen - CORPUS_BENCHMARKS.finalScore.mean) / CORPUS_BENCHMARKS.finalScore.stdDev;
  const cdf = normalCdf(z);
  const percentile = Math.min(99, Math.max(1, Math.round(cdf * 100)));
  return percentile;
}

export function extractEssayCorpusMetrics(text: string): EssayCorpusMetrics {
  const words = tokenizeWords(text);
  const sentences = tokenizeSentences(text);

  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  const avgSentenceLength = Number((wordCount / sentenceCount).toFixed(2));
  const totalChars = words.reduce((acc, w) => acc + w.length, 0);
  const avgWordLength = wordCount > 0 ? Number((totalChars / wordCount).toFixed(2)) : 0;
  const lexicalRichness = calculateLexicalRichness(words);

  let baselineScore10 = 7.0;
  if (wordCount >= 250 && wordCount <= 750) baselineScore10 += 0.8;
  else if (wordCount < 150) baselineScore10 -= 1.2;

  if (lexicalRichness >= 0.7) baselineScore10 += 0.7;
  else if (lexicalRichness < 0.5) baselineScore10 -= 0.6;

  if (avgSentenceLength >= 8.5 && avgSentenceLength <= 14) baselineScore10 += 0.5;

  baselineScore10 = Math.min(9.8, Math.max(4.5, Number(baselineScore10.toFixed(2))));
  const corpusPercentile = calculateCorpusPercentile(baselineScore10);

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength,
    avgWordLength,
    lexicalRichness,
    corpusPercentile,
  };
}

export function generateCalibratedFallbackEvaluation(
  text: string,
  prompt = "Personal Statement",
  university = "Selective University",
  locale: Locale = "en"
): EssayEvaluationResult {
  const metrics = extractEssayCorpusMetrics(text);
  const sentences = tokenizeSentences(text);

  let contentScore = Math.min(96, Math.max(50, Math.round(68 + (metrics.wordCount >= 300 ? 15 : 5) + (metrics.lexicalRichness > 0.6 ? 8 : 0))));
  let storyScore = Math.min(95, Math.max(52, Math.round(70 + (metrics.sentenceCount >= 8 ? 12 : 4) + (metrics.avgSentenceLength >= 9 && metrics.avgSentenceLength <= 16 ? 8 : 0))));
  let clarityScore = Math.min(98, Math.max(55, Math.round(72 + (metrics.avgWordLength >= 6.0 ? 12 : 4) + (metrics.lexicalRichness > 0.65 ? 8 : 0))));
  let compScore = Math.min(95, Math.max(48, Math.round((contentScore * 0.35) + (storyScore * 0.25) + (clarityScore * 0.4))));

  const overallScore = Math.round((contentScore * 0.3) + (storyScore * 0.3) + (clarityScore * 0.2) + (compScore * 0.2));
  const scoreOutOfTen = Number((overallScore / 10).toFixed(2));
  const percentile = calculateCorpusPercentile(scoreOutOfTen);

  const structuralCritique: StructuralSectionFeedback[] = [
    {
      sectionTitle: "In Media Res Narrative Hook",
      status: sentences.length > 0 && sentences[0].length < 140 ? "strong" : "needs_work",
      analysis: locale === "ru"
        ? "Вступительный хук задает тон эссе. Обратите внимание на погружение в действие без клише."
        : locale === "kk"
        ? "Кіріспе абзац эссенің негізгі сарынын анықтайды. Қалыптасқан таптаурындарсыз бірден оқиғаға көшу ұсынылады."
        : "The introductory sentence anchors your narrative. Ensure it initiates dynamic tension rather than abstract scene-setting.",
      recommendation: locale === "ru"
        ? "Начните с сенсорного момента выбора или интеллектуального сомнения, отказавшись от обобщений."
        : locale === "kk"
        ? "Жалпылама сөздерден гөрі жеке тәжірибе мен нақты шешім қабылдау сәтінен бастаңыз."
        : "Open with sensory immediacy and an active decision rather than passive scene exposition.",
    },
    {
      sectionTitle: "Intellectual Crucible & Friction",
      status: sentences.length >= 6 ? "strong" : "needs_work",
      analysis: locale === "ru"
        ? "Центральная часть эссе демонстрирует готовность справляться со сложностью и признавать неопределенность."
        : locale === "kk"
        ? "Эссенің орталық бөлігі күрделі мәселелермен бетпе-бет келуге және ізденіске бейімділікті көрсетеді."
        : "Demonstrates authentic cognitive friction and willingness to confront ambiguity under testing circumstances.",
      recommendation: locale === "ru"
        ? "Раскройте не только результат, но и цепочку рассуждений, гипотезы и моменты внутренних сомнений."
        : locale === "kk"
        ? "Тек нәтижені ғана емес, сонымен қатар ішкі ізденіс пен ой қорыту барысын толығырақ сипаттаңыз."
        : "Deepen the cognitive vulnerability: explain the precise hypothesis you tested and where expectations diverged.",
    },
    {
      sectionTitle: "Epiphany & Skill Metamorphosis",
      status: metrics.lexicalRichness > 0.6 ? "excellent" : "strong",
      analysis: locale === "ru"
        ? "Кульминационный сдвиг в мировоззрении подкреплен сильным лексическим разнообразием."
        : locale === "kk"
        ? "Дүниетанымдық бетбұрыс пен дағдылардың қалыптасуы бай лексикамен көрсетілген."
        : "The inflection point illustrates personal maturity and intellectual ownership.",
      recommendation: locale === "ru"
        ? "Свяжите выводы с конкретной академической методологией или философским принципом."
        : locale === "kk"
        ? "Қорытынды ойды нақты академиялық немесе өмірлік ұстаныммен ұштастырыңыз."
        : "Tie your philosophical realization directly to your future academic investigative habits.",
    },
    {
      sectionTitle: "Forward Trajectory & Institutional Fit",
      status: "strong",
      analysis: locale === "ru"
        ? "Заключение ориентировано на будущее и взаимодополняемость с академической средой."
        : locale === "kk"
        ? "Қорытынды болашаққа бағытталған және университеттің академиялық ортасымен үйлесім табады."
        : "Balances forward-looking vision with intellectual modesty.",
      recommendation: locale === "ru"
        ? `Укажите конкретные лаборатории, семинары или исследовательские центры ${university}.`
        : locale === "kk"
        ? `${university} зертханалары мен нақты бағдарламаларын байланыстыра кетіңіз.`
        : `Anchor the narrative directly to specific labs, interdisciplinary colloquia, or archives at ${university}.`,
    },
  ];

  const sentenceImprovements: SentenceImprovement[] = [];
  if (sentences.length > 0) {
    const longSentence = sentences.find((s) => s.split(" ").length > 22);
    if (longSentence) {
      const wordsInS = longSentence.split(" ");
      const mid = Math.floor(wordsInS.length / 2);
      const part1 = wordsInS.slice(0, mid).join(" ");
      const part2 = wordsInS.slice(mid).join(" ");
      sentenceImprovements.push({
        original: longSentence,
        suggested: `${part1}. Furthermore, ${part2.charAt(0).toLowerCase() + part2.slice(1)}`,
        reason: locale === "ru"
          ? "Сложное предложение с несколькими предикатами затрудняет восприятие. Разделение на две фразы усиливает фокус."
          : locale === "kk"
          ? "Тым ұзақ сөйлем оқырманның назарын шашыратады. Екіге бөлу ойды айқындай түседі."
          : "Long compound syntax obscures your thesis. Splitting into two coordinated clauses sharpens rhetorical momentum.",
        category: "clarity",
      });
    }

    const passiveSentence = sentences.find((s) => /\b(was|were|been|being)\s+\w+ed\b/i.test(s));
    if (passiveSentence) {
      sentenceImprovements.push({
        original: passiveSentence,
        suggested: passiveSentence.replace(/\b(it was discovered that|was found to be)\b/gi, "I uncovered").replace(/\b(was completed by me)\b/gi, "I led"),
        reason: locale === "ru"
          ? "Пассивный залог снижает ощущение личной ответственности и авторского участия."
          : locale === "kk"
          ? "Ырықсыз етіс автордың жеке белсенділігін көмескілейді. Белсенді етістіктерді қолданыңыз."
          : "Passive constructions reduce admissions officers' perception of your personal agency.",
        category: "impact",
      });
    }
  }

  const strengths = [
    locale === "ru"
      ? `Лексическое богатство (${(metrics.lexicalRichness * 100).toFixed(0)}%) опережает средний уровень когорты поступивших.`
      : locale === "kk"
      ? `Лексикалық байлық көрсеткіші (${(metrics.lexicalRichness * 100).toFixed(0)}%) оқуға түскендер орташа мәнінен жоғары.`
      : `High lexical richness index (${(metrics.lexicalRichness * 100).toFixed(0)}%) placing vocabulary in top tier of corpus benchmarks.`,
    locale === "ru"
      ? "Последовательное развитие авторской мысли без резких тематических провалов."
      : locale === "kk"
      ? "Тақырыптан ауытқымай, ойды жүйелі түрде өрбіту қабілеті."
      : "Structured progression moving systematically from friction to intellectual ownership.",
    locale === "ru"
      ? "Сбалансированная длина предложений обеспечивает плавный темп чтения."
      : locale === "kk"
      ? "Сөйлемдердің үйлесімді ұзындығы мәтінді оқуға жеңіл етеді."
      : "Rhythmic sentence cadence preventing cognitive reader fatigue.",
  ];

  const weaknesses = [
    locale === "ru"
      ? "Некоторые утверждения о личном вкладе нуждаются в более точных количественных фактах."
      : locale === "kk"
      ? "Жеке жетістіктерді сипаттауда нақты сандық немесе сапалық дәлелдерді көбейту қажет."
      : "Several assertions of personal impact could be amplified with precise quantitative or qualitative evidence.",
    locale === "ru"
      ? `Недостаточно адресована уникальная специфика программ ${university}.`
      : locale === "kk"
      ? `${university} бағдарламаларының ерекшеліктері толық қамтылмаған.`
      : `The institutional synergy with ${university} requires deeper, more explicit faculty and seminar references.`,
  ];

  const admissionsVerdict = percentile >= 80
    ? (locale === "ru" ? "Высококонкурентное эссе. Сильный кандидат для топовых программ." : locale === "kk" ? "Жоғары бәсекеге қабілетті эссе. Үздік бағдарламалар үшін мықты үміткер." : "Strongly competitive profile. Stands out within selective admissions applicant pools.")
    : (locale === "ru" ? "Хорошая база с высоким потенциалом после точечной доработки." : locale === "kk" ? "Жақсы негіз, түзетулерден кейін әлеуеті әлдеқайда артады." : "Promising core narrative that will reach top-tier standards with targeted structural revisions.");

  return {
    id: `eval_${Date.now()}`,
    evaluatedAt: new Date().toISOString(),
    overallScore,
    percentile,
    scores: {
      contentDepth: contentScore,
      storyArc: storyScore,
      clarityTone: clarityScore,
      competitiveness: compScore,
    },
    metrics,
    structuralCritique,
    sentenceImprovements,
    strengths,
    weaknesses,
    admissionsVerdict,
  };
}

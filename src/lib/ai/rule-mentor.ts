import { tr } from "@/lib/i18n/catalog";
import type { StudentContext } from "./context";

function list(items: string[]): string {
  return items.map((item) => `• ${item}`).join("\n");
}

const intents = {
  deadlines: /deadline|when|due|date|дедлайн|срок|когда|мерзім|қашан/,
  funding: /scholarship|funding|aid|money|afford|budget|стипенд|грант|деньг|бюджет|шәкіртақы|қаржы|ақша/,
  chances: /chance|probability|get in|admit|odds|шанс|вероятн|поступ|мүмкіндік|түсу/,
  essay: /essay|statement|write|эссе|мотивац|письм|жазу/,
  gaps: /weak|improve|better|gap|слаб|улучш|пробел|әлсіз|жақсарт/,
  universities: /universit|school|where|recommend|apply|университет|вуз|куда|рекоменд|қайда|ұсын/,
};

export function ruleBasedMentorReply(question: string, context: StudentContext): string {
  const q = question.toLowerCase();
  const next = context.roadmap.nextAction;
  const closing = next ? `\n\n${tr("Next action: {title}. {why}", { title: next.title, why: next.why })}` : "";

  if (intents.deadlines.test(q)) {
    if (!context.upcomingDeadlines.length) return tr("You haven't added universities to your tracker yet, so there are no deadlines to watch. Add at least three from your recommendations.") + closing;
    const items = context.upcomingDeadlines.map((d) =>
      d.verification === "needs_verification"
        ? tr("{university} — {label}: {date} ({days} days) · needs verification", { university: d.university, label: tr(d.label), date: d.date, days: d.daysLeft })
        : tr("{university} — {label}: {date} ({days} days)", { university: d.university, label: tr(d.label), date: d.date, days: d.daysLeft }),
    );
    return `${tr("Upcoming deadlines on your list:")}\n${list(items)}${closing}`;
  }

  if (intents.funding.test(q)) {
    if (!context.scholarshipMatches.length) {
      return tr("No scholarships in the catalog currently match more than half of your criteria. Universities that meet full need for international students are your strongest option if the budget is tight.") + closing;
    }
    const items = context.scholarshipMatches.map((s) =>
      s.unmet.length
        ? tr("{name} — {eligibility} of criteria met (gap: {gap})", { name: tr(s.name), eligibility: s.eligibility, gap: s.unmet[0] })
        : tr("{name} — {eligibility} of criteria met", { name: tr(s.name), eligibility: s.eligibility }),
    );
    return `${tr("Your strongest scholarship matches:")}\n${list(items)}${closing}`;
  }

  if (intents.chances.test(q)) {
    if (!context.recommendations.length) return tr("Add your intended field of study so I can estimate admission ranges.") + closing;
    const items = context.recommendations
      .slice(0, 5)
      .map((r) => tr("{university} — {range}, {confidence} confidence ({tier})", { university: r.university, range: r.admissionRange, confidence: tr(r.confidence), tier: tr(r.tier) }));
    return `${tr("Estimated admission ranges (prototype model, not a guarantee):")}\n${list(items)}${closing}`;
  }

  if (intents.essay.test(q)) {
    const strongest = [...context.diagnostics.dimensions].filter((d) => d.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    const anchor = strongest ? ` ${tr("Your strongest signal is {signal}, so a moment from that part of your life is a natural anchor.", { signal: strongest.label.toLowerCase() })}` : "";
    return `${tr("Build your personal statement around one concrete story rather than a list of achievements.")}${anchor} ${tr("Show what you did, what changed, and what you want to explore next at university.")}${closing}`;
  }

  if (intents.gaps.test(q)) {
    const weakest = [...context.diagnostics.dimensions].sort((a, b) => (a.score ?? -1) - (b.score ?? -1)).slice(0, 2);
    const items = weakest.map((d) => (d.score === null ? tr("{label}: no data yet", { label: d.label }) : tr("{label}: {score}/100 ({band})", { label: d.label, score: d.score, band: tr(d.band) })));
    return `${tr("The areas holding your profile back most:")}\n${list(items)}${closing}`;
  }

  if (intents.universities.test(q)) {
    if (!context.recommendations.length) return tr("Complete your academic interests and preferences so I can recommend universities.") + closing;
    const items = context.recommendations
      .slice(0, 5)
      .map((r) => tr("{university} — {tier}, match {score}, {fit}", { university: r.university, tier: tr(r.tier), score: r.matchScore, fit: tr(r.financialFit) }));
    return `${tr("Based on fit, budget and admission ranges:")}\n${list(items)}${closing}`;
  }

  const progress = context.roadmap.currentLevel
    ? tr("Your roadmap is {percent}% complete and you're on the {level} level.", { percent: context.roadmap.progressPercent, level: context.roadmap.currentLevel })
    : tr("Your roadmap is {percent}% complete.", { percent: context.roadmap.progressPercent });
  return `${context.diagnostics.summary} ${progress}${closing}`;
}

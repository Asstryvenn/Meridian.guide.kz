import type { StudentContext } from "./context";

function list(items: string[]): string {
  return items.map((item) => `• ${item}`).join("\n");
}

export function ruleBasedMentorReply(question: string, context: StudentContext): string {
  const q = question.toLowerCase();
  const next = context.roadmap.nextAction;
  const closing = next ? `\n\nNext action: ${next.title}. ${next.why}` : "";

  if (/deadline|when|due|date/.test(q)) {
    if (!context.upcomingDeadlines.length) return `You haven't added universities to your tracker yet, so there are no deadlines to watch. Add at least three from your recommendations.${closing}`;
    return `Upcoming deadlines on your list:\n${list(
      context.upcomingDeadlines.map((d) => `${d.university} — ${d.label}: ${d.date} (${d.daysLeft} days)${d.verification === "needs_verification" ? " · needs verification" : ""}`),
    )}${closing}`;
  }

  if (/scholarship|funding|aid|money|afford|budget/.test(q)) {
    if (!context.scholarshipMatches.length) return `No scholarships in the catalog currently match more than half of your criteria. Universities that meet full need for international students are your strongest option if the budget is tight.${closing}`;
    return `Your strongest scholarship matches:\n${list(context.scholarshipMatches.map((s) => `${s.name} — ${s.eligibility} of criteria met${s.unmet.length ? ` (gap: ${s.unmet[0]})` : ""}`))}${closing}`;
  }

  if (/chance|probability|get in|admit|odds/.test(q)) {
    if (!context.recommendations.length) return `Add your intended field of study so I can estimate admission ranges.${closing}`;
    return `Estimated admission ranges (prototype model, not a guarantee):\n${list(
      context.recommendations.slice(0, 5).map((r) => `${r.university} — ${r.admissionRange}, ${r.confidence} confidence (${r.tier})`),
    )}${closing}`;
  }

  if (/essay|statement|write/.test(q)) {
    const strongest = [...context.diagnostics.dimensions].filter((d) => d.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    return `Build your personal statement around one concrete story rather than a list of achievements. ${
      strongest ? `Your strongest signal is ${strongest.label.toLowerCase()}, so a moment from that part of your life is a natural anchor.` : ""
    } Show what you did, what changed, and what you want to explore next at university.${closing}`;
  }

  if (/weak|improve|better|gap/.test(q)) {
    const weakest = [...context.diagnostics.dimensions].sort((a, b) => (a.score ?? -1) - (b.score ?? -1)).slice(0, 2);
    return `The areas holding your profile back most:\n${list(weakest.map((d) => `${d.label}: ${d.score === null ? "no data yet" : `${d.score}/100 (${d.band})`}`))}${closing}`;
  }

  if (/universit|school|where|recommend|apply/.test(q)) {
    if (!context.recommendations.length) return `Complete your academic interests and preferences so I can recommend universities.${closing}`;
    return `Based on fit, budget and admission ranges:\n${list(context.recommendations.slice(0, 5).map((r) => `${r.university} — ${r.tier}, match ${r.matchScore}, ${r.financialFit}`))}${closing}`;
  }

  return `${context.diagnostics.summary} Your roadmap is ${context.roadmap.progressPercent}% complete${context.roadmap.currentLevel ? ` and you're on the ${context.roadmap.currentLevel} level` : ""}.${closing}`;
}

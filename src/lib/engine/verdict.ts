import type { Recommendation } from "./matching";

export interface Verdict {
  headline: string;
  points: string[];
}

export function compareVerdict(items: Recommendation[]): Verdict | null {
  if (items.length < 2) return null;
  const byChance = [...items].sort((a, b) => b.prediction.midpoint - a.prediction.midpoint);
  const byFit = [...items].sort((a, b) => b.matchScore - a.matchScore);
  const byMoney = [...items].sort((a, b) => b.financial.score - a.financial.score);
  const byResearch = [...items].sort((a, b) => b.university.researchStrength - a.university.researchStrength);

  const points: string[] = [];
  points.push(`${byChance[0].university.shortName} gives you the best admission odds (${byChance[0].prediction.low}–${byChance[0].prediction.high}%).`);
  if (byMoney[0].university.slug !== byChance[0].university.slug || byMoney[0].financial.score > byMoney[1].financial.score) {
    points.push(`${byMoney[0].university.shortName} has the most realistic funding path: ${byMoney[0].financial.detail.charAt(0).toLowerCase()}${byMoney[0].financial.detail.slice(1)}`);
  }
  if (byResearch[0].university.researchStrength > byResearch[byResearch.length - 1].university.researchStrength) {
    points.push(`${byResearch[0].university.shortName} offers the strongest research environment, which matters for a graduate-school path.`);
  }
  const risky = items.filter((i) => i.financial.label === "Needs aid" && i.financial.score < 0.5);
  if (risky.length) points.push(`${risky.map((r) => r.university.shortName).join(" and ")} would need a major scholarship to be affordable.`);

  const best = byFit[0];
  const headline =
    best.tier === "Dream"
      ? `${best.university.shortName} fits you best overall — apply, but pair it with a Target and a Safety.`
      : `${best.university.shortName} is the strongest overall fit for your profile.`;

  return { headline, points };
}

import type { Recommendation } from "./matching";
import { tr } from "@/lib/i18n/catalog";

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
  points.push(tr("{name} gives you the best admission odds ({low}–{high}%).", { name: byChance[0].university.shortName, low: byChance[0].prediction.low, high: byChance[0].prediction.high }));
  if (byMoney[0].university.slug !== byChance[0].university.slug || byMoney[0].financial.score > byMoney[1].financial.score) {
    points.push(tr("{name} has the most realistic funding path: {detail}", { name: byMoney[0].university.shortName, detail: byMoney[0].financial.detail }));
  }
  if (byResearch[0].university.researchStrength > byResearch[byResearch.length - 1].university.researchStrength) {
    points.push(tr("{name} offers the strongest research environment, which matters for a graduate-school path.", { name: byResearch[0].university.shortName }));
  }
  const risky = items.filter((i) => i.financial.label === "Needs aid" && i.financial.score < 0.5);
  if (risky.length) points.push(tr("{names} would need a major scholarship to be affordable.", { names: risky.map((r) => r.university.shortName).join(", ") }));

  const best = byFit[0];
  const headline =
    best.tier === "Dream"
      ? tr("{name} fits you best overall — apply, but pair it with a Target and a Safety.", { name: best.university.shortName })
      : tr("{name} is the strongest overall fit for your profile.", { name: best.university.shortName });

  return { headline, points };
}

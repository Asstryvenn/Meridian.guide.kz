import { universities } from "@/lib/data/universities";
import type { FieldOfStudy, StudentProfile, Tier, University } from "@/lib/types";
import { predictAdmission, type Prediction } from "./prediction";
import { ieltsEquivalent } from "./profile-metrics";

export interface FinancialFit {
  score: number;
  label: "Within budget" | "Stretch" | "Needs aid" | "Needs verification";
  annualCostUsd: [number, number] | null;
  detail: string;
}

export interface Recommendation {
  university: University;
  tier: Tier;
  matchScore: number;
  prediction: Prediction;
  financial: FinancialFit;
  matchedPrograms: string[];
  reasons: string[];
  mainGap: string;
}

const relatedFields: Partial<Record<FieldOfStudy, FieldOfStudy[]>> = {
  "Computer Science": ["Artificial Intelligence", "Data Science", "Electrical Engineering", "Mathematics"],
  "Artificial Intelligence": ["Computer Science", "Data Science", "Mathematics"],
  "Data Science": ["Computer Science", "Artificial Intelligence", "Mathematics", "Economics"],
  "Electrical Engineering": ["Computer Science", "Physics", "Mechanical Engineering"],
  "Mechanical Engineering": ["Electrical Engineering", "Physics"],
  Business: ["Economics", "Data Science"],
  Economics: ["Business", "Mathematics", "Data Science"],
  Medicine: ["Biology"],
  Biology: ["Medicine"],
  Physics: ["Mathematics", "Electrical Engineering"],
  Mathematics: ["Physics", "Computer Science", "Data Science"],
  Design: ["Mechanical Engineering"],
};

export function fieldFit(profile: StudentProfile, university: University) {
  const direct = university.programs.filter((p) => profile.fields.includes(p.field));
  if (direct.length) return { score: 1, programs: direct.map((p) => p.name) };
  const related = university.programs.filter((p) => profile.fields.some((f) => relatedFields[f]?.includes(p.field)));
  if (related.length) return { score: 0.55, programs: related.map((p) => p.name) };
  return { score: profile.fields.length ? 0 : 0.5, programs: [] };
}

export function financialFit(profile: StudentProfile, university: University): FinancialFit {
  const tuition = university.intlTuitionUsd.value;
  const living = university.livingCostUsd.value ?? 0;
  if (tuition === null) {
    return { score: 0.5, label: "Needs verification", annualCostUsd: null, detail: "Tuition for your situation is not published. Confirm with admissions." };
  }
  const cost: [number, number] = [tuition[0] + living, tuition[1] + living];
  const budget = profile.annualBudgetUsd;
  const aid = university.needBasedAidIntl.value;

  if (budget >= cost[1]) {
    return { score: 1, label: "Within budget", annualCostUsd: cost, detail: "Your stated budget covers estimated tuition and living costs." };
  }
  if (profile.needsAid && aid === "full_need") {
    return { score: 0.85, label: "Needs aid", annualCostUsd: cost, detail: "Above your budget, but this university meets full demonstrated need for admitted international students." };
  }
  const ratio = budget / cost[0];
  if (ratio >= 0.75) {
    return { score: 0.65, label: "Stretch", annualCostUsd: cost, detail: "Close to your budget; a partial scholarship would close the gap." };
  }
  return {
    score: Math.max(0.05, ratio * 0.6 + (aid === "limited" ? 0.1 : 0)),
    label: "Needs aid",
    annualCostUsd: cost,
    detail: aid === "none" ? "Well above your budget and no need-based aid for international students." : "Well above your budget; would require a major scholarship.",
  };
}

function preferenceFit(profile: StudentProfile, university: University): number {
  const checks: number[] = [];
  if (profile.preferredCountries.length) checks.push(profile.preferredCountries.includes(university.country) ? 1 : 0);
  if (profile.preferredRegions.length) checks.push(profile.preferredRegions.includes(university.region) ? 1 : 0.2);
  if (profile.campusType !== "any") checks.push(profile.campusType === university.campus ? 1 : 0.4);
  if (profile.institutionType !== "any") checks.push(profile.institutionType === university.type ? 1 : 0.4);
  if (profile.size !== "any") checks.push(profile.size === university.size ? 1 : 0.5);
  if (!checks.length) return 0.7;
  const locationMatched = profile.preferredCountries.includes(university.country) || profile.preferredRegions.includes(university.region);
  const average = checks.reduce((a, b) => a + b, 0) / checks.length;
  return profile.preferredCountries.length || profile.preferredRegions.length ? Math.max(average, locationMatched ? 0.6 : 0) : average;
}

function researchFit(profile: StudentProfile, university: University): number {
  const wantsResearch = profile.gradSchool === "phd" ? 1 : profile.gradSchool === "masters" ? 0.6 : 0.3;
  return 1 - Math.abs(wantsResearch - university.researchStrength / 5) * 0.6;
}

function tierFor(prediction: Prediction): Tier {
  if (prediction.high <= 30 || prediction.midpoint < 22) return "Dream";
  if (prediction.low >= 55) return "Safety";
  return "Target";
}

function describeGap(profile: StudentProfile, university: University, prediction: Prediction, financial: FinancialFit): string {
  const ielts = ieltsEquivalent(profile);
  const minimum = university.requirements.minIelts.value;
  if (minimum !== null && (ielts === null || ielts < minimum)) {
    return ielts === null ? `No English test yet (published minimum IELTS ${minimum}).` : `English score below the published minimum of IELTS ${minimum}.`;
  }
  if (financial.label === "Needs aid" && financial.score < 0.5) return financial.detail;
  if (prediction.negatives[0]) return `${prediction.negatives[0].label}: ${prediction.negatives[0].detail.toLowerCase()}.`;
  if (financial.label === "Stretch") return financial.detail;
  return "No major gap detected — focus on a strong, specific essay.";
}

export function recommend(profile: StudentProfile, pool: University[] = universities, includeUnrelated = false): Recommendation[] {
  return pool
    .map((university) => {
      const field = fieldFit(profile, university);
      const financial = financialFit(profile, university);
      const prediction = predictAdmission(profile, university);
      const preference = preferenceFit(profile, university);
      const research = researchFit(profile, university);
      const matchScore = Math.round((field.score * 0.35 + financial.score * 0.25 + preference * 0.25 + research * 0.15) * 100);

      const reasons: string[] = [];
      if (field.score === 1) reasons.push(`Offers ${field.programs[0]}`);
      else if (field.programs.length) reasons.push(`Related program: ${field.programs[0]}`);
      if (financial.label === "Within budget") reasons.push("Fits your budget");
      if (financial.label === "Needs aid" && financial.score >= 0.8) reasons.push("Meets full need for international students");
      if (profile.preferredCountries.includes(university.country)) reasons.push(`In your preferred country (${university.country})`);
      if (profile.gradSchool === "phd" && university.researchStrength >= 5) reasons.push("Top research environment for a PhD path");
      if (university.scholarshipIds.length) reasons.push("Has scholarships you may qualify for");

      const recommendation: Recommendation = {
        university,
        tier: tierFor(prediction),
        matchScore,
        prediction,
        financial,
        matchedPrograms: field.programs,
        reasons: reasons.slice(0, 3),
        mainGap: describeGap(profile, university, prediction, financial),
      };
      return { recommendation, related: field.score > 0 };
    })
    .filter(({ related }) => includeUnrelated || related)
    .map(({ recommendation }) => recommendation)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function groupByTier(recommendations: Recommendation[]): Record<Tier, Recommendation[]> {
  return {
    Dream: recommendations.filter((r) => r.tier === "Dream"),
    Target: recommendations.filter((r) => r.tier === "Target"),
    Safety: recommendations.filter((r) => r.tier === "Safety"),
  };
}

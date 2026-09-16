import type { Confidence, StudentProfile, University } from "@/lib/types";
import model from "./admission-model.json";
import {
  academicIndex,
  activitiesIndex,
  ieltsEquivalent,
  leadershipIndex,
  researchIndex,
  testIndex,
} from "./profile-metrics";

export interface Factor {
  label: string;
  detail: string;
  weight: number;
}

export interface Prediction {
  low: number;
  high: number;
  midpoint: number;
  confidence: Confidence;
  positives: Factor[];
  negatives: Factor[];
  assumptions: string[];
  model: { version: string; trainingData: string; auc: number; ece: number };
}

const tierPriorRate: Record<University["selectivityTier"], number> = { 1: 0.8, 2: 0.55, 3: 0.3, 4: 0.15, 5: 0.05 };

const logit = (p: number) => Math.log(p / (1 - p));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

interface FeatureVector {
  values: number[];
  assumptions: string[];
  uncertainty: number;
}

function buildFeatures(profile: StudentProfile, university: University): FeatureVector {
  const assumptions: string[] = [];
  let uncertainty = 0;

  let rate = university.acceptanceRate.value;
  if (rate === null) {
    rate = tierPriorRate[university.selectivityTier];
    assumptions.push("Acceptance rate is not published, so selectivity is estimated from the university's peer group.");
    uncertainty += 0.06;
  } else if (university.acceptanceRate.status === "needs_verification") {
    uncertainty += 0.03;
    assumptions.push("Acceptance rate needs verification.");
  }

  let selectivity = logit(Math.min(0.95, Math.max(0.02, rate)));
  if (profile.country && profile.country !== university.country && university.selectivityTier >= 4) {
    selectivity -= 0.6;
    assumptions.push("International applicants usually face a lower admit rate than the published overall figure.");
  }
  const selectiveProgram = university.programs.find((p) => p.selectiveNote && profile.fields.includes(p.field) && /selective|competitive|numerus|admits/i.test(p.selectiveNote));
  if (selectiveProgram) {
    selectivity -= 0.8;
    uncertainty += 0.04;
    assumptions.push(`${selectiveProgram.name} is more selective than the university average.`);
  }

  const academic = academicIndex(profile);
  if (academic === null) {
    assumptions.push("No grades provided; an average applicant record is assumed.");
    uncertainty += 0.08;
  }

  const test = testIndex(profile);
  if (test === null) uncertainty += 0.04;

  const ielts = ieltsEquivalent(profile);
  const minimum = university.requirements.minIelts.value;
  let englishGap = 0;
  if (ielts === null) {
    englishGap = -0.3;
    uncertainty += 0.03;
    assumptions.push("No English test yet; treated as a partial risk.");
  } else if (minimum !== null) {
    englishGap = Math.max(-1, Math.min(0, (ielts - minimum) / 1.5));
  }

  const academicValue = academic ?? 0.7;
  const testValue = test ?? 0.5;
  const activities = activitiesIndex(profile);
  const research = researchIndex(profile);
  const leadership = leadershipIndex(profile);
  const interaction = (0.45 * academicValue + 0.25 * testValue + 0.2 * activities + 0.1 * research - 0.55) * -selectivity;

  return {
    values: [selectivity, academicValue, testValue, test === null ? 1 : 0, englishGap, activities, research, leadership, interaction],
    assumptions,
    uncertainty,
  };
}

function score(intercept: number, coefficients: number[], values: number[]): number {
  return sigmoid(values.reduce((sum, v, i) => sum + v * coefficients[i], intercept));
}

function percentile(sorted: number[], p: number): number {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[index];
}

const reference = [0, 0.78, 0.72, 0, 0, 0.4, 0.1, 0.3, 0];

const factorCopy: Record<string, [string, string]> = {
  academic: ["Grades", "Your academic record compared with typical admits"],
  test: ["Standardised tests", "SAT, ACT, IB or A-Level results"],
  test_missing: ["Missing test score", "No standardised test on file"],
  english_gap: ["English requirement", "Your English score against the published minimum"],
  activities: ["Extracurricular depth", "Level, commitment and evidence of your activities"],
  research: ["Research experience", "Research and substantial technical projects"],
  leadership: ["Leadership", "Roles where you started or led something"],
  strength_x_selectivity: ["Profile strength at this selectivity", "How much your overall profile stands out in this applicant pool"],
};

function confidenceFor(range: number, uncertainty: number): Confidence {
  const canBeHigh = model.training_data !== "synthetic";
  if (canBeHigh && range <= 15 && uncertainty < 0.05) return "high";
  if (range <= 30 && uncertainty < 0.12) return "medium";
  return "low";
}

export function predictAdmission(profile: StudentProfile, university: University): Prediction {
  const { values, assumptions, uncertainty } = buildFeatures(profile, university);
  const midpointRaw = score(model.intercept, model.coefficients, values);
  const samples = model.bootstrap.map(([intercept, ...coefficients]) => score(intercept, coefficients, values)).sort((a, b) => a - b);

  const spread = Math.max(0.03, (percentile(samples, 0.9) - percentile(samples, 0.1)) / 2);
  const width = spread + uncertainty + midpointRaw * 0.12;
  const lowRaw = Math.max(0.01, midpointRaw - width);
  const highRaw = Math.min(0.95, midpointRaw + width);

  const low = Math.max(1, Math.floor((lowRaw * 100) / 5) * 5);
  const high = Math.min(95, Math.max(low + 5, Math.ceil((highRaw * 100) / 5) * 5));

  const contributions = model.features
    .map((feature, i) => ({ feature, contribution: model.coefficients[i] * (values[i] - reference[i]) }))
    .filter(({ feature }) => feature !== "selectivity_logit" && factorCopy[feature]);

  const toFactor = ({ feature, contribution }: { feature: string; contribution: number }): Factor => ({
    label: factorCopy[feature][0],
    detail: factorCopy[feature][1],
    weight: Math.round(contribution * 100) / 100,
  });

  const positives = contributions.filter((c) => c.contribution > 0.08).sort((a, b) => b.contribution - a.contribution).slice(0, 3).map(toFactor);
  const negatives = contributions.filter((c) => c.contribution < -0.08).sort((a, b) => a.contribution - b.contribution).slice(0, 3).map(toFactor);

  if (university.acceptanceRate.value !== null && university.acceptanceRate.value < 0.1) {
    negatives.unshift({ label: "Very low acceptance rate", detail: "Even exceptional applicants are more often rejected than admitted", weight: -1 });
  }

  const confidence = confidenceFor(high - low, uncertainty);

  return {
    low,
    high,
    midpoint: Math.round(midpointRaw * 100),
    confidence,
    positives,
    negatives: negatives.slice(0, 3),
    assumptions,
    model: {
      version: model.version,
      trainingData: model.training_data,
      auc: model.metrics.roc_auc,
      ece: model.metrics.ece,
    },
  };
}

export function formatRange(prediction: Pick<Prediction, "low" | "high">): string {
  if (prediction.high <= 5) return "Under 5%";
  return `${prediction.low}–${prediction.high}%`;
}

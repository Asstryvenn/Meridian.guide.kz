import type { Confidence, StudentProfile, University } from "@/lib/types";
import { genzModelInfo, predictGeneral, referenceLogit, type GenzFeature } from "./genz-model";
import model from "./genz-model.json";
import { msg, tr } from "@/lib/i18n/catalog";
import { ieltsEquivalent } from "./profile-metrics";

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
  generalProbability: number;
  model: { version: string; trainingData: string; auc: number; ece: number };
}

const tierPriorRate: Record<University["selectivityTier"], number> = { 1: 0.8, 2: 0.55, 3: 0.3, 4: 0.15, 5: 0.05 };

const POOL_SENSITIVITY = 0.6;

const logit = (p: number) => Math.log(p / (1 - p));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export const featureCopy: Record<GenzFeature, [string, string]> = {
  high_school_gpa: [msg("Grades"), msg("Your GPA compared with other applicants")],
  sat_score: [msg("SAT"), msg("Your SAT (or converted ACT) score")],
  act_score: [msg("ACT"), msg("Your ACT (or converted SAT) score")],
  attendance_rate: [msg("Attendance"), msg("School attendance rate")],
  ap_courses: [msg("Advanced courses"), msg("AP or equivalent advanced coursework")],
  extracurricular_count: [msg("Extracurriculars"), msg("Number of sustained activities")],
  volunteer_hours: [msg("Volunteering"), msg("Estimated volunteer hours per year")],
  leadership_positions: [msg("Leadership"), msg("Roles where you led or founded something")],
  coding_projects: [msg("Projects"), msg("Independent technical or creative projects")],
  social_media_hours: [msg("Screen time"), msg("Daily social media hours")],
  online_certifications: [msg("Certifications"), msg("Completed online courses and certificates")],
  essay_score: [msg("Essay strength"), msg("Your self-estimated essay quality")],
  recommendation_score: [msg("Recommendations"), msg("Expected strength of teacher letters")],
  interview_score: [msg("Interview"), msg("Self-estimated interview performance")],
};

const totalWeight = model.coefficients.reduce((sum, c) => sum + Math.abs(c), 0);
const weightOf = (feature: GenzFeature) => Math.abs(model.coefficients[model.features.indexOf(feature)]);

function confidenceFor(range: number, missingShare: number): Confidence {
  if (range <= 20 && missingShare < 0.15) return "medium";
  if (range <= 35 && missingShare < 0.4) return "medium";
  return "low";
}

export function predictAdmission(profile: StudentProfile, university: University): Prediction {
  const general = predictGeneral(profile);
  const assumptions: string[] = [];
  let width = 0.35;

  let rate = university.acceptanceRate.value;
  if (rate === null) {
    rate = tierPriorRate[university.selectivityTier];
    assumptions.push(tr("Acceptance rate is not published, so selectivity is estimated from the university's peer group."));
    width += 0.45;
  } else if (university.acceptanceRate.status === "needs_verification") {
    width += 0.2;
    assumptions.push(tr("Acceptance rate needs verification."));
  }

  const reference = referenceLogit(university.selectivityTier, general.imputed);
  let shift = logit(Math.min(0.95, Math.max(0.02, rate))) + POOL_SENSITIVITY * (general.logit - reference) - general.logit;
  if (profile.country && profile.country !== university.country && university.selectivityTier >= 4) {
    shift -= 0.6;
    assumptions.push(tr("International applicants usually face a lower admit rate than the published overall figure."));
  }
  const selectiveProgram = university.programs.find((p) => p.selectiveNote && profile.fields.includes(p.field) && /selective|competitive|numerus|admits/i.test(p.selectiveNote));
  if (selectiveProgram) {
    shift -= 0.8;
    width += 0.3;
    assumptions.push(tr("{program} is more selective than the university average.", { program: tr(selectiveProgram.name) }));
  }

  const negatives: Factor[] = [];
  const ielts = ieltsEquivalent(profile);
  const minimum = university.requirements.minIelts.value;
  if (ielts === null) {
    shift -= 0.5;
    width += 0.2;
    assumptions.push(tr("No English test yet; treated as a partial risk."));
  } else if (minimum !== null && ielts < minimum) {
    shift -= Math.min(2, (minimum - ielts) * 1.6);
    negatives.push({ label: tr("English requirement"), detail: tr("Below the published minimum of IELTS {minimum}", { minimum }), weight: -1.2 });
  }

  const missingShare = general.imputed.reduce((sum, f) => sum + weightOf(f), 0) / totalWeight;
  width += missingShare * 1.1 + (general.high - general.low) * 2;
  const missingKey = general.imputed.filter((f) => weightOf(f) >= 0.35).map((f) => tr(featureCopy[f][0]).toLowerCase());
  if (missingKey.length) assumptions.push(tr("Not yet estimated: {items}. Average applicant values are used until you add them.", { items: missingKey.join(", ") }));

  const center = general.logit + shift;
  const midpointRaw = sigmoid(center);
  const low = Math.max(1, Math.floor((sigmoid(center - width) * 100) / 5) * 5);
  const high = Math.min(95, Math.max(low + 5, Math.ceil((sigmoid(center + width) * 100) / 5) * 5));

  const toFactor = (c: (typeof general.contributions)[number]): Factor => ({ label: tr(featureCopy[c.feature][0]), detail: tr(featureCopy[c.feature][1]), weight: Math.round(c.impact * 100) / 100 });
  const known = general.contributions.filter((c) => !c.imputed && c.feature !== "act_score");
  const positives = known.filter((c) => c.impact > 0.12).sort((a, b) => b.impact - a.impact).slice(0, 3).map(toFactor);
  negatives.push(...known.filter((c) => c.impact < -0.12).sort((a, b) => a.impact - b.impact).slice(0, 3).map(toFactor));

  if (university.acceptanceRate.value !== null && university.acceptanceRate.value < 0.1) {
    negatives.unshift({ label: tr("Very low acceptance rate"), detail: tr("Even exceptional applicants are more often rejected than admitted"), weight: -1 });
  }

  return {
    low,
    high,
    midpoint: Math.round(midpointRaw * 100),
    confidence: confidenceFor(high - low, missingShare),
    positives,
    negatives: negatives.slice(0, 3),
    assumptions,
    generalProbability: general.probability,
    model: {
      version: genzModelInfo.version,
      trainingData: tr("{rows} applicants ({dataset})", { rows: genzModelInfo.rows.toLocaleString("en-US"), dataset: genzModelInfo.datasetName }),
      auc: genzModelInfo.auc,
      ece: genzModelInfo.ece,
    },
  };
}

export function formatRange(prediction: Pick<Prediction, "low" | "high">): string {
  if (prediction.high <= 5) return "Under 5%";
  return `${prediction.low}–${prediction.high}%`;
}

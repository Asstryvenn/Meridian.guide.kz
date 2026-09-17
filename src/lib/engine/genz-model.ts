import type { StudentProfile } from "@/lib/types";
import model from "./genz-model.json";
import { gpaOnFourScale } from "./profile-metrics";

export type GenzFeature = (typeof model.features)[number];

export interface FeatureContribution {
  feature: GenzFeature;
  value: number;
  imputed: boolean;
  impact: number;
}

export interface GeneralPrediction {
  probability: number;
  low: number;
  high: number;
  logit: number;
  imputed: GenzFeature[];
  contributions: FeatureContribution[];
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const actToSat: [number, number][] = [
  [36, 1590], [34, 1540], [32, 1480], [30, 1410], [28, 1340], [26, 1280], [24, 1210], [22, 1150], [20, 1080], [18, 1010], [16, 940], [14, 870], [0, 700],
];

function satFromAct(act: number): number {
  return actToSat.find(([threshold]) => act >= threshold)?.[1] ?? 700;
}

function actFromSat(sat: number): number {
  const match = actToSat.find(([, score]) => sat >= score);
  return match ? match[0] : 12;
}

function countList(text: string): number {
  return text
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

const leadershipPattern = /(founder|president|captain|lead|head|chair|organi[sz]er|director|editor)/i;

export function genzFeatureValues(profile: StudentProfile): { values: Record<GenzFeature, number | null> } {
  const gpa = gpaOnFourScale(profile);
  const sat = profile.sat ?? (profile.act !== null ? satFromAct(profile.act) : null);
  const act = profile.act ?? (profile.sat !== null ? actFromSat(profile.sat) : null);
  const apCount = countList(profile.apCourses);
  const activities = profile.activities;

  const values: Record<GenzFeature, number | null> = {
    high_school_gpa: gpa,
    sat_score: sat,
    act_score: act,
    attendance_rate: profile.attendanceRate ?? null,
    ap_courses: apCount > 0 || profile.gradingSystem === "gpa4" ? apCount : null,
    extracurricular_count: activities.length,
    volunteer_hours: activities.filter((a) => a.category === "Volunteering").reduce((sum, a) => sum + a.hoursPerWeek * 36, 0),
    leadership_positions: activities.filter((a) => a.category === "Leadership" || a.category === "Startup" || leadershipPattern.test(a.role)).length,
    coding_projects: activities.filter((a) => a.category === "Project" || a.category === "Startup").length,
    social_media_hours: profile.socialMediaHours ?? null,
    online_certifications: profile.onlineCertifications ?? null,
    essay_score: profile.essayScore ?? null,
    recommendation_score: profile.recommendationScore ?? null,
    interview_score: profile.interviewScore ?? null,
  };
  return { values };
}

function score(intercept: number, coefficients: number[], scaled: number[]) {
  return scaled.reduce((sum, v, i) => sum + v * coefficients[i], intercept);
}

export function scoreValues(values: Record<GenzFeature, number | null>): GeneralPrediction {
  const imputed: GenzFeature[] = [];
  const raw = model.features.map((feature) => {
    const value = values[feature as GenzFeature];
    if (value === null || Number.isNaN(value)) {
      imputed.push(feature as GenzFeature);
      return model.medians[feature as keyof typeof model.medians];
    }
    return value;
  });
  const scaled = raw.map((v, i) => clamp((v - model.mean[i]) / model.scale[i], -4, 4));
  const logit = score(model.intercept, model.coefficients, scaled);
  const samples = model.bootstrap.map(([intercept, ...coefficients]) => sigmoid(score(intercept, coefficients, scaled))).sort((a, b) => a - b);

  const contributions = model.features.map((feature, i) => ({
    feature: feature as GenzFeature,
    value: raw[i],
    imputed: imputed.includes(feature as GenzFeature),
    impact: model.coefficients[i] * scaled[i],
  }));

  return {
    probability: sigmoid(logit),
    low: samples[Math.floor(samples.length * 0.1)],
    high: samples[Math.ceil(samples.length * 0.9) - 1],
    logit,
    imputed,
    contributions,
  };
}

export function predictGeneral(profile: StudentProfile): GeneralPrediction {
  return scoreValues(genzFeatureValues(profile).values);
}

const referenceApplicants: Record<1 | 2 | 3 | 4 | 5, Partial<Record<GenzFeature, number>>> = {
  1: { high_school_gpa: 3.2, sat_score: 1100, ap_courses: 3, extracurricular_count: 3, leadership_positions: 1, essay_score: 75, recommendation_score: 78, interview_score: 73 },
  2: { high_school_gpa: 3.5, sat_score: 1250, ap_courses: 4, extracurricular_count: 4, leadership_positions: 1, essay_score: 78, recommendation_score: 80, interview_score: 76 },
  3: { high_school_gpa: 3.7, sat_score: 1380, ap_courses: 5, extracurricular_count: 5, leadership_positions: 2, essay_score: 82, recommendation_score: 83, interview_score: 80 },
  4: { high_school_gpa: 3.85, sat_score: 1480, ap_courses: 6, extracurricular_count: 6, leadership_positions: 2, essay_score: 86, recommendation_score: 86, interview_score: 84 },
  5: { high_school_gpa: 3.95, sat_score: 1550, ap_courses: 7, extracurricular_count: 7, leadership_positions: 3, essay_score: 90, recommendation_score: 90, interview_score: 88 },
};

const referenceCache = new Map<number, number>();

export function referenceLogit(tier: 1 | 2 | 3 | 4 | 5, imputedLike: GenzFeature[] = []): number {
  const key = tier * 100000 + imputedLike.reduce((mask, f) => mask | (1 << model.features.indexOf(f)), 0);
  const cached = referenceCache.get(key);
  if (cached !== undefined) return cached;
  const values = Object.fromEntries(
    model.features.map((f) => [f, imputedLike.includes(f as GenzFeature) ? null : (referenceApplicants[tier][f as GenzFeature] ?? null)]),
  ) as Record<GenzFeature, number | null>;
  const result = scoreValues(values).logit;
  referenceCache.set(key, result);
  return result;
}

export const genzModelInfo = {
  version: model.version,
  datasetName: model.dataset.name,
  rows: model.dataset.rows,
  baseRate: model.dataset.base_rate,
  auc: model.metrics.roc_auc,
  ece: model.metrics.ece,
  boostedAuc: model.metrics.gradient_boosting_roc_auc,
};

export const genzImpactOrder = [...model.features]
  .map((feature, i) => ({ feature: feature as GenzFeature, weight: Math.abs(model.coefficients[i]) }))
  .sort((a, b) => b.weight - a.weight);

import type { Activity, ActivityCategory, ActivityLevel, StudentProfile } from "@/lib/types";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const levelWeight: Record<ActivityLevel, number> = {
  school: 0.25,
  city: 0.45,
  national: 0.75,
  international: 1,
};

const categoryWeight: Record<ActivityCategory, number> = {
  Olympiad: 1.1,
  Research: 1.1,
  Startup: 1,
  Competition: 0.9,
  Internship: 0.85,
  Project: 0.8,
  Leadership: 0.8,
  Award: 0.75,
  Volunteering: 0.6,
  Sports: 0.55,
  Club: 0.5,
};

const leadershipPattern = /(founder|co-founder|president|captain|lead|head|chair|organizer|organiser|director|editor)/i;

const aLevelPoints: Record<string, number> = { "A*": 1, A: 0.9, B: 0.75, C: 0.6, D: 0.45, E: 0.3 };

export function parseALevels(input: string): number | null {
  const grades = input.toUpperCase().match(/A\*|[A-E]/g);
  if (!grades || grades.length === 0) return null;
  const top = grades.map((g) => aLevelPoints[g] ?? 0).sort((a, b) => b - a).slice(0, 3);
  return top.reduce((sum, v) => sum + v, 0) / top.length;
}

export function academicIndex(profile: StudentProfile): number | null {
  switch (profile.gradingSystem) {
    case "gpa4":
      return profile.gpa === null ? null : clamp(profile.gpa / 4);
    case "percent":
      return profile.gpa === null ? null : clamp((profile.gpa - 50) / 50);
    case "five_point":
      return profile.gpa === null ? null : clamp((profile.gpa - 2) / 3);
    case "ib":
      return profile.ib === null ? null : clamp((profile.ib - 24) / 21);
    case "alevel":
      return parseALevels(profile.aLevels);
  }
}

export function gpaOnFourScale(profile: StudentProfile): number | null {
  const index = academicIndex(profile);
  return index === null ? null : Math.round(index * 4 * 100) / 100;
}

export function testIndex(profile: StudentProfile): number | null {
  const candidates: number[] = [];
  if (profile.sat !== null) candidates.push(clamp((profile.sat - 1100) / 500));
  if (profile.act !== null) candidates.push(clamp((profile.act - 20) / 16));
  if (profile.ib !== null) candidates.push(clamp((profile.ib - 24) / 21));
  const aLevel = parseALevels(profile.aLevels);
  if (aLevel !== null) candidates.push(aLevel);
  return candidates.length ? Math.max(...candidates) : null;
}

const toeflToIelts: [number, number][] = [
  [118, 9], [115, 8.5], [110, 8], [102, 7.5], [94, 7], [79, 6.5], [60, 6], [46, 5.5], [35, 5], [0, 4],
];

const duolingoToIelts: [number, number][] = [
  [155, 8.5], [150, 8], [140, 7.5], [130, 7], [120, 6.5], [110, 6], [100, 5.5], [90, 5], [0, 4],
];

function lookup(table: [number, number][], score: number): number {
  return table.find(([threshold]) => score >= threshold)?.[1] ?? 4;
}

export function ieltsEquivalent(profile: StudentProfile): number | null {
  const values: number[] = [];
  if (profile.ielts !== null) values.push(profile.ielts);
  if (profile.toefl !== null) values.push(lookup(toeflToIelts, profile.toefl));
  if (profile.duolingo !== null) values.push(lookup(duolingoToIelts, profile.duolingo));
  return values.length ? Math.max(...values) : null;
}

function activityValue(activity: Activity): number {
  const evidenceBonus = activity.evidence.trim() || activity.link.trim() ? 1.1 : 1;
  const commitment = clamp(activity.hoursPerWeek / 8, 0.4, 1.2);
  return levelWeight[activity.level] * categoryWeight[activity.category] * evidenceBonus * commitment;
}

function saturate(total: number, scale: number): number {
  return clamp(1 - Math.exp(-total / scale));
}

export function activitiesIndex(profile: StudentProfile): number {
  const total = profile.activities.reduce((sum, a) => sum + activityValue(a), 0);
  return saturate(total, 2.2);
}

export function researchIndex(profile: StudentProfile): number {
  const total = profile.activities
    .filter((a) => a.category === "Research" || (a.category === "Olympiad" && a.level !== "school") || a.category === "Project")
    .reduce((sum, a) => sum + activityValue(a) * (a.category === "Research" ? 1.4 : 0.6), 0);
  return saturate(total, 1.2);
}

export function leadershipIndex(profile: StudentProfile): number {
  const total = profile.activities
    .filter((a) => a.category === "Leadership" || a.category === "Startup" || leadershipPattern.test(a.role))
    .reduce((sum, a) => sum + activityValue(a), 0);
  return saturate(total, 1);
}

export function internationalIndex(profile: StudentProfile): number {
  const international = profile.activities.filter((a) => a.level === "international");
  const national = profile.activities.filter((a) => a.level === "national");
  return saturate(international.length * 1 + national.length * 0.45, 1.6);
}

export function profileCompleteness(profile: StudentProfile): number {
  const checks = [
    profile.country,
    profile.school,
    academicIndex(profile) !== null,
    testIndex(profile) !== null,
    ieltsEquivalent(profile) !== null,
    profile.fields.length > 0,
    profile.activities.length > 0,
    profile.annualBudgetUsd > 0,
    profile.preferredCountries.length > 0 || profile.preferredRegions.length > 0,
    profile.careerGoal,
  ];
  return checks.filter(Boolean).length / checks.length;
}

export { clamp };

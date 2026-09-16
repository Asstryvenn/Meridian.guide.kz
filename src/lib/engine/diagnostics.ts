import type { StudentProfile } from "@/lib/types";
import {
  academicIndex,
  activitiesIndex,
  gpaOnFourScale,
  ieltsEquivalent,
  internationalIndex,
  leadershipIndex,
  profileCompleteness,
  researchIndex,
  testIndex,
} from "./profile-metrics";

export type DimensionKey = "academic" | "tests" | "english" | "extracurriculars" | "research" | "leadership" | "international";

export type Band = "Exceptional" | "Strong" | "Competitive" | "Developing" | "Not enough data";

export interface Dimension {
  key: DimensionKey;
  label: string;
  score: number | null;
  band: Band;
  explanation: string;
  improvement: string;
}

export interface Diagnostics {
  dimensions: Dimension[];
  overall: number;
  completeness: number;
  strongest: Dimension | null;
  weakest: Dimension | null;
  summary: string;
}

function band(score: number | null): Band {
  if (score === null) return "Not enough data";
  if (score >= 85) return "Exceptional";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Competitive";
  return "Developing";
}

const pct = (value: number | null) => (value === null ? null : Math.round(value * 100));

function academic(profile: StudentProfile): Dimension {
  const score = pct(academicIndex(profile));
  const gpa4 = gpaOnFourScale(profile);
  return {
    key: "academic",
    label: "Academic strength",
    score,
    band: band(score),
    explanation:
      score === null
        ? "Add your grades so we can compare your record with admitted-student profiles."
        : `Your grades convert to roughly ${gpa4?.toFixed(2)} on a 4.0 scale. ${
            score >= 85
              ? "That is in the range most highly selective universities expect."
              : score >= 65
                ? "That is solid for most target universities but below the typical admit at the most selective ones."
                : "Grades are the biggest lever for selective universities, so the final semesters matter."
          }`,
    improvement:
      score !== null && score >= 85
        ? "Keep grades stable through graduation; admissions offers are conditional."
        : "Prioritise grades in the subjects closest to your intended major this semester.",
  };
}

function tests(profile: StudentProfile): Dimension {
  const score = pct(testIndex(profile));
  const parts = [
    profile.sat !== null && `SAT ${profile.sat}`,
    profile.act !== null && `ACT ${profile.act}`,
    profile.ib !== null && `IB ${profile.ib}`,
    profile.aLevels && `A-Levels ${profile.aLevels}`,
  ].filter(Boolean);
  return {
    key: "tests",
    label: "Test scores",
    score,
    band: band(score),
    explanation:
      score === null
        ? "No standardised test yet. Many US universities read an SAT alongside your transcript, and UK/EU offers depend on predicted grades."
        : `Based on ${parts.join(", ")}. ${
            score >= 85 ? "This is a strong external signal." : "An improved score would reduce uncertainty in your predictions."
          }`,
    improvement:
      score === null
        ? "Decide whether your target countries need the SAT and book a test date."
        : score >= 85
          ? "No retake needed; focus time on essays and activities."
          : "Consider one focused retake with timed practice tests.",
  };
}

function english(profile: StudentProfile): Dimension {
  const ielts = ieltsEquivalent(profile);
  const score = ielts === null ? null : Math.round(Math.min(1, Math.max(0, (ielts - 5) / 3)) * 100);
  return {
    key: "english",
    label: "English proficiency",
    score,
    band: band(score),
    explanation:
      ielts === null
        ? "No English test recorded. Most universities outside your home country will require IELTS, TOEFL or Duolingo."
        : `Your best result is equivalent to about IELTS ${ielts.toFixed(1)}. ${
            ielts >= 7 ? "That clears the published minimum at nearly every university in the catalog." : "Several selective universities ask for 7.0 or higher."
          }`,
    improvement: ielts !== null && ielts >= 7 ? "Your English score is sufficient; make sure it will still be valid at application time." : "Plan an IELTS or TOEFL attempt at least three months before your earliest deadline.",
  };
}

function extracurriculars(profile: StudentProfile): Dimension {
  const score = pct(activitiesIndex(profile));
  const count = profile.activities.length;
  return {
    key: "extracurriculars",
    label: "Extracurriculars",
    score,
    band: band(count === 0 ? null : score),
    explanation:
      count === 0
        ? "No activities added yet. Selective universities weigh sustained, impactful involvement heavily."
        : `${count} ${count === 1 ? "activity" : "activities"} recorded. Depth, reach (city, national, international) and evidence matter more than volume.`,
    improvement: "Turn your strongest activity into something with measurable impact and a public link as evidence.",
  };
}

function research(profile: StudentProfile): Dimension {
  const score = pct(researchIndex(profile));
  return {
    key: "research",
    label: "Research",
    score,
    band: band(score),
    explanation:
      score === 0
        ? "No research or substantial independent projects yet."
        : "Research and technical projects signal readiness for research-intensive universities.",
    improvement: "Reach out to a university lab or run a small independent study and write it up publicly.",
  };
}

function leadership(profile: StudentProfile): Dimension {
  const score = pct(leadershipIndex(profile));
  return {
    key: "leadership",
    label: "Leadership",
    score,
    band: band(score),
    explanation:
      score === 0 ? "No leadership roles detected in your activities." : "Founding, leading or organising something shows initiative admissions officers look for.",
    improvement: "Take ownership of an initiative you already belong to and define a concrete outcome.",
  };
}

function international(profile: StudentProfile): Dimension {
  const score = pct(internationalIndex(profile));
  return {
    key: "international",
    label: "International competitiveness",
    score,
    band: band(score),
    explanation:
      score === 0
        ? "No national or international-level achievements yet. These help you stand out in large international applicant pools."
        : "National and international recognition helps you stand out among international applicants.",
    improvement: "Target one national or international competition aligned with your major.",
  };
}

export function diagnose(profile: StudentProfile): Diagnostics {
  const dimensions = [
    academic(profile),
    tests(profile),
    english(profile),
    extracurriculars(profile),
    research(profile),
    leadership(profile),
    international(profile),
  ];
  const weights: Record<DimensionKey, number> = {
    academic: 0.3,
    tests: 0.15,
    english: 0.1,
    extracurriculars: 0.2,
    research: 0.1,
    leadership: 0.08,
    international: 0.07,
  };
  const known = dimensions.filter((d) => d.score !== null);
  const weightSum = known.reduce((sum, d) => sum + weights[d.key], 0);
  const overall = weightSum ? Math.round(known.reduce((sum, d) => sum + (d.score ?? 0) * weights[d.key], 0) / weightSum) : 0;
  const ranked = [...known].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const strongest = ranked[0] ?? null;
  const missing = dimensions.find((d) => d.score === null);
  const weakest = missing ?? ranked[ranked.length - 1] ?? null;

  const summary = strongest && weakest
    ? `Your strongest signal is ${strongest.label.toLowerCase()}. The area that would change your outcomes most is ${weakest.label.toLowerCase()}.`
    : "Complete your profile to unlock a full diagnostic.";

  return { dimensions, overall, completeness: profileCompleteness(profile), strongest, weakest, summary };
}

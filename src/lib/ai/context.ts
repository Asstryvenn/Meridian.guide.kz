import { z } from "zod";
import { upcomingDeadlines, formatDate } from "@/lib/engine/deadlines";
import { diagnose } from "@/lib/engine/diagnostics";
import { matchScholarships } from "@/lib/engine/discovery";
import { recommend } from "@/lib/engine/matching";
import { formatRange } from "@/lib/engine/prediction";
import { buildRoadmap, nextAction } from "@/lib/engine/roadmap";
import { getUniversity } from "@/lib/data/universities";
import type { Application, StudentProfile } from "@/lib/types";

export const studentStateSchema = z.object({
  profile: z.custom<StudentProfile>((value) => typeof value === "object" && value !== null && "fields" in value),
  applications: z.array(z.custom<Application>((value) => typeof value === "object" && value !== null && "universitySlug" in value)).max(40),
  completedTasks: z.array(z.string()).max(400),
});

export type StudentState = z.infer<typeof studentStateSchema>;

export function buildStudentContext({ profile, applications, completedTasks }: StudentState) {
  const diagnostics = diagnose(profile);
  const recommendations = recommend(profile).slice(0, 8);
  const roadmap = buildRoadmap(profile, applications, completedTasks);
  const next = nextAction(roadmap);
  const shortlist = applications.map((a) => a.universitySlug);
  const scholarships = matchScholarships(profile, shortlist).filter((m) => m.eligibility >= 50).slice(0, 5);

  const deadlines = applications
    .map((a) => getUniversity(a.universitySlug))
    .filter((u) => u !== undefined)
    .flatMap((u) =>
      upcomingDeadlines(u.deadlines).slice(0, 1).map((d) => ({
        university: u.shortName,
        label: d.deadline.label,
        date: formatDate(d.date),
        daysLeft: d.days,
        verification: d.deadline.status,
      })),
    )
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    student: {
      country: profile.country || "not provided",
      grade: profile.grade,
      graduationYear: profile.graduationYear,
      intendedFields: profile.fields,
      interests: profile.interestsNote,
      careerGoal: profile.careerGoal,
      gradSchool: profile.gradSchool,
      annualBudgetUsd: profile.annualBudgetUsd,
      needsAid: profile.needsAid,
      scores: {
        gradingSystem: profile.gradingSystem,
        gpa: profile.gpa,
        sat: profile.sat,
        ielts: profile.ielts,
        toefl: profile.toefl,
        duolingo: profile.duolingo,
        ib: profile.ib,
      },
      activities: profile.activities.map((a) => `${a.category} · ${a.title} (${a.role}, ${a.level}) — ${a.impact}`),
    },
    diagnostics: {
      overall: diagnostics.overall,
      summary: diagnostics.summary,
      dimensions: diagnostics.dimensions.map((d) => ({ label: d.label, score: d.score, band: d.band })),
    },
    recommendations: recommendations.map((r) => ({
      university: r.university.name,
      tier: r.tier,
      matchScore: r.matchScore,
      admissionRange: formatRange(r.prediction),
      confidence: r.prediction.confidence,
      financialFit: r.financial.label,
      mainGap: r.mainGap,
    })),
    shortlist: applications.map((a) => ({ university: getUniversity(a.universitySlug)?.name ?? a.universitySlug, status: a.status })),
    upcomingDeadlines: deadlines,
    scholarshipMatches: scholarships.map((m) => ({ name: m.scholarship.name, eligibility: `${m.eligibility}%`, unmet: m.unmet })),
    roadmap: {
      progressPercent: Math.round(roadmap.progress * 100),
      currentLevel: roadmap.levels.find((l) => l.level === roadmap.currentLevel)?.title,
      nextAction: next ? { title: next.task.title, why: next.reason } : null,
    },
  };
}

export type StudentContext = ReturnType<typeof buildStudentContext>;

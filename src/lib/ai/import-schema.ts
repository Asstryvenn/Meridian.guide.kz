import { z } from "zod";
import { fieldOptions } from "@/lib/engine/search";
import type { FieldOfStudy } from "@/lib/types";

const activityCategories = ["Competition", "Olympiad", "Research", "Project", "Startup", "Leadership", "Volunteering", "Internship", "Sports", "Club", "Award"] as const;
const activityLevels = ["school", "city", "national", "international"] as const;

export const importResultSchema = z.object({
  documentType: z.enum(["transcript", "test_report", "certificate", "cv_resume", "other"]),
  summary: z.string(),
  profile: z.object({
    fullName: z.string().nullable(),
    country: z.string().nullable(),
    school: z.string().nullable(),
    graduationYear: z.number().int().nullable(),
    gradingSystem: z.enum(["gpa4", "percent", "ib", "alevel", "five_point"]).nullable(),
    gpa: z.number().nullable(),
    sat: z.number().int().nullable(),
    act: z.number().int().nullable(),
    ib: z.number().int().nullable(),
    aLevels: z.string().nullable(),
    apCourses: z.string().nullable(),
    ielts: z.number().nullable(),
    toefl: z.number().int().nullable(),
    duolingo: z.number().int().nullable(),
    fields: z.array(z.enum(fieldOptions as [FieldOfStudy, ...FieldOfStudy[]])),
    interestsNote: z.string().nullable(),
  }),
  activities: z.array(
    z.object({
      category: z.enum(activityCategories),
      title: z.string(),
      role: z.string(),
      level: z.enum(activityLevels),
      impact: z.string(),
      evidence: z.string(),
      link: z.string().nullable(),
      hoursPerWeek: z.number().nullable(),
    }),
  ),
  warnings: z.array(z.string()),
});

export type ImportResult = z.infer<typeof importResultSchema>;

export const ACCEPTED_IMPORT_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"];
export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

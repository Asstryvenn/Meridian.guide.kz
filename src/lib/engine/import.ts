import type { ImportResult } from "@/lib/ai/import-schema";
import { tr } from "@/lib/i18n/catalog";
import type { Activity, ActivityLevel, StudentProfile } from "@/lib/types";

const levelRank: Record<ActivityLevel, number> = { international: 4, national: 3, city: 2, school: 1 };

export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => levelRank[b.level] - levelRank[a.level] || b.hoursPerWeek - a.hoursPerWeek || a.title.localeCompare(b.title));
}

export interface ImportChange {
  label: string;
  value: string;
}

export function applyImport(profile: StudentProfile, result: ImportResult): { profile: StudentProfile; changes: ImportChange[] } {
  const changes: ImportChange[] = [];
  const next: StudentProfile = { ...profile };
  const found = result.profile;

  const set = <K extends keyof StudentProfile>(key: K, value: StudentProfile[K] | null, label: string, display?: string) => {
    if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) return;
    next[key] = value;
    changes.push({ label, value: display ?? String(value) });
  };

  set("fullName", found.fullName, tr("Name"));
  set("country", found.country, tr("Country"));
  set("school", found.school, tr("School"));
  set("graduationYear", found.graduationYear, tr("Graduation year"));
  set("gradingSystem", found.gradingSystem, tr("Grading system"));
  set("gpa", found.gpa, tr("Average grade"));
  set("sat", found.sat, "SAT");
  set("act", found.act, "ACT");
  set("ib", found.ib, "IB");
  set("aLevels", found.aLevels, "A-Levels");
  set("apCourses", found.apCourses, tr("AP courses"));
  set("ielts", found.ielts, "IELTS");
  set("toefl", found.toefl, "TOEFL");
  set("duolingo", found.duolingo, "Duolingo");
  if (found.fields.length) set("fields", Array.from(new Set([...profile.fields, ...found.fields])).slice(0, 3), tr("Fields"), found.fields.map((f) => tr(f)).join(", "));
  if (found.interestsNote && !profile.interestsNote) set("interestsNote", found.interestsNote, tr("Interests"));

  const known = new Set(profile.activities.map((a) => a.title.trim().toLowerCase()));
  const added = result.activities
    .filter((a) => a.title.trim() && !known.has(a.title.trim().toLowerCase()))
    .map<Activity>((a, index) => ({
      id: `import-${Date.now().toString(36)}-${index}`,
      category: a.category,
      title: a.title.trim(),
      role: a.role,
      level: a.level,
      impact: a.impact,
      evidence: a.evidence,
      link: a.link ?? "",
      hoursPerWeek: a.hoursPerWeek ?? 2,
    }));

  if (added.length) {
    next.activities = sortActivities([...profile.activities, ...added]);
    changes.push({ label: tr("Activities"), value: tr("{count} added and sorted by level", { count: added.length }) });
  }

  return { profile: next, changes };
}

function numberAfter(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  return match ? Number(match[1].replace(",", ".")) : null;
}

export function extractFromText(text: string): ImportResult {
  const ielts = numberAfter(text, /ielts[^\d]{0,20}(\d(?:[.,]\d)?)/i);
  const toefl = numberAfter(text, /toefl[^\d]{0,20}(\d{2,3})/i);
  const sat = numberAfter(text, /sat[^\d]{0,20}(\d{3,4})/i);
  const gpa = numberAfter(text, /(?:gpa|average|средний балл|орташа балл)[^\d]{0,20}(\d(?:[.,]\d{1,2})?)/i);
  const ib = numberAfter(text, /\bib\b[^\d]{0,20}(\d{2})/i);

  return {
    documentType: "other",
    summary: tr("Scores detected in plain text without AI."),
    profile: {
      fullName: null,
      country: null,
      school: null,
      graduationYear: null,
      gradingSystem: gpa === null ? null : gpa <= 4 ? "gpa4" : gpa <= 5 ? "five_point" : "percent",
      gpa,
      sat: sat !== null && sat >= 400 && sat <= 1600 ? sat : null,
      act: null,
      ib: ib !== null && ib <= 45 ? ib : null,
      aLevels: null,
      apCourses: null,
      ielts: ielts !== null && ielts <= 9 ? ielts : null,
      toefl: toefl !== null && toefl <= 120 ? toefl : null,
      duolingo: null,
      fields: [],
      interestsNote: null,
    },
    activities: [],
    warnings: [tr("Only test scores were detected. Add an OpenAI key to read full documents and activities.")],
  };
}

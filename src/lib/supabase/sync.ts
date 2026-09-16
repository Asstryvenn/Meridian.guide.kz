import type { Activity, Application, StudentProfile } from "@/lib/types";
import { emptyProfile } from "@/lib/store/defaults";
import { getSupabase } from "./client";

export interface PersistedState {
  profile: StudentProfile;
  onboarded: boolean;
  applications: Application[];
  completedTasks: string[];
}

export async function loadRemoteState(userId: string): Promise<PersistedState | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [profileRes, academicRes, activitiesRes, applicationsRes, tasksRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("academic_records").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("activities").select("*").eq("user_id", userId),
    supabase.from("applications").select("*").eq("user_id", userId),
    supabase.from("tasks").select("task_id").eq("user_id", userId),
  ]);

  const p = profileRes.data;
  if (!p) return null;
  const a = academicRes.data ?? {};

  const activities: Activity[] = (activitiesRes.data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    role: row.role ?? "",
    level: row.level,
    impact: row.impact ?? "",
    evidence: row.evidence ?? "",
    link: row.link ?? "",
    hoursPerWeek: row.hours_per_week ?? 0,
  }));

  const profile: StudentProfile = {
    ...emptyProfile,
    fullName: p.full_name ?? "",
    country: p.country ?? "",
    school: p.school ?? "",
    grade: p.grade ?? emptyProfile.grade,
    graduationYear: p.graduation_year ?? emptyProfile.graduationYear,
    age: p.age ?? emptyProfile.age,
    fields: p.fields ?? [],
    interestsNote: p.interests_note ?? "",
    annualBudgetUsd: p.annual_budget_usd ?? emptyProfile.annualBudgetUsd,
    tuitionRange: [p.tuition_min_usd ?? 0, p.tuition_max_usd ?? emptyProfile.tuitionRange[1]],
    needsAid: p.needs_aid,
    scholarshipRequired: p.scholarship_required,
    preferredCountries: p.preferred_countries ?? [],
    preferredRegions: p.preferred_regions ?? [],
    campusType: p.campus_type,
    institutionType: p.institution_type,
    size: p.size,
    careerGoal: p.career_goal ?? "",
    gradSchool: p.grad_school,
    gradingSystem: a.grading_system ?? "gpa4",
    gpa: a.gpa === null || a.gpa === undefined ? null : Number(a.gpa),
    sat: a.sat ?? null,
    act: a.act ?? null,
    ib: a.ib ?? null,
    aLevels: a.a_levels ?? "",
    apCourses: a.ap_courses ?? "",
    ielts: a.ielts === null || a.ielts === undefined ? null : Number(a.ielts),
    toefl: a.toefl ?? null,
    duolingo: a.duolingo ?? null,
    activities,
  };

  const applications: Application[] = (applicationsRes.data ?? []).map((row) => ({
    universitySlug: row.university_slug,
    status: row.status,
    documents: row.documents,
    essays: row.essays,
    scholarshipIds: row.scholarship_ids ?? [],
    notes: row.notes ?? "",
    addedAt: row.added_at,
  }));

  return {
    profile,
    onboarded: p.onboarded,
    applications,
    completedTasks: (tasksRes.data ?? []).map((row) => row.task_id),
  };
}

export async function saveRemoteState(userId: string, state: PersistedState): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { profile } = state;

  const results = await Promise.all([
    supabase.from("profiles").upsert({
      user_id: userId,
      full_name: profile.fullName,
      country: profile.country,
      school: profile.school,
      grade: profile.grade,
      graduation_year: profile.graduationYear,
      age: profile.age,
      fields: profile.fields,
      interests_note: profile.interestsNote,
      annual_budget_usd: profile.annualBudgetUsd,
      tuition_min_usd: profile.tuitionRange[0],
      tuition_max_usd: profile.tuitionRange[1],
      needs_aid: profile.needsAid,
      scholarship_required: profile.scholarshipRequired,
      preferred_countries: profile.preferredCountries,
      preferred_regions: profile.preferredRegions,
      campus_type: profile.campusType,
      institution_type: profile.institutionType,
      size: profile.size,
      career_goal: profile.careerGoal,
      grad_school: profile.gradSchool,
      onboarded: state.onboarded,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("academic_records").upsert({
      user_id: userId,
      grading_system: profile.gradingSystem,
      gpa: profile.gpa,
      sat: profile.sat,
      act: profile.act,
      ib: profile.ib,
      a_levels: profile.aLevels,
      ap_courses: profile.apCourses,
      ielts: profile.ielts,
      toefl: profile.toefl,
      duolingo: profile.duolingo,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("activities").delete().eq("user_id", userId),
    supabase.from("applications").delete().eq("user_id", userId),
    supabase.from("tasks").delete().eq("user_id", userId),
  ]);

  const inserts = await Promise.all([
    profile.activities.length
      ? supabase.from("activities").insert(
          profile.activities.map((a) => ({
            id: a.id,
            user_id: userId,
            category: a.category,
            title: a.title,
            role: a.role,
            level: a.level,
            impact: a.impact,
            evidence: a.evidence,
            link: a.link,
            hours_per_week: a.hoursPerWeek,
          })),
        )
      : null,
    state.applications.length
      ? supabase.from("applications").insert(
          state.applications.map((a) => ({
            user_id: userId,
            university_slug: a.universitySlug,
            status: a.status,
            documents: a.documents,
            essays: a.essays,
            scholarship_ids: a.scholarshipIds,
            notes: a.notes,
            added_at: a.addedAt,
          })),
        )
      : null,
    state.completedTasks.length
      ? supabase.from("tasks").insert(state.completedTasks.map((task_id) => ({ user_id: userId, task_id })))
      : null,
  ]);

  const failure = [...results, ...inserts].find((r) => r && r.error);
  return failure?.error?.message ?? null;
}

import { getScholarship } from "@/lib/data/scholarships";
import { getUniversity } from "@/lib/data/universities";
import { msg, tr } from "@/lib/i18n/catalog";
import type { Application, RoadmapTask, StudentProfile } from "@/lib/types";
import { addDays, daysUntil, nextOccurrence, toIsoDate, upcomingDeadlines } from "./deadlines";
import { diagnose } from "./diagnostics";
import { ieltsEquivalent, profileCompleteness, testIndex } from "./profile-metrics";

export interface RoadmapLevel {
  level: number;
  title: string;
  subtitle: string;
  tasks: RoadmapTask[];
  completed: number;
  locked: boolean;
}

export interface Roadmap {
  levels: RoadmapLevel[];
  totalXp: number;
  earnedXp: number;
  progress: number;
  currentLevel: number;
}

const levelMeta: Record<number, [string, string]> = {
  1: [msg("Foundation"), msg("Know where you stand")],
  2: [msg("Tests"), msg("Clear the score requirements")],
  3: [msg("Portfolio"), msg("Strengthen your weakest signal")],
  4: [msg("Documents"), msg("Collect what every application needs")],
  5: [msg("Essays"), msg("Tell a story only you can tell")],
  6: [msg("Funding"), msg("Line up scholarships and aid")],
  7: [msg("Submit"), msg("Hit every deadline")],
};

function task(partial: Omit<RoadmapTask, "done">, completed: Set<string>): RoadmapTask {
  return { ...partial, done: completed.has(partial.id) };
}

export function buildRoadmap(
  profile: StudentProfile,
  applications: Application[],
  completedIds: string[],
  now = new Date(),
  customTasks: RoadmapTask[] = [],
): Roadmap {
  const completed = new Set(completedIds);
  const tasks: RoadmapTask[] = [];
  const shortlist = applications.map((a) => getUniversity(a.universitySlug)).filter((u) => u !== undefined);

  const earliest = shortlist
    .flatMap((u) => upcomingDeadlines(u.deadlines, now))
    .sort((a, b) => a.days - b.days)[0];
  const anchor = earliest?.date ?? addDays(now, 120);
  const runway = Math.max(7, daysUntil(anchor, now) - 3);
  const compression = Math.min(1, runway / 90);
  const before = (days: number) => toIsoDate(addDays(anchor, -Math.round(days * compression)));
  const soon = (days: number) => toIsoDate(addDays(now, days));

  tasks.push(task({ id: "foundation-profile", title: tr("Complete your student profile"), detail: tr("Every recommendation gets sharper as your profile fills in."), kind: "academic", level: 1, xp: 20, dueDate: null }, completed));
  tasks.push(task({ id: "foundation-diagnostics", title: tr("Review your portfolio diagnostics"), detail: tr("Understand your strongest and weakest signals."), kind: "academic", level: 1, xp: 15, dueDate: null }, completed));
  tasks.push(task({ id: "foundation-shortlist", title: tr("Shortlist at least 3 universities"), detail: tr("Aim for a balance of Dream, Target and Safety."), kind: "academic", level: 1, xp: 25, dueDate: soon(14) }, completed));
  if (shortlist.length >= 3) completed.add("foundation-shortlist");
  if (profileCompleteness(profile) >= 0.8) completed.add("foundation-profile");

  const ielts = ieltsEquivalent(profile);
  const highestEnglish = Math.max(0, ...shortlist.map((u) => u.requirements.minIelts.value ?? 0));
  if (ielts === null) {
    tasks.push(task({ id: "test-english", title: tr("Take IELTS, TOEFL or Duolingo"), detail: highestEnglish ? tr("Your shortlist asks for up to IELTS {score}.", { score: highestEnglish }) : tr("Most international programs require an English test."), kind: "exam", level: 2, xp: 60, dueDate: before(60) }, completed));
  } else if (highestEnglish && ielts < highestEnglish) {
    tasks.push(task({ id: "test-english-retake", title: tr("Raise English score to IELTS {score}", { score: highestEnglish }), detail: tr("Your current equivalent is {score}.", { score: ielts.toFixed(1) }), kind: "exam", level: 2, xp: 60, dueDate: before(45) }, completed));
  }

  const needsSat = shortlist.some((u) => u.country === "United States");
  if (needsSat && profile.sat === null) {
    tasks.push(task({ id: "test-sat", title: tr("Prepare for the SAT"), detail: tr("Optional at some US universities, but a strong score reduces uncertainty for international applicants."), kind: "exam", level: 2, xp: 60, dueDate: before(50) }, completed));
  } else if (needsSat && profile.sat !== null && profile.sat < 1500) {
    tasks.push(task({ id: "test-sat-retake", title: tr("Consider an SAT retake"), detail: tr("Current score {score}. Selective US universities typically see 1500+.", { score: profile.sat }), kind: "exam", level: 2, xp: 40, dueDate: before(50) }, completed));
  }
  if (testIndex(profile) === null && !needsSat) {
    tasks.push(task({ id: "test-predicted", title: tr("Request predicted grades from your school"), detail: tr("UK and European offers rely on predicted or final results."), kind: "document", level: 2, xp: 25, dueDate: before(40) }, completed));
  }

  const diagnostics = diagnose(profile);
  const weak = [...diagnostics.dimensions]
    .filter((d) => ["extracurriculars", "research", "leadership", "international"].includes(d.key))
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 2);
  for (const dimension of weak) {
    tasks.push(task({ id: `portfolio-${dimension.key}`, title: dimension.improvement, detail: tr("Raises your {dimension} signal (currently {score}/100).", { dimension: dimension.label.toLowerCase(), score: dimension.score ?? 0 }), kind: "activity", level: 3, xp: 50, dueDate: before(75) }, completed));
  }
  tasks.push(task({ id: "portfolio-evidence", title: tr("Add evidence links to your top activities"), detail: tr("Certificates, repositories, articles or demo videos."), kind: "activity", level: 3, xp: 20, dueDate: before(30) }, completed));

  tasks.push(task({ id: "docs-transcript", title: tr("Request official transcripts"), detail: tr("Ask your school registrar for certified, translated copies."), kind: "document", level: 4, xp: 25, dueDate: before(30) }, completed));
  tasks.push(task({ id: "docs-recommendations", title: tr("Ask two teachers for recommendation letters"), detail: tr("Give them at least six weeks and a short brag sheet."), kind: "document", level: 4, xp: 30, dueDate: before(42) }, completed));
  tasks.push(task({ id: "docs-passport", title: tr("Check passport validity"), detail: tr("Must remain valid through visa application."), kind: "document", level: 4, xp: 10, dueDate: before(20) }, completed));
  if (profile.needsAid && shortlist.some((u) => u.needBasedAidIntl.value === "full_need")) {
    tasks.push(task({ id: "docs-css", title: tr("Prepare CSS Profile financial documents"), detail: tr("Required for need-based aid at US universities."), kind: "document", level: 4, xp: 35, dueDate: before(10) }, completed));
  }

  tasks.push(task({ id: "essay-personal", title: tr("Draft your core personal statement"), detail: tr("One strong story you can adapt across applications."), kind: "essay", level: 5, xp: 50, dueDate: before(35) }, completed));
  for (const university of shortlist) {
    tasks.push(task({ id: `essay-${university.slug}`, title: tr("Write {name} supplemental essays", { name: university.shortName }), detail: tr("Tailor your answer to specific programs, labs and courses."), kind: "essay", level: 5, xp: 40, dueDate: toIsoDate(addDays(upcomingDeadlines(university.deadlines, now)[0]?.date ?? anchor, -14)), universitySlug: university.slug }, completed));
  }

  const scholarshipIds = Array.from(new Set(applications.flatMap((a) => a.scholarshipIds)));
  for (const id of scholarshipIds) {
    const scholarship = getScholarship(id);
    if (!scholarship) continue;
    tasks.push(task({ id: `scholarship-${id}`, title: tr("Apply for {name}", { name: tr(scholarship.name) }), detail: tr(scholarship.notes), kind: "scholarship", level: 6, xp: 45, dueDate: scholarship.deadline ? toIsoDate(nextOccurrence(scholarship.deadline, now)) : null }, completed));
  }
  tasks.push(task({ id: "funding-budget", title: tr("Confirm your family budget in writing"), detail: tr("Aid offices will ask for consistent numbers."), kind: "scholarship", level: 6, xp: 15, dueDate: before(20) }, completed));

  for (const university of shortlist) {
    const next = upcomingDeadlines(university.deadlines, now)[0];
    if (!next) continue;
    tasks.push(task({ id: `submit-${university.slug}`, title: tr("Submit {name} application", { name: university.shortName }), detail: next.deadline.status === "needs_verification" ? tr("{label} · date needs verification", { label: tr(next.deadline.label) }) : tr(next.deadline.label), kind: "deadline", level: 7, xp: 100, dueDate: toIsoDate(next.date), universitySlug: university.slug }, completed));
  }

  for (const ct of customTasks) {
    tasks.push(task(ct, completed));
  }

  const finalTasks = tasks.map((t) => ({ ...t, done: completed.has(t.id) }));
  const levels: RoadmapLevel[] = [];
  let previousComplete = true;
  for (const level of Object.keys(levelMeta).map(Number)) {
    const levelTasks = finalTasks.filter((t) => t.level === level);
    if (!levelTasks.length) continue;
    const done = levelTasks.filter((t) => t.done).length;
    const ratio = done / levelTasks.length;
    levels.push({ level, title: tr(levelMeta[level][0]), subtitle: tr(levelMeta[level][1]), tasks: levelTasks, completed: done, locked: !previousComplete });
    previousComplete = previousComplete && ratio >= 0.5;
  }

  const totalXp = finalTasks.reduce((sum, t) => sum + t.xp, 0);
  const earnedXp = finalTasks.filter((t) => t.done).reduce((sum, t) => sum + t.xp, 0);
  const currentLevel = levels.find((l) => !l.locked && l.completed < l.tasks.length)?.level ?? levels[levels.length - 1]?.level ?? 1;

  return { levels, totalXp, earnedXp, progress: totalXp ? earnedXp / totalXp : 0, currentLevel };
}

export interface NextAction {
  task: RoadmapTask;
  reason: string;
  daysLeft: number | null;
}

export function nextAction(roadmap: Roadmap, now = new Date()): NextAction | null {
  const open = roadmap.levels.filter((l) => !l.locked).flatMap((l) => l.tasks).filter((t) => !t.done);
  if (!open.length) return null;
  const scored = open.map((t) => {
    const days = t.dueDate ? daysUntil(new Date(`${t.dueDate}T00:00:00`), now) : null;
    const urgency = days === null ? 0 : days < 0 ? 120 : Math.max(0, 90 - days);
    const impact = t.xp + (t.level === roadmap.currentLevel ? 40 : 0) - t.level * 4;
    return { t, days, priority: urgency + impact };
  });
  scored.sort((a, b) => b.priority - a.priority);
  const top = scored[0];
  const reason =
    top.days !== null && top.days < 0
      ? tr("This is overdue and blocks later steps.")
      : top.days !== null && top.days <= 30
        ? tr("Due in {days} days — the most time-sensitive open step.", { days: top.days })
        : top.t.level === roadmap.currentLevel
          ? tr("It completes your current level: {level}.", { level: roadmap.levels.find((l) => l.level === top.t.level)?.title ?? "" })
          : tr("It has the largest effect on your admission chances right now.");
  return { task: top.t, reason, daysLeft: top.days };
}

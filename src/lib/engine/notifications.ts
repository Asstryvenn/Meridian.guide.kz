import { getUniversity } from "@/lib/data/universities";
import type { Application, StudentProfile } from "@/lib/types";
import { formatDate, upcomingDeadlines } from "./deadlines";
import { matchScholarships } from "./discovery";
import { tr } from "@/lib/i18n/catalog";
import { ieltsEquivalent } from "./profile-metrics";

export type NotificationKind = "deadline" | "test_gap" | "scholarship";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  priority: number;
}

const MAX_NOTIFICATIONS = 5;

export function buildNotifications(
  profile: StudentProfile,
  applications: Application[],
  dismissed: string[],
  now = new Date(),
): AppNotification[] {
  const items: AppNotification[] = [];
  const hidden = new Set(dismissed);

  for (const application of applications) {
    const university = getUniversity(application.universitySlug);
    if (!university || application.status === "submitted" || application.status === "decision") continue;
    const next = upcomingDeadlines(university.deadlines, now)[0];
    if (!next || next.days > 45) continue;
    items.push({
      id: `deadline-${university.slug}-${next.date.getFullYear()}-${next.deadline.label}`,
      kind: "deadline",
      title: tr("{name}: {label} in {days} days", { name: university.shortName, label: tr(next.deadline.label), days: next.days }),
      body: next.deadline.status === "needs_verification" ? tr("{date} · confirm this date on the official site", { date: formatDate(next.date) }) : formatDate(next.date),
      href: `/applications/${university.slug}`,
      priority: 100 - next.days,
    });
  }

  const ielts = ieltsEquivalent(profile);
  const gaps = applications
    .map((a) => getUniversity(a.universitySlug))
    .filter((u) => u !== undefined)
    .filter((u) => u.requirements.minIelts.value !== null && (ielts === null || ielts < (u.requirements.minIelts.value ?? 0)));
  if (gaps.length) {
    const highest = Math.max(...gaps.map((u) => u.requirements.minIelts.value ?? 0));
    items.push({
      id: `test-gap-english-${highest}-${ielts ?? "none"}`,
      kind: "test_gap",
      title: ielts === null ? tr("English test still missing") : tr("English score below {count} university requirements", { count: gaps.length }),
      body: tr("{names} ask for IELTS {score} or equivalent.", { names: gaps.map((u) => u.shortName).join(", "), score: highest }),
      href: "/roadmap",
      priority: 60,
    });
  }

  const shortlist = applications.map((a) => a.universitySlug);
  const tracked = new Set(applications.flatMap((a) => a.scholarshipIds));
  const strongMatch = matchScholarships(profile, shortlist).find((m) => m.eligibility >= 70 && !tracked.has(m.scholarship.id));
  if (strongMatch) {
    items.push({
      id: `scholarship-${strongMatch.scholarship.id}`,
      kind: "scholarship",
      title: tr("New scholarship match: {name}", { name: tr(strongMatch.scholarship.name) }),
      body: tr("{percent}% of eligibility criteria met.", { percent: strongMatch.eligibility }),
      href: "/scholarships",
      priority: 40,
    });
  }

  return items
    .filter((n) => !hidden.has(n.id))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_NOTIFICATIONS);
}

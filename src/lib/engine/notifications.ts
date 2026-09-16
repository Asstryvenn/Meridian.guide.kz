import { getUniversity } from "@/lib/data/universities";
import type { Application, StudentProfile } from "@/lib/types";
import { formatDate, upcomingDeadlines } from "./deadlines";
import { matchScholarships } from "./discovery";
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
      title: `${university.shortName}: ${next.deadline.label} in ${next.days} days`,
      body: `${formatDate(next.date)}${next.deadline.status === "needs_verification" ? " · confirm this date on the official site" : ""}`,
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
      title: ielts === null ? "English test still missing" : `English score below ${gaps.length} requirement${gaps.length > 1 ? "s" : ""}`,
      body: `${gaps.map((u) => u.shortName).join(", ")} ask for IELTS ${highest} or equivalent.`,
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
      title: `New scholarship match: ${strongMatch.scholarship.name}`,
      body: `${strongMatch.eligibility}% of eligibility criteria met.`,
      href: "/scholarships",
      priority: 40,
    });
  }

  return items
    .filter((n) => !hidden.has(n.id))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_NOTIFICATIONS);
}

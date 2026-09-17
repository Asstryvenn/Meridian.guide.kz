import type { Deadline } from "@/lib/types";
import { getActiveLocale, intlLocale } from "@/lib/i18n/catalog";

const DAY = 24 * 60 * 60 * 1000;

export function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function nextOccurrence(deadline: Pick<Deadline, "month" | "day">, now = new Date()): Date {
  const today = startOfToday(now);
  const candidate = new Date(today.getFullYear(), deadline.month - 1, deadline.day);
  return candidate < today ? new Date(today.getFullYear() + 1, deadline.month - 1, deadline.day) : candidate;
}

export function daysUntil(date: Date, now = new Date()): number {
  return Math.round((date.getTime() - startOfToday(now).getTime()) / DAY);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return date.toLocaleDateString(intlLocale[getActiveLocale()], { day: "numeric", month: "short", year: "numeric" });
}

export function upcomingDeadlines(deadlines: Deadline[], now = new Date()) {
  return deadlines
    .map((deadline) => {
      const date = nextOccurrence(deadline, now);
      return { deadline, date, days: daysUntil(date, now) };
    })
    .sort((a, b) => a.days - b.days);
}

"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Award, FileText } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useI18n } from "@/components/i18n/i18n-context";
import { universities } from "@/lib/data/universities";
import { scholarships } from "@/lib/data/scholarships";
import { daysUntil, formatDate } from "@/lib/engine/deadlines";
import { useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

export type EventKind = "deadline" | "exam" | "scholarship";

export interface CalendarEvent {
  id: string;
  title: string;
  kind: EventKind;
  date: string;
  institution?: string;
  categoryLabel: string;
  details: string;
}

const standardExams: CalendarEvent[] = [
  {
    id: "exam-sat-oct",
    title: msg("SAT International Test Date"),
    kind: "exam",
    date: "2026-10-03",
    categoryLabel: msg("College Board Exam"),
    details: msg("Digital SAT testing window. Scores typically released in 13-14 days."),
  },
  {
    id: "exam-sat-nov",
    title: msg("SAT International Test Date"),
    kind: "exam",
    date: "2026-11-07",
    categoryLabel: msg("College Board Exam"),
    details: msg("Registration deadline is October 23. Recommended for Regular Decision."),
  },
  {
    id: "exam-sat-dec",
    title: msg("SAT International Test Date"),
    kind: "exam",
    date: "2026-12-05",
    categoryLabel: msg("College Board Exam"),
    details: msg("Final testing date for most regular decision cycles."),
  },
  {
    id: "exam-ielts-sep",
    title: msg("IELTS Academic Official Test Session"),
    kind: "exam",
    date: "2026-09-26",
    categoryLabel: msg("Language Proficiency"),
    details: msg("Computer-delivered results available in 3-5 calendar days."),
  },
  {
    id: "exam-ielts-oct",
    title: msg("IELTS Academic Official Test Session"),
    kind: "exam",
    date: "2026-10-24",
    categoryLabel: msg("Language Proficiency"),
    details: msg("Required for UK, Canada, and European English proficiency waivers."),
  },
];

export function DeadlineCalendar() {
  const tx = useT();
  const { applications } = useApp();
  const { t } = useI18n();

  const [activeFilter, setActiveFilter] = useState<"all" | EventKind>("all");
  const [viewMode, setViewMode] = useState<"agenda" | "month">("agenda");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const currentYear = 2026;

  const allEvents = useMemo(() => {
    const list: CalendarEvent[] = [];

    const activeUnis =
      applications.length > 0
        ? applications
            .map((a) => universities.find((u) => u.slug === a.universitySlug))
            .filter((u): u is (typeof universities)[0] => Boolean(u))
        : universities.slice(0, 8);

    for (const uni of activeUnis) {
      for (const dl of uni.deadlines) {
        const monthStr = String(dl.month).padStart(2, "0");
        const dayStr = String(dl.day).padStart(2, "0");
        const year = dl.month <= 3 ? currentYear + 1 : currentYear;
        list.push({
          id: `dl-${uni.slug}-${dl.label}`,
          title: `${uni.shortName} — ${dl.label}`,
          kind: "deadline",
          date: `${year}-${monthStr}-${dayStr}`,
          institution: uni.name,
          categoryLabel: dl.label,
          details: tx("Application submission cutoff for {name}. Verification: {status}.", { name: uni.name, status: dl.status }),
        });
      }
    }

    for (const sch of scholarships) {
      if (sch.deadline) {
        const monthStr = String(sch.deadline.month).padStart(2, "0");
        const dayStr = String(sch.deadline.day).padStart(2, "0");
        const year = sch.deadline.month <= 3 ? currentYear + 1 : currentYear;
        list.push({
          id: `sch-${sch.id}`,
          title: sch.name,
          kind: "scholarship",
          date: `${year}-${monthStr}-${dayStr}`,
          institution: sch.provider,
          categoryLabel: sch.kind,
          details: tx("{coverage}. Basis: {basis}. {notes}", { coverage: sch.coverage, basis: sch.basis, notes: sch.notes }),
        });
      }
    }

    list.push(...standardExams);

    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return list;
  }, [applications]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return allEvents;
    return allEvents.filter((e) => e.kind === activeFilter);
  }, [allEvents, activeFilter]);

  const urgentAlerts = useMemo(() => {
    const now = new Date();
    return allEvents
      .map((e) => ({ ...e, days: daysUntil(new Date(e.date), now) }))
      .filter((e) => e.days >= 0 && e.days <= 30)
      .slice(0, 3);
  }, [allEvents]);

  const getKindColor = (kind: EventKind) => {
    switch (kind) {
      case "deadline":
        return "bg-[#EBAE29]/20 text-amber-ink border-[#EBAE29]/40";
      case "scholarship":
        return "bg-[#589C80]/20 text-green-ink border-[#589C80]/40";
      case "exam":
        return "bg-ink/20 text-ink border-ink/40";
    }
  };

  const renderKindBadge = (kind: EventKind) => {
    switch (kind) {
      case "deadline":
        return (
          <span className="inline-flex items-center gap-1">
            <Clock size={11} /> Deadline
          </span>
        );
      case "scholarship":
        return (
          <span className="inline-flex items-center gap-1">
            <Award size={11} /> Scholarship
          </span>
        );
      case "exam":
        return (
          <span className="inline-flex items-center gap-1">
            <FileText size={11} /> Exam
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {urgentAlerts.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#EBAE29]/15 via-panel/80 to-[#589C80]/15 border border-[#EBAE29]/40 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-ink">
            <span className="w-2 h-2 rounded-full bg-[#EBAE29] animate-ping" />
            <span>{tx("Proactive Deadline Alert")}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {urgentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-2xl bg-panel/90 border border-[#589C80]/30 flex items-center justify-between gap-3 shadow-md"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink truncate">
                    {alert.title}
                  </p>
                  <p className="text-[11px] font-mono text-green-ink">
                    {formatDate(new Date(alert.date))}
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#EBAE29]/20 text-amber-ink border border-[#EBAE29]/40">
                  {tx("{days}d left", { days: alert.days })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-panel/85 border border-[#589C80]/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Calendar size={22} className="text-green-ink" />
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {t.calendar.title}
            </h2>
          </div>
          <p className="text-xs text-ink/70 max-w-xl">
            {t.calendar.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-panel p-1 rounded-2xl border border-[#589C80]/30">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-[#589C80] text-on-accent shadow-md"
                  : "text-ink/70 hover:text-ink"
              }`}
            >
              {t.calendar.filterAll}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("deadline")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "deadline"
                  ? "bg-[#EBAE29] text-on-accent shadow-md"
                  : "text-ink/70 hover:text-ink"
              }`}
            >
              {t.calendar.filterDeadlines}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("exam")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "exam"
                  ? "bg-ink text-panel shadow-md"
                  : "text-ink/70 hover:text-ink"
              }`}
            >
              {t.calendar.filterExams}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("scholarship")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "scholarship"
                  ? "bg-[#589C80] text-on-accent shadow-md"
                  : "text-ink/70 hover:text-ink"
              }`}
            >
              {t.calendar.filterScholarships}
            </button>
          </div>

          <div className="flex items-center bg-panel p-1 rounded-2xl border border-[#589C80]/30">
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === "agenda"
                  ? "bg-[#589C80]/20 text-green-ink border border-[#589C80]/40"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              
              {tx("List View")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === "month"
                  ? "bg-[#589C80]/20 text-green-ink border border-[#589C80]/40"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              
              {tx("Grid View")}
            </button>
          </div>
        </div>
      </div>

      {viewMode === "agenda" ? (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-panel/50 border border-[#589C80]/20 text-ink/60 font-mono text-sm">
              {t.calendar.noEvents}
            </div>
          ) : (
            filteredEvents.map((event) => {
              const now = new Date();
              const days = daysUntil(new Date(event.date), now);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-panel/85 border border-[#589C80]/30 hover:border-[#EBAE29] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg backdrop-blur-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-panel border border-[#589C80]/40 flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-[10px] font-mono uppercase font-bold text-amber-ink">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </span>
                      <span className="text-xl font-extrabold text-ink">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getKindColor(
                            event.kind
                          )}`}
                        >
                          {renderKindBadge(event.kind)}
                        </span>
                        {event.institution && (
                          <span className="text-xs font-mono text-green-ink">
                            {event.institution}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-ink">
                        {event.title}
                      </h3>

                      <p className="text-xs text-ink/70 leading-relaxed max-w-2xl">
                        {event.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#589C80]/20">
                    <span className="text-xs font-mono text-ink/60">
                      {formatDate(new Date(event.date))}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg mt-1 border ${
                        days < 0
                          ? "bg-red-950/40 text-red-400 border-red-800/40"
                          : days <= 14
                            ? "bg-[#EBAE29]/20 text-amber-ink border-[#EBAE29]/40 animate-pulse"
                            : "bg-[#589C80]/15 text-green-ink border-[#589C80]/30"
                      }`}
                    >
                      {days < 0 ? tx("Past") : tx("{days} days left", { days: days })}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-panel/85 border border-[#589C80]/30 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-mono font-bold text-green-ink uppercase">
            <span>{tx("Sun")}</span>
            <span>{tx("Mon")}</span>
            <span>{tx("Tue")}</span>
            <span>{tx("Wed")}</span>
            <span>{tx("Thu")}</span>
            <span>{tx("Fri")}</span>
            <span>{tx("Sat")}</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = (i % 31) + 1;
              const matching = filteredEvents.filter(
                (e) => new Date(e.date).getDate() === dayNum
              );
              return (
                <div
                  key={i}
                  className="min-h-24 p-2 rounded-2xl bg-panel/60 border border-[#589C80]/20 flex flex-col justify-between"
                >
                  <span className="text-xs font-mono font-bold text-ink/70">
                    {dayNum}
                  </span>
                  <div className="space-y-1">
                    {matching.slice(0, 2).map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedEvent(m)}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded truncate border cursor-pointer ${getKindColor(
                          m.kind
                        )}`}
                      >
                        {m.title}
                      </div>
                    ))}
                    {matching.length > 2 && (
                      <span className="text-[9px] font-mono text-amber-ink block">
                        +{matching.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedEvent && (
            <div className="mt-4 p-4 rounded-2xl bg-panel border border-[#EBAE29]/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-amber-ink">
                  {formatDate(new Date(selectedEvent.date))}
                </p>
                <p className="text-sm font-bold text-ink">
                  {selectedEvent.title}
                </p>
                <p className="text-xs text-ink/70">{selectedEvent.details}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1 text-xs font-mono bg-[#589C80]/20 text-green-ink rounded-lg border border-[#589C80]/40 cursor-pointer"
              >
                
                {tx("Close")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

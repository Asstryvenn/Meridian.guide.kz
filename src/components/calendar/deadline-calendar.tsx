"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Award, FileText } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useI18n } from "@/components/i18n/i18n-context";
import { universities } from "@/lib/data/universities";
import { scholarships } from "@/lib/data/scholarships";
import { daysUntil, formatDate } from "@/lib/engine/deadlines";

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
    title: "SAT International Test Date",
    kind: "exam",
    date: "2026-10-03",
    categoryLabel: "College Board Exam",
    details: "Digital SAT testing window. Scores typically released in 13-14 days.",
  },
  {
    id: "exam-sat-nov",
    title: "SAT International Test Date",
    kind: "exam",
    date: "2026-11-07",
    categoryLabel: "College Board Exam",
    details: "Registration deadline is October 23. Recommended for Regular Decision.",
  },
  {
    id: "exam-sat-dec",
    title: "SAT International Test Date",
    kind: "exam",
    date: "2026-12-05",
    categoryLabel: "College Board Exam",
    details: "Final testing date for most regular decision cycles.",
  },
  {
    id: "exam-ielts-sep",
    title: "IELTS Academic Official Test Session",
    kind: "exam",
    date: "2026-09-26",
    categoryLabel: "Language Proficiency",
    details: "Computer-delivered results available in 3-5 calendar days.",
  },
  {
    id: "exam-ielts-oct",
    title: "IELTS Academic Official Test Session",
    kind: "exam",
    date: "2026-10-24",
    categoryLabel: "Language Proficiency",
    details: "Required for UK, Canada, and European English proficiency waivers.",
  },
];

export function DeadlineCalendar() {
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
          details: `Application submission cutoff for ${uni.name}. Verification: ${dl.status}.`,
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
          details: `${sch.coverage}. Basis: ${sch.basis}. ${sch.notes}`,
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
        return "bg-[#EBAE29]/20 text-[#EBAE29] border-[#EBAE29]/40";
      case "scholarship":
        return "bg-[#589C80]/20 text-[#589C80] border-[#589C80]/40";
      case "exam":
        return "bg-[#F5EED2]/20 text-[#F5EED2] border-[#F5EED2]/40";
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
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#EBAE29]/15 via-[#132228]/80 to-[#589C80]/15 border border-[#EBAE29]/40 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#EBAE29]">
            <span className="w-2 h-2 rounded-full bg-[#EBAE29] animate-ping" />
            <span>Proactive Deadline Alert</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {urgentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-2xl bg-[#132228]/90 border border-[#589C80]/30 flex items-center justify-between gap-3 shadow-md"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F5EED2] truncate">
                    {alert.title}
                  </p>
                  <p className="text-[11px] font-mono text-[#589C80]">
                    {formatDate(new Date(alert.date))}
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#EBAE29]/20 text-[#EBAE29] border border-[#EBAE29]/40">
                  {alert.days}d left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 rounded-3xl bg-[#132228]/85 border border-[#589C80]/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Calendar size={22} className="text-[#589C80]" />
            <h2 className="text-xl font-bold tracking-tight text-[#F5EED2]">
              {t.calendar.title}
            </h2>
          </div>
          <p className="text-xs text-[#F5EED2]/70 max-w-xl">
            {t.calendar.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#132228] p-1 rounded-2xl border border-[#589C80]/30">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-[#589C80] text-[#132228] shadow-md"
                  : "text-[#F5EED2]/70 hover:text-[#F5EED2]"
              }`}
            >
              {t.calendar.filterAll}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("deadline")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "deadline"
                  ? "bg-[#EBAE29] text-[#132228] shadow-md"
                  : "text-[#F5EED2]/70 hover:text-[#F5EED2]"
              }`}
            >
              {t.calendar.filterDeadlines}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("exam")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "exam"
                  ? "bg-[#F5EED2] text-[#132228] shadow-md"
                  : "text-[#F5EED2]/70 hover:text-[#F5EED2]"
              }`}
            >
              {t.calendar.filterExams}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("scholarship")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeFilter === "scholarship"
                  ? "bg-[#589C80] text-[#132228] shadow-md"
                  : "text-[#F5EED2]/70 hover:text-[#F5EED2]"
              }`}
            >
              {t.calendar.filterScholarships}
            </button>
          </div>

          <div className="flex items-center bg-[#132228] p-1 rounded-2xl border border-[#589C80]/30">
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === "agenda"
                  ? "bg-[#589C80]/20 text-[#589C80] border border-[#589C80]/40"
                  : "text-[#F5EED2]/60 hover:text-[#F5EED2]"
              }`}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === "month"
                  ? "bg-[#589C80]/20 text-[#589C80] border border-[#589C80]/40"
                  : "text-[#F5EED2]/60 hover:text-[#F5EED2]"
              }`}
            >
              Grid View
            </button>
          </div>
        </div>
      </div>

      {viewMode === "agenda" ? (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#132228]/50 border border-[#589C80]/20 text-[#F5EED2]/60 font-mono text-sm">
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
                  className="p-5 rounded-2xl bg-[#132228]/85 border border-[#589C80]/30 hover:border-[#EBAE29] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg backdrop-blur-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#132228] border border-[#589C80]/40 flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#EBAE29]">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </span>
                      <span className="text-xl font-extrabold text-[#F5EED2]">
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
                          <span className="text-xs font-mono text-[#589C80]">
                            {event.institution}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#F5EED2]">
                        {event.title}
                      </h3>

                      <p className="text-xs text-[#F5EED2]/70 leading-relaxed max-w-2xl">
                        {event.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#589C80]/20">
                    <span className="text-xs font-mono text-[#F5EED2]/60">
                      {formatDate(new Date(event.date))}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg mt-1 border ${
                        days < 0
                          ? "bg-red-950/40 text-red-400 border-red-800/40"
                          : days <= 14
                            ? "bg-[#EBAE29]/20 text-[#EBAE29] border-[#EBAE29]/40 animate-pulse"
                            : "bg-[#589C80]/15 text-[#589C80] border-[#589C80]/30"
                      }`}
                    >
                      {days < 0 ? "Past" : `${days} days left`}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-[#132228]/85 border border-[#589C80]/30 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-mono font-bold text-[#589C80] uppercase">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
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
                  className="min-h-24 p-2 rounded-2xl bg-[#132228]/60 border border-[#589C80]/20 flex flex-col justify-between"
                >
                  <span className="text-xs font-mono font-bold text-[#F5EED2]/70">
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
                      <span className="text-[9px] font-mono text-[#EBAE29] block">
                        +{matching.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedEvent && (
            <div className="mt-4 p-4 rounded-2xl bg-[#132228] border border-[#EBAE29]/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-[#EBAE29]">
                  {formatDate(new Date(selectedEvent.date))}
                </p>
                <p className="text-sm font-bold text-[#F5EED2]">
                  {selectedEvent.title}
                </p>
                <p className="text-xs text-[#F5EED2]/70">{selectedEvent.details}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1 text-xs font-mono bg-[#589C80]/20 text-[#589C80] rounded-lg border border-[#589C80]/40 cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

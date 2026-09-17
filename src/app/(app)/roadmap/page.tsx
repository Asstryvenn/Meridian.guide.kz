"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Leaf, Sparkles, Check, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Meter, ProgressRing } from "@/components/ui/progress";
import { DuolingoRoadmap } from "@/components/roadmap/duolingo-roadmap";
import { ActivityRecommender } from "@/components/activities/activity-recommender";
import { ChanceBoostModal } from "@/components/diploma/chance-boost-modal";
import { daysUntil, formatDate } from "@/lib/engine/deadlines";
import { useApp } from "@/lib/store/app-store";
import { useRoadmap } from "@/lib/store/derived";
import { useTaskCompletion } from "@/lib/store/use-task-completion";
import type { RoadmapTask } from "@/lib/types";
import styles from "./roadmap.module.css";

const kindLabel: Record<RoadmapTask["kind"], string> = {
  exam: "Exam",
  document: "Document",
  essay: "Essay",
  deadline: "Deadline",
  academic: "Academic",
  activity: "Activity",
  scholarship: "Scholarship",
};

const syncCopy = { idle: "", saving: "Saving…", saved: "Saved to your account", error: "Couldn't save — retrying on next change" };

export default function RoadmapPage() {
  const { applications, ecoMode, user, syncStatus } = useApp();
  const completeTask = useTaskCompletion();
  const { roadmap, next } = useRoadmap();
  const [openLevel, setOpenLevel] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [showChanceBoostModal, setShowChanceBoostModal] = useState(false);
  const [viewMode, setViewMode] = useState<"duolingo" | "list">("duolingo");

  const expanded = openLevel ?? roadmap.currentLevel;

  function complete(task: RoadmapTask) {
    if (!task.done) {
      setCelebrate(task.id);
      setTimeout(() => setCelebrate(null), 900);
    }
    completeTask(task, !task.done);
  }

  const allActiveTasks = roadmap.levels.flatMap((l) => l.tasks).filter((t) => !t.done);
  const ecoCriticalTasks = allActiveTasks.slice(0, 2);

  return (
    <Page>
      {ecoMode && (
        <Reveal>
          <div className="p-6 mb-6 rounded-3xl bg-[#589C80]/15 border border-[#589C80]/40 backdrop-blur-xl text-[#F5EED2] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#589C80]">
              <Leaf size={14} className="text-[#589C80]" /> Burnout Eco-Mode Active
            </div>
            <h2 className="text-xl font-bold text-[#F5EED2]">
              Showing only 2 immediate priorities. Take your time.
            </h2>
            <p className="text-xs text-[#F5EED2]/70 leading-relaxed">
              Automatic 3-day deadline buffer applied to give you breathing room.
            </p>
          </div>
        </Reveal>
      )}

      <PageHeader
        eyebrow="Application roadmap"
        title="Your path, level by level"
        description="Finish at least half of a level to unlock the next. Dates are suggestions counted back from your earliest deadline."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#132228] p-1 rounded-2xl border border-[#589C80]/30">
              <button
                type="button"
                onClick={() => setViewMode("duolingo")}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === "duolingo"
                    ? "bg-[#589C80] text-[#132228] shadow-md"
                    : "text-[#F5EED2]/70 hover:text-[#F5EED2]"
                }`}
              >
                Serpentine Path
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-[#589C80] text-[#132228] shadow-md"
                    : "text-[#F5EED2]/70 hover:text-[#F5EED2]"
                }`}
              >
                Full List
              </button>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowChanceBoostModal(true)}
              className="cursor-pointer"
            >
              <Sparkles size={14} className="mr-1.5 inline" />
              <span>Upload Achievement</span>
            </Button>
            {applications.length === 0 && (
              <Button href="/matches" variant="quiet">
                Add universities
              </Button>
            )}
          </div>
        }
      />

      <ChanceBoostModal
        isOpen={showChanceBoostModal}
        onClose={() => setShowChanceBoostModal(false)}
      />

      <Reveal>
        <div className={`glass ${styles.stats}`}>
          <ProgressRing value={roadmap.progress} size={76} stroke={8} label={`${Math.round(roadmap.progress * 100)}% complete`}>
            <span className={styles.statRing}>{Math.round(roadmap.progress * 100)}%</span>
          </ProgressRing>
          <div className={styles.xpBlock}>
            <div className={styles.xpRow}>
              <span className={styles.xpValue}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={roadmap.earnedXp} className="tabular" initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 14, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                    {roadmap.earnedXp}
                  </motion.span>
                </AnimatePresence>
                <span className={styles.xpTotal}> / {roadmap.totalXp} XP</span>
              </span>
              <span className={styles.levelChip}>
                Lv {roadmap.currentLevel} · {roadmap.levels.find((l) => l.level === roadmap.currentLevel)?.title}
              </span>
            </div>
            <Meter value={roadmap.progress * 100} tone="amber" label="Experience progress" />
            {user?.mode === "supabase" && syncStatus !== "idle" && <span className={clsx(styles.sync, syncStatus === "error" && styles.syncError)}>{syncCopy[syncStatus]}</span>}
          </div>
          {next && (
            <div className={styles.nextStat}>
              <span className="eyebrow">Next action</span>
              <span className={styles.nextTitle}>{next.task.title}</span>
            </div>
          )}
        </div>
      </Reveal>

      {ecoMode ? (
        <div className="my-6 space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#589C80]">
            Today&apos;s 2 Critical Actions
          </h3>
          {ecoCriticalTasks.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-[#132228]/90 border border-[#589C80]/40 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#F5EED2]">{t.title}</p>
                <p className="text-xs text-[#F5EED2]/70">{t.detail}</p>
              </div>
              <Button onClick={() => complete(t)} size="sm">
                Mark as Done
              </Button>
            </div>
          ))}
        </div>
      ) : viewMode === "duolingo" ? (
        <Reveal>
          <DuolingoRoadmap onCompleteTask={complete} />
        </Reveal>
      ) : (
        <ol className={styles.levels}>
          {roadmap.levels.map((level) => {
            const isOpen = expanded === level.level;
            const completeCount = level.tasks.filter((t) => t.done).length;
            const progress = level.tasks.length ? completeCount / level.tasks.length : 0;
            return (
              <li key={level.level} className={clsx(`glass ${styles.levelCard}`, level.locked && styles.locked, isOpen && styles.open)}>
                <header className={styles.levelHeader} onClick={() => !level.locked && setOpenLevel(isOpen ? null : level.level)}>
                  <div className={styles.levelMeta}>
                    <span className={clsx(styles.levelNumber, progress >= 0.5 && styles.levelNumberPassing)}>Level {level.level}</span>
                    <span className={styles.levelTitle}>{level.title}</span>
                    <span className={styles.levelSubtitle}>{level.subtitle}</span>
                  </div>
                  <div className={styles.levelRight}>
                    <span className="faint tabular">
                      {completeCount}/{level.tasks.length}
                    </span>
                    {level.locked ? (
                      <span className={styles.lockBadge}>
                        <Lock size={14} className="mr-1 inline" /> Locked
                      </span>
                    ) : (
                      <button type="button" className={styles.chevron} aria-label={isOpen ? "Collapse level" : "Expand level"}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>
                </header>
                <AnimatePresence initial={false}>
                  {isOpen && !level.locked && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 360, damping: 32 }}>
                      <ul className={styles.tasks}>
                        {level.tasks.map((task) => {
                          const now = new Date();
                          const days = task.dueDate ? daysUntil(new Date(`${task.dueDate}T00:00:00`), now) : null;
                          return (
                            <li key={task.id} className={clsx(styles.task, task.done && styles.taskDone)}>
                              <motion.button
                                type="button"
                                className={styles.check}
                                disabled={level.locked}
                                aria-pressed={task.done}
                                aria-label={task.done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`}
                                onClick={() => complete(task)}
                                animate={celebrate === task.id ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                                transition={{ duration: 0.45 }}
                              >
                                {task.done && <Check size={16} className="text-[#589C80]" />}
                              </motion.button>
                              <div className={styles.taskBody}>
                                <span className={styles.taskTitle}>{task.title}</span>
                                <span className={styles.taskDetail}>{task.detail}</span>
                                <span className={styles.taskMeta}>
                                  <Badge tone="neutral">{kindLabel[task.kind]}</Badge>
                                  {task.dueDate && (
                                    <span className={clsx(days !== null && days < 14 && !task.done && styles.soon)}>
                                      {formatDate(task.dueDate)}
                                      {days !== null && !task.done ? ` · ${days < 0 ? `${-days} days overdue` : `${days} days`}` : ""}
                                    </span>
                                  )}
                                  {task.universitySlug && <Link href={`/applications/${task.universitySlug}`}>Open workspace</Link>}
                                </span>
                              </div>
                              <span className={styles.xp}>
                                +{task.xp}
                                <AnimatePresence>
                                  {celebrate === task.id && (
                                    <motion.span className={styles.xpFloat} initial={{ y: 0, opacity: 1 }} animate={{ y: -28, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
                                      +{task.xp} XP
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
      )}

      {!ecoMode && (
        <div className="my-10">
          <ActivityRecommender />
        </div>
      )}
    </Page>
  );
}

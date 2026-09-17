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
import { useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

const kindLabel: Record<RoadmapTask["kind"], string> = {
  exam: msg("Exam"),
  document: msg("Document"),
  essay: msg("Essay"),
  deadline: msg("Deadline"),
  academic: msg("Academic"),
  activity: msg("Activity"),
  scholarship: msg("Scholarship"),
};

const syncCopy = { idle: msg(""), saving: msg("Saving…"), saved: msg("Saved to your account"), error: msg("Couldn't save — retrying on next change") };

export default function RoadmapPage() {
  const tx = useT();
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
          <div className="p-6 mb-6 rounded-3xl bg-[#589C80]/15 border border-[#589C80]/40 backdrop-blur-xl text-ink space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-green-ink">
              <Leaf size={14} className="text-green-ink" /> {tx("Burnout Eco-Mode Active")}
            </div>
            <h2 className="text-xl font-bold text-ink">
              
              {tx("Showing only 2 immediate priorities. Take your time.")}
            </h2>
            <p className="text-xs text-ink/70 leading-relaxed">
              
              {tx("Automatic 3-day deadline buffer applied to give you breathing room.")}
            </p>
          </div>
        </Reveal>
      )}

      <PageHeader
        eyebrow={tx("Application roadmap")}
        title={tx("Your path, level by level")}
        description={tx("Finish at least half of a level to unlock the next. Dates are suggestions counted back from your earliest deadline.")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-panel p-1 rounded-2xl border border-[#589C80]/30">
              <button
                type="button"
                onClick={() => setViewMode("duolingo")}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === "duolingo"
                    ? "bg-[#589C80] text-on-accent shadow-md"
                    : "text-ink/70 hover:text-ink"
                }`}
              >
                
                {tx("Serpentine Path")}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-[#589C80] text-on-accent shadow-md"
                    : "text-ink/70 hover:text-ink"
                }`}
              >
                
                {tx("Full List")}
              </button>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowChanceBoostModal(true)}
              className="cursor-pointer"
            >
              <Sparkles size={14} className="mr-1.5 inline" />
              <span>{tx("Upload Achievement")}</span>
            </Button>
            {applications.length === 0 && (
              <Button href="/matches" variant="quiet">
                
                {tx("Add universities")}
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
          <ProgressRing value={roadmap.progress} size={76} stroke={8} label={tx("{round}% complete", { round: Math.round(roadmap.progress * 100) })}>
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
                <span className={styles.xpTotal}> {tx("/ {total} XP", { total: roadmap.totalXp })}</span>
              </span>
              <span className={styles.levelChip}>
                {tx("Lv {level}", { level: roadmap.currentLevel })} · {roadmap.levels.find((l) => l.level === roadmap.currentLevel)?.title}
              </span>
            </div>
            <Meter value={roadmap.progress * 100} tone="amber" label={tx("Experience progress")} />
            {user?.mode === "supabase" && syncStatus !== "idle" && <span className={clsx(styles.sync, syncStatus === "error" && styles.syncError)}>{tx(syncCopy[syncStatus])}</span>}
          </div>
          {next && (
            <div className={styles.nextStat}>
              <span className="eyebrow">{tx("Next action")}</span>
              <span className={styles.nextTitle}>{next.task.title}</span>
            </div>
          )}
        </div>
      </Reveal>

      {ecoMode ? (
        <div className="my-6 space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-green-ink">
            
            {tx("Today's 2 Critical Actions")}
          </h3>
          {ecoCriticalTasks.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-panel/90 border border-[#589C80]/40 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-ink">{t.title}</p>
                <p className="text-xs text-ink/70">{t.detail}</p>
              </div>
              <Button onClick={() => complete(t)} size="sm">
                
                {tx("Mark as Done")}
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
                    <span className={clsx(styles.levelNumber, progress >= 0.5 && styles.levelNumberPassing)}>{tx("Level {level}", { level: level.level })}</span>
                    <span className={styles.levelTitle}>{level.title}</span>
                    <span className={styles.levelSubtitle}>{level.subtitle}</span>
                  </div>
                  <div className={styles.levelRight}>
                    <span className="faint tabular">
                      {completeCount}/{level.tasks.length}
                    </span>
                    {level.locked ? (
                      <span className={styles.lockBadge}>
                        <Lock size={14} className="mr-1 inline" /> {tx("Locked")}
                      </span>
                    ) : (
                      <button type="button" className={styles.chevron} aria-label={isOpen ? tx("Collapse level") : tx("Expand level")}>
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
                                aria-label={task.done ? tx("Mark \"{title}\" as not done", { title: task.title }) : tx("Complete \"{title}\"", { title: task.title })}
                                onClick={() => complete(task)}
                                animate={celebrate === task.id ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                                transition={{ duration: 0.45 }}
                              >
                                {task.done && <Check size={16} className="text-green-ink" />}
                              </motion.button>
                              <div className={styles.taskBody}>
                                <span className={styles.taskTitle}>{task.title}</span>
                                <span className={styles.taskDetail}>{task.detail}</span>
                                <span className={styles.taskMeta}>
                                  <Badge tone="neutral">{tx(kindLabel[task.kind])}</Badge>
                                  {task.dueDate && (
                                    <span className={clsx(days !== null && days < 14 && !task.done && styles.soon)}>
                                      {formatDate(task.dueDate)}
                                      {days !== null && !task.done ? ` · ${days < 0 ? tx("{days} days overdue", { days: -days }) : `${days} days`}` : ""}
                                    </span>
                                  )}
                                  {task.universitySlug && <Link href={`/applications/${task.universitySlug}`}>{tx("Open workspace")}</Link>}
                                </span>
                              </div>
                              <span className={styles.xp}>
                                +{task.xp}
                                <AnimatePresence>
                                  {celebrate === task.id && (
                                    <motion.span className={styles.xpFloat} initial={{ y: 0, opacity: 1 }} animate={{ y: -28, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
                                      {tx("+{xp} XP", { xp: task.xp })}
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

"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Meter, ProgressRing } from "@/components/ui/progress";
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

function Checkbox({ checked, disabled, label, onToggle }: { checked: boolean; disabled: boolean; label: string; onToggle: () => void }) {
  return (
    <motion.button type="button" className={clsx(styles.check, checked && styles.checkOn)} disabled={disabled} aria-pressed={checked} aria-label={label} onClick={onToggle} whileTap={{ scale: 0.85 }}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <motion.path d="M5 12.5 9.5 17 19 7.5" className={styles.checkPath} initial={false} animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }} transition={{ duration: 0.28, ease: "easeOut" }} />
      </svg>
    </motion.button>
  );
}

export default function RoadmapPage() {
  const { applications, user, syncStatus } = useApp();
  const { roadmap, next } = useRoadmap();
  const completeTask = useTaskCompletion();
  const [openLevel, setOpenLevel] = useState<number | null>(null);
  const [burst, setBurst] = useState<{ id: string; xp: number } | null>(null);
  const expanded = openLevel ?? roadmap.currentLevel;
  const current = roadmap.levels.find((l) => l.level === roadmap.currentLevel);

  function toggle(task: RoadmapTask) {
    if (!task.done) {
      setBurst({ id: task.id, xp: task.xp });
      setTimeout(() => setBurst((b) => (b?.id === task.id ? null : b)), 1000);
    }
    completeTask(task, !task.done);
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Application roadmap"
        title="Your path, level by level"
        description="Finish half of a level to unlock the next. Every task you check earns XP."
        actions={
          applications.length === 0 ? (
            <Button href="/matches" variant="secondary">
              Add universities to personalise
            </Button>
          ) : undefined
        }
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
                Lv {roadmap.currentLevel} · {current?.title}
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

      <ol className={styles.path}>
        {roadmap.levels.map((level, index) => {
          const done = level.completed === level.tasks.length;
          const isCurrent = level.level === roadmap.currentLevel;
          const state = level.locked ? "locked" : done ? "done" : isCurrent ? "current" : "open";
          const isOpen = expanded === level.level;
          return (
            <li key={level.level} className={clsx(styles.level, styles[`offset${index % 4}`])}>
              {index > 0 && <span className={clsx(styles.connector, !level.locked && styles.connectorActive)} aria-hidden />}
              <motion.button
                type="button"
                className={clsx(styles.node, styles[state])}
                onClick={() => setOpenLevel(isOpen ? -1 : level.level)}
                aria-expanded={isOpen}
                whileHover={level.locked ? undefined : { scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
              >
                <ProgressRing value={level.completed / level.tasks.length} size={88} stroke={7} tone={done ? "green" : "amber"} label={`Level ${level.level}: ${level.completed} of ${level.tasks.length} tasks`}>
                  <span className={styles.nodeInner}>{level.locked ? <Icon name="lock" size={22} /> : done ? <Icon name="check" size={26} /> : level.level}</span>
                </ProgressRing>
              </motion.button>
              <div className={styles.levelText}>
                <span className={styles.levelTitle}>{level.title}</span>
                <span className="faint">
                  {level.subtitle} · {level.completed}/{level.tasks.length}
                </span>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className={`glass ${styles.tasks}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {level.locked && <p className={styles.lockedNote}>Complete half of the previous level to unlock these tasks.</p>}
                    <ul className={styles.taskList}>
                      {level.tasks.map((task) => {
                        const days = task.dueDate ? daysUntil(new Date(`${task.dueDate}T00:00:00`)) : null;
                        return (
                          <li key={task.id} className={clsx(styles.task, task.done && styles.taskDone, next?.task.id === task.id && styles.taskNext)}>
                            <Checkbox checked={task.done} disabled={level.locked} label={task.done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`} onToggle={() => toggle(task)} />
                            <div className={styles.taskBody}>
                              <span className={styles.taskTitle}>{task.title}</span>
                              <span className={styles.taskDetail}>{task.detail}</span>
                              <span className={styles.taskMeta}>
                                <Badge tone="neutral">{kindLabel[task.kind]}</Badge>
                                {task.dueDate && (
                                  <span className={clsx(days !== null && days < 14 && !task.done && styles.soon)}>
                                    {formatDate(task.dueDate)}
                                    {days !== null && !task.done ? ` · ${days < 0 ? `${-days}d overdue` : `${days}d`}` : ""}
                                  </span>
                                )}
                                {task.universitySlug && <Link href={`/applications/${task.universitySlug}`}>Workspace</Link>}
                              </span>
                            </div>
                            <span className={clsx(styles.xp, task.done && styles.xpEarned)}>
                              +{task.xp}
                              <AnimatePresence>
                                {burst?.id === task.id && (
                                  <motion.span className={styles.xpFloat} initial={{ y: 0, opacity: 0, scale: 0.6 }} animate={{ y: -34, opacity: [0, 1, 0], scale: 1.1 }} exit={{ opacity: 0 }} transition={{ duration: 0.95, ease: "easeOut" }}>
                                    +{burst.xp} XP
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
    </Page>
  );
}

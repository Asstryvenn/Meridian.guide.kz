"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProgressRing } from "@/components/ui/progress";
import { daysUntil, formatDate } from "@/lib/engine/deadlines";
import { useApp } from "@/lib/store/app-store";
import { useRoadmap } from "@/lib/store/derived";
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

export default function RoadmapPage() {
  const { toggleTask, applications, ecoMode } = useApp();
  const { roadmap, next } = useRoadmap();
  const [openLevel, setOpenLevel] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const expanded = openLevel ?? roadmap.currentLevel;

  function complete(task: RoadmapTask) {
    if (!task.done) {
      setCelebrate(task.id);
      setTimeout(() => setCelebrate(null), 900);
    }
    toggleTask(task.id);
  }

  const allActiveTasks = roadmap.levels.flatMap((l) => l.tasks).filter((t) => !t.done);
  const ecoCriticalTasks = allActiveTasks.slice(0, 2);

  return (
    <Page>
      {ecoMode && (
        <Reveal>
          <div className="p-6 mb-6 rounded-2xl bg-[#589C80]/15 border border-[#589C80]/40 backdrop-blur-xl text-[#F5EED2] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#589C80]">
              <span>🌿</span> Burnout Eco-Mode Active
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
          applications.length === 0 ? (
            <Button href="/matches" variant="secondary">
              Add universities to personalise
            </Button>
          ) : undefined
        }
      />

      <Reveal>
        <div className={`glass ${styles.stats}`}>
          <ProgressRing value={roadmap.progress} size={88} stroke={9} label={`${Math.round(roadmap.progress * 100)}% complete`}>
            <span className={styles.statRing}>{Math.round(roadmap.progress * 100)}%</span>
          </ProgressRing>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              <motion.span key={roadmap.earnedXp} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular">
                {roadmap.earnedXp}
              </motion.span>
              <span className="faint"> / {roadmap.totalXp} XP</span>
            </span>
            <span className="faint">Experience earned</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>Level {roadmap.currentLevel}</span>
            <span className="faint">{roadmap.levels.find((l) => l.level === roadmap.currentLevel)?.title}</span>
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
          const current = level.level === roadmap.currentLevel;
          const state = level.locked ? "locked" : done ? "done" : current ? "current" : "open";
          const isOpen = expanded === level.level;
          return (
            <li key={level.level} className={clsx(styles.level, styles[`offset${index % 4}`])}>
              {index > 0 && <span className={clsx(styles.connector, !level.locked && styles.connectorActive)} aria-hidden />}
              <motion.button
                type="button"
                className={clsx(styles.node, styles[state])}
                onClick={() => setOpenLevel(isOpen ? -1 : level.level)}
                aria-expanded={isOpen}
                whileHover={{ scale: level.locked ? 1 : 1.06 }}
                whileTap={{ scale: 0.94 }}
                animate={current ? { y: [0, -5, 0] } : { y: 0 }}
                transition={current ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : { type: "spring" }}
              >
                <ProgressRing value={level.completed / level.tasks.length} size={96} stroke={7} tone={done ? "green" : "amber"} label={`Level ${level.level}: ${level.completed} of ${level.tasks.length} tasks`}>
                  <span className={styles.nodeInner}>{level.locked ? <Icon name="lock" size={24} /> : done ? <Icon name="check" size={28} /> : level.level}</span>
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
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  >
                    {level.locked && <p className={styles.lockedNote}>Complete half of the previous level to unlock these tasks.</p>}
                    <ul className={styles.taskList}>
                      {level.tasks.map((task) => {
                        const days = task.dueDate ? daysUntil(new Date(`${task.dueDate}T00:00:00`)) : null;
                        return (
                          <li key={task.id} className={clsx(styles.task, task.done && styles.taskDone, next?.task.id === task.id && styles.taskNext)}>
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
                              {task.done && <Icon name="check" size={16} />}
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
    </Page>
  );
}

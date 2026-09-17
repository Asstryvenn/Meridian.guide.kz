"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";
import { Check, Lock, ChevronRight, Sparkles, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { daysUntil, formatDate } from "@/lib/engine/deadlines";
import { useRoadmap } from "@/lib/store/derived";
import { useTaskCompletion } from "@/lib/store/use-task-completion";
import type { RoadmapTask } from "@/lib/types";
import type { RoadmapLevel } from "@/lib/engine/roadmap";
import styles from "@/app/(app)/roadmap/roadmap.module.css";
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

interface DuolingoRoadmapProps {
  onCompleteTask?: (task: RoadmapTask) => void;
}

export function DuolingoRoadmap({ onCompleteTask }: DuolingoRoadmapProps) {
  const tx = useT();
  const completeTask = useTaskCompletion();
  const { roadmap, next } = useRoadmap();
  const [selectedLevelNum, setSelectedLevelNum] = useState<number | null>(roadmap.currentLevel);
  const [celebrateTaskId, setCelebrateTaskId] = useState<string | null>(null);

  const handleToggleTask = (task: RoadmapTask) => {
    if (!task.done) {
      setCelebrateTaskId(task.id);
      setTimeout(() => setCelebrateTaskId(null), 900);
    }
    if (onCompleteTask) onCompleteTask(task);
    else completeTask(task, !task.done);
  };

  const selectedLevel = roadmap.levels.find((l) => l.level === selectedLevelNum) || null;

  return (
    <div className="w-full flex flex-col items-center py-6">
      <div className="w-full max-w-2xl flex flex-col items-center relative">
        <ol className={styles.path}>
          {roadmap.levels.map((lvl, index) => {
            const offsetClass = styles[`offset${index % 4}`];
            const isCompleted = !lvl.locked && lvl.tasks.length > 0 && lvl.tasks.every((t) => t.done);
            const isCurrent = lvl.level === roadmap.currentLevel && !isCompleted;
            const isSelected = selectedLevelNum === lvl.level;

            return (
              <li
                key={lvl.level}
                className={clsx(
                  styles.level,
                  offsetClass,
                  lvl.locked && styles.locked,
                  isCompleted && styles.done,
                  isCurrent && styles.current,
                  isSelected && styles.open
                )}
              >
                {index > 0 && (
                  <div
                    className={clsx(
                      styles.connector,
                      roadmap.levels[index - 1] &&
                        !roadmap.levels[index - 1].locked &&
                        roadmap.levels[index - 1].tasks.some((t) => t.done) &&
                        styles.connectorActive
                    )}
                  />
                )}

                <motion.button
                  type="button"
                  onClick={() => {
                    if (!lvl.locked) {
                      setSelectedLevelNum(selectedLevelNum === lvl.level ? null : lvl.level);
                    }
                  }}
                  disabled={lvl.locked}
                  className={clsx(styles.node, "cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95")}
                  whileHover={{ scale: lvl.locked ? 1 : 1.06 }}
                  whileTap={{ scale: lvl.locked ? 1 : 0.96 }}
                  aria-expanded={isSelected}
                  aria-label={tx("Level {level}: {title}", { level: lvl.level, title: lvl.title })}
                >
                  <div className={styles.nodeInner}>
                    {isCompleted ? (
                      <Check size={32} className="stroke-[3]" />
                    ) : lvl.locked ? (
                      <Lock size={26} className="opacity-50" />
                    ) : (
                      <span>{lvl.level}</span>
                    )}
                  </div>
                </motion.button>

                <div className={styles.levelText}>
                  <p className={styles.levelTitle}>{lvl.title}</p>
                  <p className="text-xs text-ink/60 mt-0.5">
                    {tx("{done} of {count} tasks", { done: lvl.tasks.filter((task) => task.done).length, count: lvl.tasks.length })}
                  </p>
                </div>

                <AnimatePresence>
                  {isSelected && !lvl.locked && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      className="w-full mt-4 p-6 rounded-3xl bg-panel/95 border-2 border-[#589C80]/50 shadow-2xl backdrop-blur-2xl space-y-4 text-left z-20"
                    >
                      <div className="flex items-center justify-between border-b border-[#589C80]/20 pb-3">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#589C80]/20 text-green-ink border border-[#589C80]/40">
                            {tx("Level {level}", { level: lvl.level })}
                          </span>
                          <h3 className="text-lg font-bold text-ink mt-1">
                            {lvl.title}
                          </h3>
                          <p className="text-xs text-ink/70">
                            {lvl.subtitle}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-amber-ink">
                            {lvl.tasks.filter((t) => t.done).length} / {lvl.tasks.length}
                          </span>
                          <p className="text-[10px] font-mono text-ink/50 uppercase">
                            
                            {tx("Tasks Done")}
                          </p>
                        </div>
                      </div>

                      {next && next.task.level === lvl.level && !next.task.done && (
                        <div className="p-4 rounded-2xl bg-[#EBAE29]/15 border border-[#EBAE29]/50 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-amber-ink">
                            <Sparkles size={13} />
                            <span>{tx("Recommended Next Action")}</span>
                          </div>
                          <p className="text-sm font-bold text-ink">
                            {next.task.title}
                          </p>
                          <p className="text-xs text-ink/80">
                            {next.task.detail}
                          </p>
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-xs font-mono text-amber-ink font-bold">
                              {tx("+{xp} XP", { xp: next.task.xp })}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleToggleTask(next.task)}
                              className="cursor-pointer"
                            >
                              
                              {tx("Mark as Done")}
                            </Button>
                          </div>
                        </div>
                      )}

                      <ul className="space-y-2.5 pt-1">
                        {lvl.tasks.map((task) => {
                          const now = new Date();
                          const days = task.dueDate ? daysUntil(new Date(`${task.dueDate}T00:00:00`), now) : null;
                          return (
                            <li
                              key={task.id}
                              className={clsx(
                                "p-3.5 rounded-2xl border transition-all flex items-start gap-3",
                                task.done
                                  ? "bg-panel/50 border-[#589C80]/20 opacity-70"
                                  : "bg-panel border-[#589C80]/30 hover:border-[#EBAE29]"
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleTask(task)}
                                className={clsx(
                                  "w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer",
                                  task.done
                                    ? "bg-[#589C80] border-[#589C80] text-on-accent"
                                    : "border-[#589C80]/40 text-transparent hover:border-[#EBAE29]"
                                )}
                                aria-label={task.done ? tx("Mark {title} incomplete", { title: task.title }) : tx("Mark {title} complete", { title: task.title })}
                              >
                                <Check size={14} className={task.done ? "stroke-[3]" : "opacity-0"} />
                              </button>

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={clsx(
                                      "text-xs font-bold leading-snug",
                                      task.done ? "line-through text-ink/50" : "text-ink"
                                    )}
                                  >
                                    {task.title}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#589C80]/15 text-green-ink border border-[#589C80]/30">
                                    {tx(kindLabel[task.kind])}
                                  </span>
                                </div>

                                <p className="text-xs text-ink/70 leading-relaxed">
                                  {task.detail}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
                                  {task.dueDate && (
                                    <span className="flex items-center gap-1 text-ink/60">
                                      <Clock size={11} />
                                      {formatDate(task.dueDate)}
                                      {days !== null && !task.done && (
                                        <span className={days < 14 ? "text-red-400 font-bold" : "text-green-ink"}>
                                          ({days < 0 ? tx("{days}d overdue", { days: -days }) : tx("{days}d left", { days: days })})
                                        </span>
                                      )}
                                    </span>
                                  )}

                                  {task.universitySlug && (
                                    <Link
                                      href={`/applications/${task.universitySlug}`}
                                      className="text-amber-ink hover:underline flex items-center gap-1"
                                    >
                                      <span>{tx("Workspace")}</span>
                                      <ArrowRight size={11} />
                                    </Link>
                                  )}
                                </div>
                              </div>

                              <div className="relative shrink-0 text-right">
                                <span className="text-xs font-mono font-bold text-amber-ink">
                                  {tx("+{xp} XP", { xp: task.xp })}
                                </span>
                                <AnimatePresence>
                                  {celebrateTaskId === task.id && (
                                    <motion.span
                                      initial={{ y: 0, opacity: 1 }}
                                      animate={{ y: -24, opacity: 0 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.8 }}
                                      className="absolute right-0 top-0 text-xs font-mono font-extrabold text-green-ink pointer-events-none"
                                    >
                                      {tx("+{xp} XP", { xp: task.xp })}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>
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
      </div>
    </div>
  );
}

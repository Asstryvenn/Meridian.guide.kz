"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store/app-store";
import { useRoadmap } from "@/lib/store/derived";
import { useT } from "@/lib/i18n/use-t";

interface ProgressRingsProps {
  className?: string;
}

export function ProgressRings({ className = "" }: ProgressRingsProps) {
  const t = useT();
  const { completedTasks, pomodoroFocusMinutes = 0 } = useApp();
  const { roadmap } = useRoadmap();
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const totalTasksCount = roadmap.levels.flatMap((l) => l.tasks).length || 1;
  const completedCount = completedTasks.length;

  const mult = period === "weekly" ? 1 : 4;
  const tasksGoal = Math.max(5 * mult, Math.round(totalTasksCount * (period === "weekly" ? 0.3 : 1)));
  const focusGoalMinutes = 150 * mult;
  const milestonesGoal = 3 * mult;

  const currentFocusMinutes = pomodoroFocusMinutes;
  const milestonesCompleted = Math.min(milestonesGoal, Math.floor(completedCount / 2));

  const ring1Ratio = Math.min(1, completedCount / tasksGoal);
  const ring2Ratio = Math.min(1, currentFocusMinutes / focusGoalMinutes);
  const ring3Ratio = Math.min(1, milestonesCompleted / milestonesGoal);

  const getRingProps = (radius: number, ratio: number) => {
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - ratio);
    return {
      radius,
      circumference,
      strokeDasharray: circumference,
      strokeDashoffset,
    };
  };

  const r1 = getRingProps(72, ring1Ratio);
  const r2 = getRingProps(54, ring2Ratio);
  const r3 = getRingProps(36, ring3Ratio);

  return (
    <div className={`p-6 rounded-2xl bg-panel/90 border border-[#589C80]/30 backdrop-blur-xl text-ink flex flex-col md:flex-row items-center gap-6 justify-between ${className}`}>
      <div className="flex flex-col items-center md:items-start space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭕</span>
          <h3 className="text-lg font-bold text-ink">{t("Activity & Focus Rings")}</h3>
        </div>
        <p className="text-xs text-ink/70 text-center md:text-left max-w-xs">
          
          {t("Gamified tracking of completed roadmap tasks, pomodoro focus hours, and major milestones.")}
        </p>

        <div className="pt-2 flex items-center bg-panel p-1 rounded-xl border border-[#589C80]/30">
          <button
            type="button"
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              period === "weekly"
                ? "bg-[#589C80] text-on-accent shadow-md"
                : "text-ink/70 hover:text-ink"
            }`}
          >
            
            {t("Weekly Goal")}
          </button>
          <button
            type="button"
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              period === "monthly"
                ? "bg-[#589C80] text-on-accent shadow-md"
                : "text-ink/70 hover:text-ink"
            }`}
          >
            
            {t("Monthly Target")}
          </button>
        </div>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg viewBox="0 0 180 180" className="w-full h-full transform -rotate-90">
          <circle cx="90" cy="90" r={r1.radius} stroke="#EBAE29" strokeWidth="12" fill="none" opacity="0.15" />
          <circle cx="90" cy="90" r={r2.radius} stroke="#589C80" strokeWidth="12" fill="none" opacity="0.15" />
          <circle cx="90" cy="90" r={r3.radius} stroke="var(--text)" strokeWidth="12" fill="none" opacity="0.15" />

          <motion.circle
            cx="90"
            cy="90"
            r={r1.radius}
            stroke="#EBAE29"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={r1.strokeDasharray}
            initial={{ strokeDashoffset: r1.circumference }}
            animate={{ strokeDashoffset: r1.strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          <motion.circle
            cx="90"
            cy="90"
            r={r2.radius}
            stroke="#589C80"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={r2.strokeDasharray}
            initial={{ strokeDashoffset: r2.circumference }}
            animate={{ strokeDashoffset: r2.strokeDashoffset }}
            transition={{ duration: 1.2, delay: 0.15, ease: "easeOut" }}
          />

          <motion.circle
            cx="90"
            cy="90"
            r={r3.radius}
            stroke="var(--text)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={r3.strokeDasharray}
            initial={{ strokeDashoffset: r3.circumference }}
            animate={{ strokeDashoffset: r3.strokeDashoffset }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-extrabold text-amber-ink">
            {Math.round(((ring1Ratio + ring2Ratio + ring3Ratio) / 3) * 100)}%
          </span>
          <span className="text-[10px] font-mono text-ink/60 uppercase tracking-wider">{t("Overall")}</span>
        </div>
      </div>

      <div className="space-y-3 w-full md:w-auto min-w-[200px]">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-panel border border-[#EBAE29]/30">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EBAE29] inline-block" />
            <span className="text-xs font-semibold text-ink">{t("Tasks Done")}</span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-ink">
            {completedCount}/{tasksGoal}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-panel border border-[#589C80]/30">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#589C80] inline-block" />
            <span className="text-xs font-semibold text-ink">{t("Focus Time")}</span>
          </div>
          <span className="text-xs font-mono font-bold text-green-ink">
            {currentFocusMinutes}m/{focusGoalMinutes}m
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-panel border border-ink/30">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-ink inline-block" />
            <span className="text-xs font-semibold text-ink">{t("Milestones")}</span>
          </div>
          <span className="text-xs font-mono font-bold text-ink">
            {milestonesCompleted}/{milestonesGoal}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store/app-store";
import { generateRoadmap } from "@/lib/engine/roadmap";

export function PomodoroTimer() {
  const { profile, applications, completedTasks, addFocusTime, ecoMode } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const roadmapTasks = generateRoadmap(profile, applications);
  const activeTasks = roadmapTasks.filter((t) => !completedTasks.includes(t.id));

  const totalCycleSeconds = mode === "focus" ? 25 * 60 : 5 * 60;
  const progressPercent = Math.round(((totalCycleSeconds - secondsLeft) / totalCycleSeconds) * 100);

  useEffect(() => {
    if (activeTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(activeTasks[0].id);
    }
  }, [activeTasks, selectedTaskId]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsRunning(false);

            if (mode === "focus") {
              addFocusTime(25);
              setMode("break");
              return 5 * 60;
            } else {
              setMode("focus");
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, addFocusTime]);

  const toggleRun = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(mode === "focus" ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: "focus" | "break") => {
    setIsRunning(false);
    setMode(newMode);
    setSecondsLeft(newMode === "focus" ? 25 * 60 : 5 * 60);
  };

  const minutesDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secondsDisplay = String(secondsLeft % 60).padStart(2, "0");

  const selectedTask = activeTasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`w-80 p-5 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all ${
              isRunning
                ? "bg-[#132228]/95 border-[#589C80] shadow-[#589C80]/20 shadow-lg"
                : "bg-[#132228]/90 border-[#589C80]/30 text-[#F5EED2]"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#589C80]/20 mb-4">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={isRunning ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-2.5 h-2.5 rounded-full bg-[#589C80] inline-block"
                />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5EED2]">
                  {mode === "focus" ? "Focus Session" : "Rest Break"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => switchMode(mode === "focus" ? "break" : "focus")}
                  className="text-[11px] font-mono text-[#EBAE29] hover:underline cursor-pointer"
                >
                  Switch to {mode === "focus" ? "Break (5m)" : "Focus (25m)"}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-[#F5EED2]/50 hover:text-[#F5EED2] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 text-center">
              {activeTasks.length > 0 && (
                <div className="text-left space-y-1">
                  <label className="text-[11px] font-mono text-[#F5EED2]/60 uppercase tracking-wider">
                    Linked Task
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-[#132228] border border-[#589C80]/30 text-[#F5EED2] focus:outline-none focus:border-[#EBAE29] transition-all cursor-pointer"
                  >
                    {activeTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative py-2 flex flex-col items-center justify-center">
                <div className="text-4xl font-extrabold font-mono text-[#EBAE29] tracking-wider">
                  {minutesDisplay}:{secondsDisplay}
                </div>
                {selectedTask && (
                  <p className="text-xs text-[#589C80] font-medium truncate max-w-[220px] mt-1">
                    {selectedTask.title}
                  </p>
                )}

                <div className="w-full h-1.5 bg-[#132228] rounded-full overflow-hidden border border-[#589C80]/20 mt-3">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#589C80] to-[#EBAE29] rounded-full"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={toggleRun}
                  className={`px-6 py-2 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                    isRunning
                      ? "bg-[#EBAE29] text-[#132228] hover:bg-[#EBAE29]/90"
                      : "bg-[#589C80] text-[#132228] hover:bg-[#589C80]/90"
                  }`}
                >
                  {isRunning ? "Pause" : "Start Focus"}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border border-[#589C80]/30 text-xs text-[#F5EED2]/80 hover:text-[#F5EED2] hover:border-[#589C80] transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsOpen(true)}
            className={`flex items-center gap-3 px-4 py-3 rounded-full shadow-2xl border backdrop-blur-xl transition-all cursor-pointer ${
              isRunning
                ? "bg-[#132228]/95 border-[#589C80] text-[#EBAE29] animate-pulse"
                : "bg-[#132228]/90 border-[#589C80]/40 text-[#F5EED2] hover:border-[#EBAE29]"
            }`}
          >
            <span className="text-base">⏱</span>
            <span className="text-xs font-mono font-bold">
              {isRunning ? `${minutesDisplay}:${secondsDisplay}` : "Focus Timer"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n/use-t";
import { useApp } from "@/lib/store/app-store";
import { useRoadmap } from "@/lib/store/derived";
import { Icon } from "./icon";
import styles from "./pomodoro-timer.module.css";

type Mode = "focus" | "break";

const DURATION: Record<Mode, number> = { focus: 25 * 60, break: 5 * 60 };

interface TimerState {
  mode: Mode;
  endsAt: number | null;
  remaining: number;
}

interface PomodoroValue {
  mode: Mode;
  running: boolean;
  secondsLeft: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  reset: () => void;
  switchMode: (mode: Mode) => void;
}

const PomodoroContext = createContext<PomodoroValue | null>(null);

function format(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { addFocusTime } = useApp();
  const [timer, setTimer] = useState<TimerState>({ mode: "focus", endsAt: null, remaining: DURATION.focus });
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);

  const running = timer.endsAt !== null;
  const secondsLeft = running ? Math.max(0, Math.ceil(((timer.endsAt as number) - now) / 1000)) : timer.remaining;

  const timerRef = useRef(timer);

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      const prev = timerRef.current;
      if (prev.endsAt === null || current < prev.endsAt) return;
      if (prev.mode === "focus") addFocusTime(25);
      const nextMode: Mode = prev.mode === "focus" ? "break" : "focus";
      try {
        navigator.vibrate?.([80, 60, 80]);
      } catch {}
      const next = { mode: nextMode, endsAt: null, remaining: DURATION[nextMode] };
      timerRef.current = next;
      setTimer(next);
    }, 500);
    return () => clearInterval(id);
  }, [running, addFocusTime]);

  const toggle = useCallback(() => {
    const current = Date.now();
    setNow(current);
    setTimer((prev) =>
      prev.endsAt === null
        ? { ...prev, endsAt: current + prev.remaining * 1000 }
        : { ...prev, endsAt: null, remaining: Math.max(0, Math.ceil((prev.endsAt - current) / 1000)) },
    );
  }, []);

  const reset = useCallback(() => setTimer((prev) => ({ mode: prev.mode, endsAt: null, remaining: DURATION[prev.mode] })), []);
  const switchMode = useCallback((mode: Mode) => setTimer({ mode, endsAt: null, remaining: DURATION[mode] }), []);

  const value = useMemo(
    () => ({ mode: timer.mode, running, secondsLeft, open, setOpen, toggle, reset, switchMode }),
    [timer.mode, running, secondsLeft, open, toggle, reset, switchMode],
  );

  return (
    <PomodoroContext.Provider value={value}>
      {children}
      <PomodoroPanel />
    </PomodoroContext.Provider>
  );
}

function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used inside PomodoroProvider");
  return ctx;
}

function PomodoroPanel() {
  const t = useT();
  const { completedTasks } = useApp();
  const { roadmap } = useRoadmap();
  const { mode, running, secondsLeft, open, setOpen, toggle, reset, switchMode } = usePomodoro();
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const isDraggingRef = useRef(false);
  const activeTasks = roadmap.levels.flatMap((l) => l.tasks).filter((task) => !completedTasks.includes(task.id));
  const selectedTask = activeTasks.find((task) => task.id === selectedTaskId) ?? activeTasks[0];
  const progress = 1 - secondsLeft / DURATION[mode];

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.08}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 120);
        }}
        className={styles.draggableWrap}
      >
        <button
          type="button"
          className={clsx(styles.fab, running && styles.fabRunning)}
          onClick={() => {
            if (!isDraggingRef.current) {
              setOpen(!open);
            }
          }}
          aria-expanded={open}
          aria-label={t("Focus timer")}
        >
          <div className={styles.dragHandle} aria-hidden>
            <span className={styles.handleBar} />
            <span className={styles.handleBar} />
          </div>
          <Icon name="clock" size={16} />
          <span className="tabular">{running ? format(secondsLeft) : t("Focus timer")}</span>
        </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button type="button" aria-label={t("Close")} className={styles.scrim} onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              role="dialog"
              aria-label={t("Focus timer")}
              className={clsx(styles.panel, running && styles.panelRunning)}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className={styles.header}>
                <span className={styles.modeLabel}>
                  <span className={clsx(styles.dot, running && styles.dotPulse)} />
                  {mode === "focus" ? t("Focus session") : t("Rest break")}
                </span>
                <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label={t("Close")}>
                  <Icon name="close" size={16} />
                </button>
              </header>

              <div className={styles.segmented} role="radiogroup" aria-label={t("Timer mode")}>
                {(["focus", "break"] as Mode[]).map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={mode === m} className={clsx(styles.segment, mode === m && styles.segmentActive)} onClick={() => switchMode(m)}>
                    {m === "focus" ? t("Focus · 25 min") : t("Break · 5 min")}
                  </button>
                ))}
              </div>

              <div className={styles.clock}>
                <span className={clsx(styles.time, "tabular")}>{format(secondsLeft)}</span>
                <svg className={styles.bar} viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden>
                  <rect x="0" y="0" width="100" height="6" rx="3" className={styles.track} />
                  <rect x="0" y="0" width={Math.max(0, Math.min(100, progress * 100))} height="6" rx="3" className={styles.fill} />
                </svg>
              </div>

              {activeTasks.length > 0 && (
                <label className={styles.field}>
                  <span>{t("Linked task")}</span>
                  <select value={selectedTask?.id ?? ""} onChange={(e) => setSelectedTaskId(e.target.value)}>
                    {activeTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={toggle}>
                  {running ? t("Pause") : t("Start")}
                </button>
                <button type="button" className={styles.secondary} onClick={reset}>
                  {t("Reset")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function PomodoroToolbarButton() {
  const t = useT();
  const { running, secondsLeft, open, setOpen } = usePomodoro();
  return (
    <button type="button" className={clsx(styles.toolbar, running && styles.toolbarRunning)} onClick={() => setOpen(!open)} aria-label={t("Focus timer")} aria-expanded={open}>
      <Icon name="clock" size={18} />
      {running && <span className="tabular">{format(secondsLeft)}</span>}
    </button>
  );
}

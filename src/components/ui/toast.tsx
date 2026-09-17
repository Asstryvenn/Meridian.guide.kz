"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icon";
import styles from "./toast.module.css";

export type ToastTone = "xp" | "success" | "error" | "info" | "level";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
}

interface ToastContextValue {
  notify: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({ notify: () => {} });

const DURATION_MS = 2800;
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (toast: Omit<Toast, "id">) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current, { ...toast, id }].slice(-MAX_VISIBLE));
      setTimeout(() => dismiss(id), toast.tone === "level" ? DURATION_MS + 1200 : DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.button
              type="button"
              key={toast.id}
              layout
              className={clsx(styles.toast, styles[toast.tone])}
              onClick={() => dismiss(toast.id)}
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 520, damping: 34 }}
            >
              <span className={styles.badge} aria-hidden>
                {toast.tone === "xp" || toast.tone === "level" ? <Icon name="spark" size={16} /> : <Icon name={toast.tone === "error" ? "close" : "check"} size={16} />}
              </span>
              <span className={styles.text}>
                <span className={styles.title}>{toast.title}</span>
                {toast.body && <span className={styles.body}>{toast.body}</span>}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

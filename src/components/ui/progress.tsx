"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import styles from "./progress.module.css";

interface RingProps {
  value: number;
  size?: number;
  stroke?: number;
  tone?: "amber" | "green";
  children?: ReactNode;
  label: string;
}

export function ProgressRing({ value, size = 96, stroke = 8, tone = "amber", children, label }: RingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <div className={styles.ring} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className={styles.track} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className={clsx(styles.indicator, styles[tone])}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className={styles.center}>{children}</div>}
    </div>
  );
}

interface MeterProps {
  value: number | null;
  tone?: "amber" | "green" | "neutral";
  label: string;
  range?: [number, number];
}

export function Meter({ value, tone = "green", label, range }: MeterProps) {
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <svg className={styles.meter} viewBox="0 0 100 8" preserveAspectRatio="none" role="img" aria-label={label}>
      <rect x="0" y="0" width="100" height="8" rx="4" className={styles.track} />
      {range ? (
        <motion.rect
          y="0"
          height="8"
          rx="4"
          className={clsx(styles.fill, styles[tone])}
          initial={{ x: 0, width: 0 }}
          animate={{ x: range[0], width: Math.max(2, range[1] - range[0]) }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
        />
      ) : (
        <motion.rect
          x="0"
          y="0"
          height="8"
          rx="4"
          className={clsx(styles.fill, styles[tone])}
          initial={{ width: 0 }}
          animate={{ width: pct }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
        />
      )}
    </svg>
  );
}

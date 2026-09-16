"use client";

import { motion } from "framer-motion";
import styles from "./radar.module.css";

interface RadarProps {
  axes: { label: string; value: number | null }[];
  size?: number;
}

export function Radar({ axes, size = 320 }: RadarProps) {
  const center = size / 2;
  const radius = size / 2 - 48;
  const angle = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;
  const point = (i: number, r: number) => [center + Math.cos(angle(i)) * r, center + Math.sin(angle(i)) * r];
  const polygon = axes.map((a, i) => point(i, ((a.value ?? 0) / 100) * radius).join(",")).join(" ");
  const collapsed = axes.map(() => `${center},${center}`).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={styles.radar} role="img" aria-label={axes.map((a) => `${a.label} ${a.value ?? "no data"}`).join(", ")}>
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon key={scale} className={styles.ring} points={axes.map((_, i) => point(i, radius * scale).join(",")).join(" ")} />
      ))}
      {axes.map((a, i) => {
        const [x, y] = point(i, radius);
        const [lx, ly] = point(i, radius + 26);
        return (
          <g key={a.label}>
            <line x1={center} y1={center} x2={x} y2={y} className={styles.spoke} />
            <text x={lx} y={ly} className={styles.label} textAnchor={Math.abs(lx - center) < 8 ? "middle" : lx > center ? "start" : "end"} dominantBaseline="middle">
              {a.label}
            </text>
          </g>
        );
      })}
      <motion.polygon className={styles.shape} initial={{ points: collapsed }} animate={{ points: polygon }} transition={{ type: "spring", stiffness: 60, damping: 16 }} />
      {axes.map((a, i) => {
        const [x, y] = point(i, ((a.value ?? 0) / 100) * radius);
        return <motion.circle key={a.label} r={4} className={a.value === null ? styles.missing : styles.vertex} initial={{ cx: center, cy: center }} animate={{ cx: x, cy: y }} transition={{ type: "spring", stiffness: 60, damping: 16 }} />;
      })}
    </svg>
  );
}

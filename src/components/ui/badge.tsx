import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./badge.module.css";

export type BadgeTone = "amber" | "green" | "neutral" | "danger" | "outline";

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return <span className={clsx(styles.badge, styles[tone], className)}>{children}</span>;
}

export type DataKind = "institutional" | "prediction" | "ai" | "rules";

const dataLabels: Record<DataKind, string> = {
  institutional: "Institutional data",
  prediction: "ML estimate",
  ai: "AI explanation",
  rules: "Rule-based",
};

export function DataTag({ kind, label }: { kind: DataKind; label?: string }) {
  return (
    <span className={clsx(styles.dataTag, styles[`data_${kind}`])}>
      <span className={styles.dot} aria-hidden />
      {label ?? dataLabels[kind]}
    </span>
  );
}

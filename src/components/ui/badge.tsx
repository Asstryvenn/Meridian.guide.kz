import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./badge.module.css";
import { msg } from "@/lib/i18n/catalog";
import { useT } from "@/lib/i18n/use-t";

export type BadgeTone = "amber" | "green" | "neutral" | "danger" | "outline";

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  const t = useT();
  return <span className={clsx(styles.badge, styles[tone], className)}>{typeof children === "string" ? t(children) : children}</span>;
}

export type DataKind = "institutional" | "prediction" | "ai" | "rules";

const dataLabels: Record<DataKind, string> = {
  institutional: msg("Institutional data"),
  prediction: msg("ML estimate"),
  ai: msg("AI explanation"),
  rules: msg("Rule-based"),
};

export function DataTag({ kind, label }: { kind: DataKind; label?: string }) {
  const t = useT();
  return (
    <span className={clsx(styles.dataTag, styles[`data_${kind}`])}>
      <span className={styles.dot} aria-hidden />
      {t(label ?? dataLabels[kind])}
    </span>
  );
}

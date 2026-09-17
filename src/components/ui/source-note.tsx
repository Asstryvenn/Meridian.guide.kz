import clsx from "clsx";
import type { SourceRef, Sourced } from "@/lib/types";
import styles from "./source-note.module.css";
import { useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

const statusCopy = {
  reported: msg("Reported by institution"),
  needs_verification: msg("Needs verification"),
  unavailable: msg("Information unavailable"),
};

export function SourceNote({ data, compact }: { data: SourceRef & Partial<Pick<Sourced<unknown>, "status" | "note">>; compact?: boolean }) {
  const t = useT();
  const status = data.status ?? "reported";
  return (
    <span className={clsx(styles.note, compact && styles.compact)}>
      <span className={clsx(styles.status, styles[status])}>{t(statusCopy[status])}</span>
      {!compact && (
        <>
          <span className={styles.sep} aria-hidden>·</span>
          <span>{t("Confidence: {level}", { level: t(data.confidence) })}</span>
          <span className={styles.sep} aria-hidden>·</span>
          <span>{data.last_verified ? t("Verified {last_verified}", { last_verified: data.last_verified }) : t("Not yet verified by Meridian Guide")}</span>
        </>
      )}
      <span className={styles.sep} aria-hidden>·</span>
      <a href={data.source_url} target="_blank" rel="noreferrer" className={styles.link}>
        {data.source_name}
      </a>
      {data.note && !compact && <span className={styles.detail}>{t(data.note)}</span>}
    </span>
  );
}

export function SourcedValue<T>({ data, format }: { data: Sourced<T>; format: (value: T) => string }) {
  const t = useT();
  if (data.value === null || data.status === "unavailable") {
    return <span className={styles.unavailable}>{t("Information unavailable")}</span>;
  }
  return (
    <span className={styles.value}>
      {format(data.value)}
      {data.status === "needs_verification" && <span className={styles.flag}>{t("Needs verification")}</span>}
    </span>
  );
}

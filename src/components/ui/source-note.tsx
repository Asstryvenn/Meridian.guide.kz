import clsx from "clsx";
import type { SourceRef, Sourced } from "@/lib/types";
import styles from "./source-note.module.css";

const statusCopy = {
  reported: "Reported by institution",
  needs_verification: "Needs verification",
  unavailable: "Information unavailable",
};

export function SourceNote({ data, compact }: { data: SourceRef & Partial<Pick<Sourced<unknown>, "status" | "note">>; compact?: boolean }) {
  const status = data.status ?? "reported";
  return (
    <span className={clsx(styles.note, compact && styles.compact)}>
      <span className={clsx(styles.status, styles[status])}>{statusCopy[status]}</span>
      {!compact && (
        <>
          <span className={styles.sep} aria-hidden>·</span>
          <span>Confidence {data.confidence}</span>
          <span className={styles.sep} aria-hidden>·</span>
          <span>{data.last_verified ? `Verified ${data.last_verified}` : "Not yet verified by Meridian Guide"}</span>
        </>
      )}
      <span className={styles.sep} aria-hidden>·</span>
      <a href={data.source_url} target="_blank" rel="noreferrer" className={styles.link}>
        {data.source_name}
      </a>
      {data.note && !compact && <span className={styles.detail}>{data.note}</span>}
    </span>
  );
}

export function SourcedValue<T>({ data, format }: { data: Sourced<T>; format: (value: T) => string }) {
  if (data.value === null || data.status === "unavailable") {
    return <span className={styles.unavailable}>Information unavailable</span>;
  }
  return (
    <span className={styles.value}>
      {format(data.value)}
      {data.status === "needs_verification" && <span className={styles.flag}>Needs verification</span>}
    </span>
  );
}

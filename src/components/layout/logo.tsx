import styles from "./logo.module.css";
import { useT } from "@/lib/i18n/use-t";

export function Logo() {
  const t = useT();
  return (
    <span className={styles.logo}>
      <svg width="28" height="28" viewBox="0 0 26 26" aria-hidden className={styles.mark}>
        <circle cx="13" cy="13" r="11" className={styles.outer} />
        <circle cx="13" cy="13" r="4.5" className={styles.inner} />
      </svg>
      <span className={styles.textGroup}>
        <span className={styles.word}>{t("Meridian Guide")}</span>
        <span className={styles.sub}>{t("by Flaxyss")}</span>
      </span>
    </span>
  );
}

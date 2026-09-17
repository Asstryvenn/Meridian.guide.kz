import styles from "./logo.module.css";

export function Logo() {
  return (
    <span className={styles.logo}>
      <svg width="28" height="28" viewBox="0 0 26 26" aria-hidden className={styles.mark}>
        <circle cx="13" cy="13" r="11" className={styles.outer} />
        <circle cx="13" cy="13" r="4.5" className={styles.inner} />
      </svg>
      <span className={styles.textGroup}>
        <span className={styles.word}>Meridian Guide</span>
        <span className={styles.sub}>by Flaxyss</span>
      </span>
    </span>
  );
}

import styles from "./logo.module.css";

export function Logo() {
  return (
    <span className={styles.logo}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className={styles.mark}>
        <circle cx="13" cy="13" r="11" className={styles.outer} />
        <circle cx="13" cy="13" r="4.5" className={styles.inner} />
      </svg>
      <span className={styles.word}>locus</span>
    </span>
  );
}

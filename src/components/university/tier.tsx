import clsx from "clsx";
import type { Tier } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";
import styles from "./tier.module.css";

export function TierBadge({ tier }: { tier: Tier }) {
  const t = useT();
  return (
    <span className={clsx(styles.tier, styles[tier.toLowerCase()])}>
      <span className={styles.dot} aria-hidden />
      {t(tier)}
    </span>
  );
}

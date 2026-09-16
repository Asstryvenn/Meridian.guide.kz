import clsx from "clsx";
import type { Tier } from "@/lib/types";
import styles from "./tier.module.css";

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={clsx(styles.tier, styles[tier.toLowerCase()])}>
      <span className={styles.dot} aria-hidden />
      {tier}
    </span>
  );
}

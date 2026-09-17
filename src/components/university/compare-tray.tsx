"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getUniversity } from "@/lib/data/universities";
import { useApp } from "@/lib/store/app-store";
import styles from "./compare-tray.module.css";
import { useT } from "@/lib/i18n/use-t";

export function CompareTray() {
  const t = useT();
  const { compare, toggleCompare } = useApp();

  return (
    <AnimatePresence>
      {compare.length > 0 && (
        <motion.div
          className={`glass ${styles.tray}`}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <ul className={styles.items}>
            {compare.map((slug) => (
              <li key={slug} className={styles.item}>
                {getUniversity(slug)?.shortName}
                <button type="button" aria-label={t("Remove from comparison")} onClick={() => toggleCompare(slug)} className={styles.remove}>
                  <Icon name="close" size={12} />
                </button>
              </li>
            ))}
          </ul>
          <Button href="/compare" size="sm" className={compare.length < 2 ? styles.disabled : undefined}>
            {compare.length < 2 ? t("Pick one more") : t("Compare {count}", { count: compare.length })}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

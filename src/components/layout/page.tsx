"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import styles from "./page.module.css";

export const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};

export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div className={styles.page} variants={stagger} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  centered,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  centered?: boolean;
}) {
  if (centered) {
    return (
      <motion.header
        className="w-full flex flex-col items-center justify-center text-center mx-auto pt-2 gap-4"
        variants={rise}
      >
        <div className="flex flex-col items-center justify-center text-center mx-auto w-full max-w-2xl gap-2">
          {eyebrow && <p className="eyebrow text-center mx-auto">{eyebrow}</p>}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-center mx-auto w-full">{title}</h1>
          {description && <p className="text-base text-muted text-center mx-auto max-w-xl">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center justify-center gap-2.5 mx-auto">{actions}</div>}
      </motion.header>
    );
  }

  return (
    <motion.header className={styles.header} variants={rise}>
      <div className={styles.headerText}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </motion.header>
  );
}

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={rise} className={className}>
      {children}
    </motion.div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <motion.div variants={rise} className={`glass ${styles.empty}`}>
      <h2 className={styles.emptyTitle}>{title}</h2>
      <p className="muted">{body}</p>
      {action}
    </motion.div>
  );
}

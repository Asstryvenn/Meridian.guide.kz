import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import styles from "./card.module.css";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "article" | "div" | "aside";
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
  children: ReactNode;
}

export function Card({ as: Tag = "section", padding = "md", interactive, className, children, ...rest }: CardProps) {
  return (
    <Tag {...rest} className={clsx("glass", styles.card, styles[padding], interactive && styles.interactive, className)}>
      {children}
    </Tag>
  );
}

export function CardHeader({ eyebrow, title, action }: { eyebrow?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className={styles.title}>{title}</h2>
      </div>
      {action}
    </header>
  );
}

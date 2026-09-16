import Link from "next/link";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "quiet";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = BaseProps & { href: string; external?: boolean };

export function Button(props: ButtonProps | LinkProps) {
  if ("href" in props && props.href !== undefined) {
    const { variant = "primary", size = "md", block, children, className, href, external } = props;
    const classes = clsx(styles.button, styles[variant], styles[size], block && styles.block, className);
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant = "primary", size = "md", block, children, className, ...rest } = props as ButtonProps;
  return (
    <button {...rest} className={clsx(styles.button, styles[variant], styles[size], block && styles.block, className)}>
      {children}
    </button>
  );
}

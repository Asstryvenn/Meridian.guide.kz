"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { Icon, type IconName } from "@/components/ui/icon";
import { useApp } from "@/lib/store/app-store";
import { useNotifications } from "@/lib/store/derived";
import { Logo } from "./logo";
import styles from "./app-shell.module.css";

const nav: { href: string; label: string; icon: IconName; mobile?: boolean }[] = [
  { href: "/dashboard", label: "Home", icon: "home", mobile: true },
  { href: "/diagnostics", label: "Diagnostics", icon: "spark" },
  { href: "/matches", label: "Matches", icon: "target", mobile: true },
  { href: "/universities", label: "Explore", icon: "search", mobile: true },
  { href: "/compare", label: "Compare", icon: "compare" },
  { href: "/scholarships", label: "Scholarships", icon: "award" },
  { href: "/professors", label: "Professors", icon: "people" },
  { href: "/roadmap", label: "Roadmap", icon: "path", mobile: true },
  { href: "/applications", label: "Applications", icon: "folder" },
  { href: "/mentor", label: "Mentor", icon: "chat" },
];

function MoreSheet({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("scroll-locked");
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("scroll-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button type="button" aria-label="Close menu" className={styles.scrim} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="All sections"
            className={styles.sheet}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose();
            }}
          >
            <span className={styles.grabber} aria-hidden />
            <nav className={styles.sheetGrid} aria-label="All sections">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} className={clsx(styles.sheetItem, active && styles.sheetItemActive)} onClick={onClose}>
                    <Icon name={item.icon} size={22} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <button type="button" className={styles.sheetRow} onClick={toggle}>
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Notifications() {
  const notifications = useNotifications();
  const { dismissNotification } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className={styles.popoverAnchor} ref={ref}>
      <button type="button" className={styles.iconButton} aria-label={`Notifications (${notifications.length})`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name="bell" />
        {notifications.length > 0 && <span className={styles.dot} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={clsx("glass", styles.popover)}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <p className="eyebrow">Notifications</p>
            {notifications.length === 0 ? (
              <p className={styles.popoverEmpty}>You&apos;re all caught up. We only notify you about deadlines, score gaps and strong scholarship matches.</p>
            ) : (
              <ul className={styles.notificationList}>
                {notifications.map((n) => (
                  <li key={n.id} className={styles.notification}>
                    <span className={clsx(styles.kind, styles[`kind_${n.kind}`])} aria-hidden />
                    <Link href={n.href} className={styles.notificationBody} onClick={() => setOpen(false)}>
                      <span className={styles.notificationTitle}>{n.title}</span>
                      <span className={styles.notificationText}>{n.body}</span>
                    </Link>
                    <button type="button" className={styles.dismiss} aria-label="Dismiss" onClick={() => dismissNotification(n.id)}>
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserMenu() {
  const { user, profile, signOut } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initial = (profile.fullName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className={styles.popoverAnchor}>
      <button type="button" className={styles.avatar} aria-label="Account" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {initial}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={clsx("glass", styles.popover, styles.menu)}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <p className={styles.menuName}>{profile.fullName || "Student"}</p>
            <p className={styles.menuEmail}>{user?.email}</p>
            <p className={styles.menuMode}>{user?.mode === "supabase" ? "Synced to your account" : "Local demo mode — saved in this browser"}</p>
            <Link href="/onboarding?edit=1" className={styles.menuItem} onClick={() => setOpen(false)}>
              Edit profile
            </Link>
            <button
              type="button"
              className={styles.menuItem}
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
            >
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const moreActive = !nav.some((item) => item.mobile && (pathname === item.href || pathname.startsWith(`${item.href}/`)));

  return (
    <div className={styles.shell}>
      <aside className={clsx("glass", styles.sidebar)}>
        <Link href="/dashboard" className={styles.brand}>
          <Logo />
        </Link>
        <nav className={styles.nav} aria-label="Main">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={clsx(styles.navItem, active && styles.navActive)} aria-current={active ? "page" : undefined}>
                {active && <motion.span layoutId="nav-active" className={styles.navHighlight} transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                <Icon name={item.icon} size={18} className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <Link href="/dashboard" className={styles.mobileBrand}>
            <Logo />
          </Link>
          <div className={styles.topActions}>
            <button type="button" className={clsx(styles.iconButton, styles.themeToggle)} onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
            <Notifications />
            <UserMenu />
          </div>
        </header>
        <motion.main key={pathname} className={styles.content} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </motion.main>
      </div>

      <nav className={clsx("glass", styles.tabbar)} aria-label="Primary">
        {nav
          .filter((item) => item.mobile)
          .map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={clsx(styles.tab, active && styles.tabActive)} aria-current={active ? "page" : undefined}>
                <Icon name={item.icon} size={21} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        <button type="button" className={clsx(styles.tab, moreActive && !moreOpen && styles.tabActive, moreOpen && styles.tabActive)} onClick={() => setMoreOpen(true)} aria-expanded={moreOpen}>
          <Icon name="grid" size={21} />
          <span>More</span>
        </button>
      </nav>
      <MoreSheet open={moreOpen} onClose={closeMore} pathname={pathname} />
    </div>
  );
}

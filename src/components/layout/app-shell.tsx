"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { Icon, type IconName } from "@/components/ui/icon";
import { PomodoroTimer } from "@/components/ui/pomodoro-timer";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { useI18n } from "@/components/i18n/i18n-context";
import { useApp } from "@/lib/store/app-store";
import { useNotifications } from "@/lib/store/derived";
import { Logo } from "./logo";
import styles from "./app-shell.module.css";

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
  const { ecoMode, toggleEcoMode } = useApp();
  const { t } = useI18n();

  const nav: { href: string; label: string; icon: IconName; mobile?: boolean }[] = [
    { href: "/dashboard", label: t.nav.home, icon: "home", mobile: true },
    { href: "/matches", label: t.nav.matches, icon: "target", mobile: true },
    { href: "/roadmap", label: t.nav.roadmap, icon: "path", mobile: true },
    { href: "/calendar", label: t.nav.calendar, icon: "calendar", mobile: true },
    { href: "/interview", label: t.nav.interview, icon: "spark", mobile: true },
    { href: "/documents", label: t.nav.documents, icon: "folder" },
    { href: "/calculator", label: t.nav.calculator, icon: "award" },
    { href: "/universities", label: t.nav.explore, icon: "search" },
    { href: "/compare", label: t.nav.compare, icon: "compare" },
    { href: "/scholarships", label: t.nav.scholarships, icon: "award" },
    { href: "/professors", label: t.nav.professors, icon: "people" },
    { href: "/applications", label: t.nav.applications, icon: "folder" },
    { href: "/mentor", label: t.nav.mentor, icon: "chat", mobile: true },
  ];

  return (
    <div className={clsx(styles.shell, ecoMode && "eco-mode")}>
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
            <LanguageSelector />
            <button
              type="button"
              onClick={toggleEcoMode}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                ecoMode
                  ? "bg-[#589C80]/30 border-[#589C80] text-[#F5EED2]"
                  : "bg-[#132228]/40 border-[#589C80]/30 text-[#F5EED2]/70 hover:border-[#589C80] hover:text-[#F5EED2]"
              )}
              title="Toggle Calming Eco Mode"
            >
              <Leaf size={14} className={ecoMode ? "text-[#589C80]" : "text-[#F5EED2]/70"} />
              <span className="hidden sm:inline font-mono">{ecoMode ? t.nav.ecoModeOn : t.nav.ecoMode}</span>
            </button>
            <button type="button" className={styles.iconButton} onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
            <Notifications />
            <UserMenu />
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>

      <nav className={clsx("glass", styles.tabbar)} aria-label="Primary">
        {nav
          .filter((item) => item.mobile)
          .map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={clsx(styles.tab, active && styles.tabActive)}>
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <PomodoroTimer />
    </div>
  );
}

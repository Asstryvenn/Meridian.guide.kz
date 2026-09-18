"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { Icon, type IconName } from "@/components/ui/icon";
import { PomodoroProvider, PomodoroToolbarButton } from "@/components/ui/pomodoro-timer";
import { AiAssistantDrawer } from "@/components/mentor/ai-assistant-drawer";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { useI18n } from "@/components/i18n/i18n-context";
import { useApp } from "@/lib/store/app-store";
import { useNotifications } from "@/lib/store/derived";
import { Logo } from "./logo";
import styles from "./app-shell.module.css";
import { useT } from "@/lib/i18n/use-t";

type NavItem = { href: string; label: string; icon: IconName; mobile?: boolean };

function MoreSheet({ items, open, onClose, pathname }: { items: NavItem[]; open: boolean; onClose: () => void; pathname: string }) {
  const t = useT();
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
          <motion.button type="button" aria-label={t("Close menu")} className={styles.scrim} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("All sections")}
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
            <nav className={styles.sheetGrid} aria-label={t("All sections")}>
              {items.map((item) => {
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
              {theme === "dark" ? t("Light mode") : t("Dark mode")}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Notifications() {
  const t = useT();
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
      <button type="button" className={styles.iconButton} aria-label={t("Notifications ({count})", { count: notifications.length })} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
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
            <p className="eyebrow">{t("Notifications")}</p>
            {notifications.length === 0 ? (
              <p className={styles.popoverEmpty}>{t("You're all caught up. We only notify you about deadlines, score gaps and strong scholarship matches.")}</p>
            ) : (
              <ul className={styles.notificationList}>
                {notifications.map((n) => (
                  <li key={n.id} className={styles.notification}>
                    <span className={clsx(styles.kind, styles[`kind_${n.kind}`])} aria-hidden />
                    <Link href={n.href} className={styles.notificationBody} onClick={() => setOpen(false)}>
                      <span className={styles.notificationTitle}>{n.title}</span>
                      <span className={styles.notificationText}>{n.body}</span>
                    </Link>
                    <button type="button" className={styles.dismiss} aria-label={t("Dismiss")} onClick={() => dismissNotification(n.id)}>
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
  const t = useT();
  const { user, profile, signOut } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initial = (profile.fullName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className={styles.popoverAnchor}>
      <button type="button" className={styles.avatar} aria-label={t("Account")} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
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
            <p className={styles.menuName}>{profile.fullName || t("Student")}</p>
            <p className={styles.menuEmail}>{user?.email}</p>
            <p className={styles.menuMode}>{user?.mode === "supabase" ? t("Synced to your account") : t("Local demo mode — saved in this browser")}</p>
            <Link href="/onboarding?edit=1" className={styles.menuItem} onClick={() => setOpen(false)}>
              
              {t("Edit profile")}
            </Link>
            <button
              type="button"
              className={styles.menuItem}
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
            >
              
              {t("Sign out")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const tx = useT();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { ecoMode, toggleEcoMode } = useApp();
  const { t } = useI18n();

  const nav: NavItem[] = [
    { href: "/dashboard", label: t.nav.home, icon: "home", mobile: true },
    { href: "/matches", label: t.nav.matches, icon: "target", mobile: true },
    { href: "/roadmap", label: t.nav.roadmap, icon: "path", mobile: true },
    { href: "/mentor", label: t.nav.mentor, icon: "chat", mobile: true },
    { href: "/essays", label: t.nav.essays, icon: "fileText" },
    { href: "/diagnostics", label: t.nav.diagnostics, icon: "spark" },
    { href: "/calendar", label: t.nav.calendar, icon: "calendar" },
    { href: "/interview", label: t.nav.interview, icon: "spark" },
    { href: "/documents", label: t.nav.documents, icon: "folder" },
    { href: "/calculator", label: t.nav.calculator, icon: "award" },
    { href: "/universities", label: t.nav.explore, icon: "search" },
    { href: "/compare", label: t.nav.compare, icon: "compare" },
    { href: "/scholarships", label: t.nav.scholarships, icon: "award" },
    { href: "/professors", label: t.nav.professors, icon: "people" },
    { href: "/applications", label: t.nav.applications, icon: "folder" },
  ];
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const moreActive = !nav.some((item) => item.mobile && (pathname === item.href || pathname.startsWith(`${item.href}/`)));

  return (
    <PomodoroProvider>
      <div className={clsx(styles.shell, ecoMode && "eco-mode")}>
        <aside className={clsx("glass", styles.sidebar)}>
          <Link href="/dashboard" className={styles.brand}>
            <Logo />
          </Link>
          <nav className={styles.nav} aria-label={tx("Main")}>
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={clsx(styles.navItem, active && styles.navActive)} aria-current={active ? "page" : undefined} title={item.label}>
                  {active && <motion.span layoutId="nav-active" className={styles.navHighlight} transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                  <Icon name={item.icon} size={16} className={styles.navIcon} />
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
                  "group relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 cursor-pointer select-none",
                  ecoMode
                    ? "bg-[#589C80]/25 border-[#589C80]/60 text-ink shadow-[0_0_12px_rgba(88,156,128,0.25)]"
                    : "bg-panel/50 border-line text-ink/70 hover:border-[#589C80]/50 hover:text-ink hover:bg-panel",
                )}
                title={tx("Toggle Calming Eco Mode")}
              >
                <div
                  className={clsx(
                    "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300",
                    ecoMode ? "text-green-ink" : "text-ink/60 group-hover:text-ink"
                  )}
                >
                  <Leaf
                    size={13}
                    className={clsx(
                      "transition-all duration-300",
                      ecoMode ? "stroke-[#589C80] fill-[#589C80]/40 scale-110" : "stroke-current fill-transparent"
                    )}
                  />
                </div>
                <span className="hidden sm:inline font-mono text-[11px] tracking-tight">
                  {ecoMode ? t.nav.ecoModeOn : t.nav.ecoMode}
                </span>
                <span
                  className={clsx(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    ecoMode ? "bg-[#589C80] shadow-[0_0_6px_#589C80]" : "bg-ink/20"
                  )}
                />
              </button>
              <button type="button" className={clsx(styles.iconButton, styles.themeToggle)} onClick={toggle} aria-label={theme === "dark" ? tx("Switch to light mode") : tx("Switch to dark mode")}>
                <Icon name={theme === "dark" ? "sun" : "moon"} />
              </button>
              <PomodoroToolbarButton />
              <Notifications />
              <UserMenu />
            </div>
          </header>
          <motion.main key={pathname} className={styles.content} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
            {children}
          </motion.main>
        </div>

        <nav className={clsx("glass", styles.tabbar)} aria-label={tx("Primary")}>
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
            <span>{tx("More")}</span>
          </button>
        </nav>
        <MoreSheet items={nav} open={moreOpen} onClose={closeMore} pathname={pathname} />
        <AiAssistantDrawer />
      </div>
    </PomodoroProvider>
  );
}

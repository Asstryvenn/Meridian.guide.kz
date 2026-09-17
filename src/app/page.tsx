"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { rise, stagger } from "@/components/layout/page";
import { useTheme } from "@/components/theme/theme-provider";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProgressRing } from "@/components/ui/progress";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { universities } from "@/lib/data/universities";
import { useApp } from "@/lib/store/app-store";
import styles from "./landing.module.css";
import { useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

const steps = [
  { id: "diagnose", title: "Diagnose", body: "Eight short steps turn your grades, tests and activities into an honest picture of where you stand." },
  { id: "match", title: "Match", body: "Dream, Target and Safety universities ranked by fit, budget and an admission range — never fake precision." },
  { id: "act", title: "Act", body: "A level-by-level roadmap and a mentor that always tells you the one thing to do next." },
];

function LandingView() {
  const t = useT();
  const { user, onboarded, hydrated } = useApp();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasUser = mounted && hydrated && Boolean(user && typeof user === "object" && (user.id || user.email));
  const isOnboarded = Boolean(onboarded);

  useEffect(() => {
    if (mounted && hydrated && hasUser && router && typeof router.prefetch === "function") {
      try {
        router.prefetch(isOnboarded ? "/dashboard" : "/onboarding");
      } catch {}
    }
  }, [mounted, hydrated, hasUser, isOnboarded, router]);

  const primaryHref = hasUser ? (isOnboarded ? "/dashboard" : "/onboarding") : "/signup";

  return (
    <div className={styles.wrap}>
      <header className={styles.nav}>
        <Logo />
        <div className={styles.navActions}>
          <LanguageSelector />
          <button type="button" className={styles.themeButton} onClick={toggle} aria-label={t("Toggle theme")}>
            <Icon name={mounted ? (theme === "dark" ? "sun" : "moon") : "moon"} size={18} />
          </button>
          {mounted && hydrated ? (
            hasUser ? (
              <Button href={primaryHref} size="sm">
                {t("Open app")}
              </Button>
            ) : (
              <>
                <Button href="/login" variant="ghost" size="sm" className={styles.navLogin}>
                  {t("Log in")}
                </Button>
                <Button href="/signup" size="sm">
                  {t("Register")}
                </Button>
              </>
            )
          ) : (
            <div className="w-20 h-8 rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />
          )}
        </div>
      </header>

      <motion.main className={styles.hero} variants={stagger} initial="hidden" animate="show">
        <div className={styles.heroText}>
          <motion.p variants={rise} className="eyebrow">
            {t("University navigation for ambitious students")}
          </motion.p>
          <motion.h1 variants={rise} className={styles.headline}>
            {t("Find the universities")} <span className="display">{t("that fit you")}</span>
          </motion.h1>
          <motion.p variants={rise} className={styles.lede}>
            {t(
              "Meridian Guide reads your whole profile — grades, tests, activities, budget and goals — and turns it into a personal shortlist, transparent admission estimates, matched scholarships and a clear next step.",
            )}
          </motion.p>
          <motion.div variants={rise} className={styles.ctaRow}>
            {hasUser ? (
              <Button href={primaryHref} size="lg" className={styles.ctaPrimary}>
                {t("Continue your plan")}
                <Icon name="arrow" size={18} />
              </Button>
            ) : (
              <>
                <Button href="/signup" size="lg" className={styles.ctaPrimary}>
                  {t("Create free account")}
                  <Icon name="arrow" size={18} />
                </Button>
                <Button href="/login" variant="secondary" size="lg" className={styles.ctaSecondary}>
                  {t("Log in")}
                </Button>
              </>
            )}
          </motion.div>
          <motion.p variants={rise} className={styles.ctaNote}>
            {t("Free · about 6 minutes · Sign in with Google or email")}
          </motion.p>
        </div>

        <motion.div variants={rise} className={styles.preview} aria-hidden>
          <div className={`glass ${styles.previewCard} ${styles.previewMain}`}>
            <div className={styles.previewHeader}>
              <span className="eyebrow">{t("Example · next action")}</span>
              <DataTag kind="rules" label={t("Roadmap")} />
            </div>
            <p className={styles.previewAction}>{t("Raise English score to IELTS 7.5")}</p>
            <p className={styles.previewWhy}>{t("Unlocks 2 universities on your list · due in 41 days")}</p>
          </div>
          <motion.div className={`glass ${styles.previewCard} ${styles.previewRing}`} animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
            <ProgressRing value={0.64} size={84} label={t("Roadmap progress")}>
              <span className={styles.ringValue}>64%</span>
            </ProgressRing>
            <span className={styles.ringLabel}>{t("Level 3 · Portfolio")}</span>
          </motion.div>
          <motion.div className={`glass ${styles.previewCard} ${styles.previewMatch}`} animate={{ y: [0, 5, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
            <div className={styles.previewHeader}>
              <span className={styles.tierDot} />
              <span className={styles.tierLabel}>{t("Target")}</span>
              <DataTag kind="prediction" />
            </div>
            <p className={styles.previewUni}>{t("University of Toronto")}</p>
            <p className={styles.previewRange}>
              30–45%<span> {t("admission range · medium confidence")}</span>
            </p>
          </motion.div>
        </motion.div>
      </motion.main>

      <motion.section className={styles.metrics} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        {[
          [String(universities && Array.isArray(universities) ? universities.length : 0), t("universities with sourced data")],
          ["7", t("portfolio dimensions diagnosed")],
          ["3", t("tiers: Dream, Target, Safety")],
          ["1", t("clear next action, always")],
        ].map(([value, label]) => (
          <motion.div key={label} variants={rise} className={styles.metric}>
            <span className={styles.metricValue}>{value}</span>
            <span className={styles.metricLabel}>{label}</span>
          </motion.div>
        ))}
      </motion.section>

      <motion.section className={styles.steps} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        {steps.map((step, index) => (
          <motion.article key={step.id} variants={rise} className={`glass ${styles.step}`}>
            <span className={styles.stepIndex}>0{index + 1}</span>
            <h2 className={styles.stepTitle}>{t(step.title)}</h2>
            <p className="muted">{t(step.body)}</p>
          </motion.article>
        ))}
      </motion.section>

      <section className={styles.honesty}>
        <h2 className={styles.honestyTitle}>
          {t("Honest by design")}
          <span className="display">.</span>
        </h2>
        <div className={styles.honestyGrid}>
          <div>
            <DataTag kind="institutional" />
            <p className="muted">{t("Tuition, deadlines and requirements carry their source, confidence and verification status. Missing data says so.")}</p>
          </div>
          <div>
            <DataTag kind="prediction" />
            <p className="muted">{t("Admission chances are ranges from a transparent model, with the factors that pushed them up or down.")}</p>
          </div>
          <div>
            <DataTag kind="ai" />
            <p className="muted">{t("AI explanations are labelled as such and grounded in your computed profile — never invented statistics.")}</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <Logo />
        <span className="faint">{t("Meridian Guide · Built by team Flaxyss")}</span>
      </footer>
    </div>
  );
}

export default function Landing() {
  return (
    <ErrorBoundary>
      <LandingView />
    </ErrorBoundary>
  );
}

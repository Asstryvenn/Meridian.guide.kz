"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Meter } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { sampleProfile } from "@/lib/store/defaults";
import { useApp } from "@/lib/store/app-store";
import {
  AcademicStep,
  ActivitiesStep,
  BasicInfoStep,
  CareerStep,
  EnglishStep,
  FinancialStep,
  InterestsStep,
  PreferencesStep,
  type StepProps,
} from "./steps";
import { DocumentImport } from "./document-import";
import styles from "./onboarding-flow.module.css";
import { useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

const steps: { title: string; description: string; Component: ComponentType<StepProps> }[] = [
  { title: msg("About you"), description: msg("The basics that shape which systems and deadlines apply to you."), Component: BasicInfoStep },
  { title: msg("Academic profile"), description: msg("Grades and tests are the foundation of every admission estimate."), Component: AcademicStep },
  { title: msg("English proficiency"), description: msg("Most universities abroad set a minimum score."), Component: EnglishStep },
  { title: msg("Interests"), description: msg("What you want to study decides which programs we consider."), Component: InterestsStep },
  { title: msg("Extracurriculars"), description: msg("Depth, reach and evidence matter more than a long list."), Component: ActivitiesStep },
  { title: msg("Finances"), description: msg("We only recommend options you can realistically pay for — or get funded for."), Component: FinancialStep },
  { title: msg("Preferences"), description: msg("Where and how you want to live for the next four years."), Component: PreferencesStep },
  { title: msg("Career goals"), description: msg("Your long-term plans shift how much research environment matters."), Component: CareerStep },
];

export function OnboardingFlow() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const editing = params.get("edit") === "1";
  const { hydrated, user, profile, updateProfile, replaceProfile, completeOnboarding, markTask } = useApp();
  const { notify } = useToast();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydrated && !user) router.replace("/signup");
  }, [hydrated, user, router]);

  const step = steps[index];
  const last = index === steps.length - 1;

  function go(delta: number) {
    setDirection(delta);
    setIndex((i) => Math.min(steps.length - 1, Math.max(0, i + delta)));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function finish() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    const error = await completeOnboarding();
    if (error) {
      setSaving(false);
      setSaveError(t("We couldn't save your profile: {error}. Your answers are kept on this device — try again.", { error: error }));
      return;
    }
    markTask("foundation-profile");
    notify({ tone: "success", title: editing ? t("Profile saved") : t("Profile complete"), body: editing ? undefined : t("+20 XP · Your diagnostics are ready") });
    router.push(editing ? "/dashboard" : "/diagnostics");
  }

  if (!hydrated || !user) return null;

  return (
    <div className={styles.wrap} ref={topRef}>
      <header className={styles.top}>
        <Link href="/">
          <Logo />
        </Link>
        <div className={styles.topActions}>
          {!editing && (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                replaceProfile(sampleProfile);
                setDirection(1);
                setIndex(steps.length - 1);
              }}
            >
              
              {t("Fill with sample profile")}
            </Button>
          )}
          {editing && (
            <Button variant="secondary" size="sm" onClick={finish} disabled={saving}>
              {saving ? t("Saving…") : t("Save and close")}
            </Button>
          )}
        </div>
      </header>

      <div className={styles.progress}>
        <div className={styles.progressMeta}>
          <span className="tabular">
            {t("Step {index} of {count}", { index: index + 1, count: steps.length })}
          </span>
          <span>{t(step.title)}</span>
        </div>
        <Meter value={((index + 1) / steps.length) * 100} tone="amber" label={t("Onboarding progress: step {index} of {count}", { index: index + 1, count: steps.length })} />
        <ol className={styles.dots}>
          {steps.map((s, i) => (
            <li key={s.title}>
              <button type="button" className={styles.dotButton} aria-label={t("Go to {title}", { title: t(s.title) })} aria-current={i === index ? "step" : undefined} data-state={i < index ? "done" : i === index ? "current" : "todo"} onClick={() => go(i - index)} />
            </li>
          ))}
        </ol>
      </div>

      <main className={`glass ${styles.card}`}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -28 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={styles.step}
          >
            <header className={styles.stepHeader}>
              <h1 className={styles.title}>{t(step.title)}</h1>
              <p className="muted">{t(step.description)}</p>
            </header>
            {index === 1 && <DocumentImport profile={profile} onApply={replaceProfile} />}
            <step.Component profile={profile} update={updateProfile} />
          </motion.section>
        </AnimatePresence>
      </main>

      {saveError && (
        <p className={styles.saveError} role="alert">
          {saveError}
        </p>
      )}

      <footer className={styles.footer}>
        <Button variant="quiet" className={styles.back} onClick={() => go(-1)} disabled={index === 0 || saving}>
          
          {t("Back")}
        </Button>
        <div className={styles.footerRight}>
          {!last && (
            <Button variant="quiet" className={styles.skip} onClick={() => go(1)}>
              
              {t("Skip")}
            </Button>
          )}
          <Button className={styles.primary} onClick={last ? finish : () => go(1)} size="lg" disabled={saving}>
            {last ? (saving ? t("Saving…") : editing ? t("Save changes") : t("Finish")) : t("Continue")}
            {!saving && <Icon name={last ? "check" : "arrow"} size={18} />}
          </Button>
        </div>
      </footer>
    </div>
  );
}

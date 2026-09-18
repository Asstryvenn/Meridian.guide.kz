"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProgressRing } from "@/components/ui/progress";
import type { Recommendation } from "@/lib/engine/matching";
import { useApp } from "@/lib/store/app-store";
import { PredictionRange } from "./prediction-panel";
import { TierBadge } from "./tier";
import styles from "./recommendation-card.module.css";
import { useT } from "@/lib/i18n/use-t";

const financialTone = { "Within budget": "green", Stretch: "amber", "Needs aid": "danger", "Needs verification": "neutral" } as const;

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const t = useT();
  const { university, tier, matchScore, prediction, financial, reasons, mainGap } = recommendation;
  const { applications, addApplication, compare, toggleCompare } = useApp();
  const tracked = applications.some((a) => a.universitySlug === university.slug);
  const comparing = compare.includes(university.slug);

  const globalRank = university.ranking?.global ?? university.globalRanking;
  const nationalRank = university.ranking?.national ?? university.nationalRanking;
  const rankLabel = globalRank ? `#${globalRank} Global` : nationalRank ? `#${nationalRank} National` : null;

  return (
    <article className={`glass ${styles.card}`}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.badgeRow}>
            <TierBadge tier={tier} />
            {rankLabel && <span className={styles.rankBadge}>{rankLabel}</span>}
          </div>
          <Link href={`/universities/${university.slug}`} className={styles.name}>
            {university.name}
          </Link>
          <p className={styles.place}>
            {t(university.city)} · {t(university.country)}
          </p>
        </div>
        <ProgressRing value={matchScore / 100} size={64} stroke={6} tone="green" label={t("Match score {matchScore}", { matchScore: matchScore })}>
          <span className={styles.score}>{matchScore}</span>
        </ProgressRing>
      </header>

      <div className={styles.metrics}>
        <div>
          <p className={styles.metricLabel}>{t("Admission estimate")}</p>
          <PredictionRange prediction={prediction} />
        </div>
        <div>
          <p className={styles.metricLabel}>{t("Financial fit")}</p>
          <Badge tone={financialTone[financial.label]}>{financial.label}</Badge>
        </div>
      </div>

      {university.popularMajors && university.popularMajors.length > 0 && (
        <div className={styles.majorsList}>
          {university.popularMajors.slice(0, 3).map((major) => (
            <span key={major} className={styles.majorChip}>
              {major}
            </span>
          ))}
        </div>
      )}

      <div className={styles.explain}>
        <div>
          <p className={styles.explainTitle}>{t("Why it fits")}</p>
          <ul className={styles.reasons}>
            {reasons.length ? reasons.map((r) => <li key={r}>{r}</li>) : <li>{t("Offers programs close to your interests")}</li>}
          </ul>
        </div>
        <div>
          <p className={styles.explainTitle}>{t("Main gap")}</p>
          <p className={styles.gap}>{mainGap}</p>
        </div>
      </div>

      <footer className={styles.actions}>
        <Button size="sm" variant={tracked ? "secondary" : "primary"} onClick={() => addApplication(university.slug)} disabled={tracked}>
          {tracked ? (
            <>
              <Icon name="check" size={14} /> {t("Tracking")}
            </>
          ) : (
            <>
              <Icon name="plus" size={14} /> {t("Add to applications")}
            </>
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => toggleCompare(university.slug)} aria-pressed={comparing}>
          {comparing ? t("Comparing") : t("Compare")}
        </Button>
        <Button size="sm" variant="quiet" href={`/universities/${university.slug}`}>
          {t("Details")}
        </Button>
      </footer>
    </article>
  );
}

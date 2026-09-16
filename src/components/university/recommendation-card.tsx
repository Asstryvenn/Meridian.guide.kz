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

const financialTone = { "Within budget": "green", Stretch: "amber", "Needs aid": "danger", "Needs verification": "neutral" } as const;

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const { university, tier, matchScore, prediction, financial, reasons, mainGap } = recommendation;
  const { applications, addApplication, compare, toggleCompare } = useApp();
  const tracked = applications.some((a) => a.universitySlug === university.slug);
  const comparing = compare.includes(university.slug);

  return (
    <article className={`glass ${styles.card}`}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <TierBadge tier={tier} />
          <Link href={`/universities/${university.slug}`} className={styles.name}>
            {university.name}
          </Link>
          <p className={styles.place}>
            {university.city} · {university.country}
          </p>
        </div>
        <ProgressRing value={matchScore / 100} size={64} stroke={6} tone="green" label={`Match score ${matchScore}`}>
          <span className={styles.score}>{matchScore}</span>
        </ProgressRing>
      </header>

      <div className={styles.metrics}>
        <div>
          <p className={styles.metricLabel}>Admission estimate</p>
          <PredictionRange prediction={prediction} />
        </div>
        <div>
          <p className={styles.metricLabel}>Financial fit</p>
          <Badge tone={financialTone[financial.label]}>{financial.label}</Badge>
        </div>
      </div>

      <div className={styles.explain}>
        <div>
          <p className={styles.explainTitle}>Why it fits</p>
          <ul className={styles.reasons}>
            {reasons.length ? reasons.map((r) => <li key={r}>{r}</li>) : <li>Offers programs close to your interests</li>}
          </ul>
        </div>
        <div>
          <p className={styles.explainTitle}>Main gap</p>
          <p className={styles.gap}>{mainGap}</p>
        </div>
      </div>

      <footer className={styles.actions}>
        <Button size="sm" variant={tracked ? "secondary" : "primary"} onClick={() => addApplication(university.slug)} disabled={tracked}>
          {tracked ? (
            <>
              <Icon name="check" size={14} /> Tracking
            </>
          ) : (
            <>
              <Icon name="plus" size={14} /> Add to applications
            </>
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => toggleCompare(university.slug)} aria-pressed={comparing}>
          {comparing ? "Comparing" : "Compare"}
        </Button>
        <Button size="sm" variant="quiet" href={`/universities/${university.slug}`}>
          Details
        </Button>
      </footer>
    </article>
  );
}

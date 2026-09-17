"use client";

import Link from "next/link";
import { EmptyState, Page, PageHeader, Reveal } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/progress";
import { TierBadge } from "@/components/university/tier";
import { getUniversity } from "@/lib/data/universities";
import { applicationProgress, statusLabel } from "@/lib/engine/applications";
import { formatDate, upcomingDeadlines } from "@/lib/engine/deadlines";
import { useApp } from "@/lib/store/app-store";
import { useRecommendations } from "@/lib/store/derived";
import type { Tier } from "@/lib/types";
import styles from "./applications.module.css";
import { useT } from "@/lib/i18n/use-t";

export default function ApplicationsPage() {
  const t = useT();
  const { applications } = useApp();
  const { list } = useRecommendations();
  const tiers = new Map(list.map((r) => [r.university.slug, r.tier]));
  const counts = applications.reduce<Record<Tier, number>>(
    (acc, a) => {
      const tier = tiers.get(a.universitySlug);
      if (tier) acc[tier] += 1;
      return acc;
    },
    { Dream: 0, Target: 0, Safety: 0 },
  );

  const sorted = [...applications].sort((a, b) => {
    const ua = getUniversity(a.universitySlug);
    const ub = getUniversity(b.universitySlug);
    return (upcomingDeadlines(ua?.deadlines ?? [])[0]?.days ?? 999) - (upcomingDeadlines(ub?.deadlines ?? [])[0]?.days ?? 999);
  });

  return (
    <Page>
      <PageHeader
        eyebrow={t("Application tracker")}
        title={t("Your applications")}
        description={t("One workspace per university for requirements, documents, essays, scholarships and deadlines.")}
        actions={
          <Button variant="secondary" href="/matches">
            
            {t("Add from matches")}
          </Button>
        }
      />

      {applications.length > 0 && (
        <Reveal className={styles.balance}>
          {(Object.keys(counts) as Tier[]).map((tier) => (
            <div key={tier} className={`glass ${styles.balanceItem}`}>
              <TierBadge tier={tier} />
              <span className={styles.balanceCount}>{counts[tier]}</span>
            </div>
          ))}
          {(counts.Dream === 0 || counts.Target === 0 || counts.Safety === 0) && <p className={styles.balanceHint}>{t("A balanced list has at least one university in each tier.")}</p>}
        </Reveal>
      )}

      {applications.length === 0 ? (
        <EmptyState title={t("No applications yet")} body={t("Add universities from your matches or the catalog. Each one gets its own workspace.")} action={<Button href="/matches">{t("See my matches")}</Button>} />
      ) : (
        <ul className={styles.list}>
          {sorted.map((application) => {
            const university = getUniversity(application.universitySlug);
            if (!university) return null;
            const next = upcomingDeadlines(university.deadlines)[0];
            const progress = applicationProgress(application);
            const tier = tiers.get(university.slug);
            return (
              <Reveal key={university.slug}>
                <Link href={`/applications/${university.slug}`} className={`glass ${styles.row}`}>
                  <div className={styles.main}>
                    <span className={styles.name}>{university.name}</span>
                    <span className={styles.meta}>
                      {tier && <TierBadge tier={tier} />}
                      <Badge tone={application.status === "submitted" ? "green" : "neutral"}>{statusLabel[application.status]}</Badge>
                    </span>
                  </div>
                  <div className={styles.progress}>
                    <span className="faint tabular">{t("{percent}% of checklist", { percent: Math.round(progress * 100) })}</span>
                    <Meter value={progress * 100} tone="green" label={t("{round}% of checklist complete", { round: Math.round(progress * 100) })} />
                  </div>
                  <div className={styles.deadline}>
                    {next ? (
                      <>
                        <span className="tabular">{formatDate(next.date)}</span>
                        <span className="faint">
                          {t(next.deadline.label)} · {t("{days} days", { days: next.days })}
                        </span>
                      </>
                    ) : (
                      <span className="faint">{t("Deadline unavailable")}</span>
                    )}
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      )}
    </Page>
  );
}

"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { Badge, DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Meter, ProgressRing } from "@/components/ui/progress";
import { Radar } from "@/components/ui/radar";
import { useApp } from "@/lib/store/app-store";
import { useDiagnostics } from "@/lib/store/derived";
import { AdmissionSimulator } from "@/components/diagnostics/admission-simulator";
import { PortfolioDeepScan } from "@/components/diagnostics/portfolio-deep-scan";
import styles from "./diagnostics.module.css";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

const bandTone = { Exceptional: "green", Strong: "green", Competitive: "amber", Developing: "danger", "Not enough data": "neutral" } as const;

const shortLabels: Record<string, string> = {
  academic: msg("Academics"),
  tests: msg("Tests"),
  english: msg("English"),
  extracurriculars: msg("Activities"),
  research: msg("Research"),
  leadership: msg("Leadership"),
  international: msg("International"),
};

export default function DiagnosticsPage() {
  const t = useT();
  const locale = useLocale();
  const { profile, applications, markTask } = useApp();
  const diagnostics = useDiagnostics();
  const [narrative, setNarrative] = useState<{ text: string | null; loading: boolean }>({ text: null, loading: true });

  useEffect(() => {
    markTask("foundation-diagnostics");
  }, [markTask]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, applications, completedTasks: [], locale }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: { narrative: string | null }) => setNarrative({ text: data.narrative, loading: false }))
      .catch(() => setNarrative((prev) => (controller.signal.aborted ? prev : { text: null, loading: false })));
    return () => controller.abort();
  }, [profile, applications, locale]);

  return (
    <Page>
      <PageHeader
        eyebrow={t("Portfolio diagnostics")}
        title={t("Where you stand today")}
        description={t("Seven signals admissions officers read, scored from the profile you entered. Scores are relative guides, not official ratings.")}
        actions={
          <Button variant="secondary" href="/onboarding?edit=1">
            {t("Update profile")}
          </Button>
        }
      />

      <Reveal>
        <PortfolioDeepScan />
      </Reveal>

      <div className={styles.overview}>
        <Reveal>
          <Card className={styles.overall}>
            <ProgressRing value={diagnostics.overall / 100} size={148} stroke={12} tone="green" label={t("Overall profile strength {overall}", { overall: diagnostics.overall })}>
              <span className={styles.overallValue}>{diagnostics.overall}</span>
              <span className={styles.overallCaption}>{t("of 100")}</span>
            </ProgressRing>
            <div className={styles.overallText}>
              <p className="eyebrow">{t("Overall strength")}</p>
              <p className={styles.summary}>{diagnostics.summary}</p>
              <div className={styles.completeness}>
                <span className="faint">{t("Profile completeness {percent}%", { percent: Math.round(diagnostics.completeness * 100) })}</span>
                <Meter value={diagnostics.completeness * 100} tone="amber" label={t("Profile completeness")} />
              </div>
            </div>
          </Card>
        </Reveal>
        <Reveal>
          <Card className={styles.radarCard}>
            <Radar axes={diagnostics.dimensions.map((d) => ({ label: shortLabels[d.key], value: d.score }))} />
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card className={styles.narrative}>
          <DataTag kind={narrative.text ? "ai" : "rules"} label={narrative.text ? t("AI explanation") : t("Rule-based summary")} />
          {narrative.loading ? (
            <div className={styles.shimmer} aria-label={t("Generating explanation")} />
          ) : (
            <p className={styles.narrativeText}>
              {narrative.text ?? `${diagnostics.summary}${diagnostics.weakest ? t(" Best next move: {improvement}", { improvement: diagnostics.weakest.improvement }) : ""}`}
            </p>
          )}
        </Card>
      </Reveal>

      <Reveal>
        <AdmissionSimulator />
      </Reveal>

      <div className={styles.dimensions}>
        {diagnostics.dimensions.map((d) => (
          <Reveal key={d.key}>
            <Card className={clsx(styles.dimension, diagnostics.weakest?.key === d.key && styles.focus)}>
              <header className={styles.dimensionHead}>
                <h2 className={styles.dimensionTitle}>{d.label}</h2>
                <Badge tone={bandTone[d.band]}>{d.band}</Badge>
              </header>
              <div className={styles.scoreRow}>
                <span className={clsx(styles.score, "tabular")}>{d.score ?? "—"}</span>
                <Meter value={d.score} tone={d.score !== null && d.score >= 70 ? "green" : "amber"} label={`${d.label} score`} />
              </div>
              <p className={styles.explanation}>{d.explanation}</p>
              <p className={styles.improve}>
                <span>{t("Improve")}</span>
                {d.improvement}
              </p>
              {diagnostics.weakest?.key === d.key && <span className={styles.focusTag}>{t("Biggest opportunity")}</span>}
            </Card>
          </Reveal>
        ))}
      </div>
    </Page>
  );
}

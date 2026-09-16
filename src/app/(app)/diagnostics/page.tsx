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
import styles from "./diagnostics.module.css";

const bandTone = { Exceptional: "green", Strong: "green", Competitive: "amber", Developing: "danger", "Not enough data": "neutral" } as const;

const shortLabels: Record<string, string> = {
  academic: "Academics",
  tests: "Tests",
  english: "English",
  extracurriculars: "Activities",
  research: "Research",
  leadership: "Leadership",
  international: "International",
};

export default function DiagnosticsPage() {
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
      body: JSON.stringify({ profile, applications, completedTasks: [] }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: { narrative: string | null }) => setNarrative({ text: data.narrative, loading: false }))
      .catch(() => setNarrative((prev) => (controller.signal.aborted ? prev : { text: null, loading: false })));
    return () => controller.abort();
  }, [profile, applications]);

  return (
    <Page>
      <PageHeader
        eyebrow="Portfolio diagnostics"
        title="Where you stand today"
        description="Seven signals admissions officers read, scored from the profile you entered. Scores are relative guides, not official ratings."
        actions={
          <Button variant="secondary" href="/onboarding?edit=1">
            Update profile
          </Button>
        }
      />

      <div className={styles.overview}>
        <Reveal>
          <Card className={styles.overall}>
            <ProgressRing value={diagnostics.overall / 100} size={148} stroke={12} tone="green" label={`Overall profile strength ${diagnostics.overall}`}>
              <span className={styles.overallValue}>{diagnostics.overall}</span>
              <span className={styles.overallCaption}>of 100</span>
            </ProgressRing>
            <div className={styles.overallText}>
              <p className="eyebrow">Overall strength</p>
              <p className={styles.summary}>{diagnostics.summary}</p>
              <div className={styles.completeness}>
                <span className="faint">Profile completeness {Math.round(diagnostics.completeness * 100)}%</span>
                <Meter value={diagnostics.completeness * 100} tone="amber" label="Profile completeness" />
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
          <DataTag kind={narrative.text ? "ai" : "rules"} label={narrative.text ? "AI explanation · Claude" : "Rule-based summary"} />
          {narrative.loading ? (
            <div className={styles.shimmer} aria-label="Generating explanation" />
          ) : (
            <p className={styles.narrativeText}>
              {narrative.text ?? `${diagnostics.summary}${diagnostics.weakest ? ` Best next move: ${diagnostics.weakest.improvement}` : ""}`}
            </p>
          )}
        </Card>
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
                <span>Improve</span>
                {d.improvement}
              </p>
              {diagnostics.weakest?.key === d.key && <span className={styles.focusTag}>Biggest opportunity</span>}
            </Card>
          </Reveal>
        ))}
      </div>
    </Page>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EmptyState, Page, PageHeader, Reveal } from "@/components/layout/page";
import { Badge, DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChipGroup } from "@/components/ui/fields";
import { Meter } from "@/components/ui/progress";
import { SourcedValue } from "@/components/ui/source-note";
import { PredictionRange } from "@/components/university/prediction-panel";
import { TierBadge } from "@/components/university/tier";
import { professors } from "@/lib/data/professors";
import { universities } from "@/lib/data/universities";
import { formatDate, upcomingDeadlines } from "@/lib/engine/deadlines";
import { recommend, type Recommendation } from "@/lib/engine/matching";
import { compareVerdict } from "@/lib/engine/verdict";
import { useApp } from "@/lib/store/app-store";
import type { ReactNode } from "react";
import styles from "./compare.module.css";
import { useT } from "@/lib/i18n/use-t";
import { msg, tr } from "@/lib/i18n/catalog";

const usd = (v: number) => `$${Math.round(v / 1000)}k`;
const aidCopy = { full_need: msg("Full need met"), limited: msg("Limited"), none: msg("None") };

const rows: { label: string; render: (r: Recommendation) => ReactNode }[] = [
  { label: msg("Tier"), render: (r) => <TierBadge tier={r.tier} /> },
  { label: msg("Match score"), render: (r) => <span className="tabular">{r.matchScore}</span> },
  { label: msg("Admission estimate"), render: (r) => <PredictionRange prediction={r.prediction} /> },
  {
    label: msg("Acceptance rate"),
    render: (r) => <SourcedValue data={r.university.acceptanceRate} format={(v) => `${Math.round(v * 1000) / 10}%`} />,
  },
  { label: msg("Tuition / year"), render: (r) => <SourcedValue data={r.university.intlTuitionUsd} format={([a, b]) => `${usd(a)}–${usd(b)}`} /> },
  { label: msg("Living cost / year"), render: (r) => <SourcedValue data={r.university.livingCostUsd} format={usd} /> },
  { label: msg("Financial fit"), render: (r) => <Badge tone={r.financial.label === "Within budget" ? "green" : r.financial.label === "Needs verification" ? "neutral" : "amber"}>{r.financial.label}</Badge> },
  { label: msg("Need-based aid"), render: (r) => <SourcedValue data={r.university.needBasedAidIntl} format={(v) => tr(aidCopy[v])} /> },
  { label: msg("Scholarships in catalog"), render: (r) => <span className="tabular">{r.university.scholarshipIds.length}</span> },
  {
    label: msg("Research strength"),
    render: (r) => (
      <span className={styles.meterCell}>
        <Meter value={r.university.researchStrength * 20} tone="green" label={tr("Research strength {score} of 5", { score: r.university.researchStrength })} />
        <span className="faint tabular">{tr("{score}/5 · {count} profiled faculty", { score: r.university.researchStrength, count: professors.filter((p) => p.universitySlug === r.university.slug).length })}</span>
      </span>
    ),
  },
  { label: msg("Minimum IELTS"), render: (r) => <SourcedValue data={r.university.requirements.minIelts} format={(v) => v.toFixed(1)} /> },
  {
    label: msg("Next deadline"),
    render: (r) => {
      const next = upcomingDeadlines(r.university.deadlines)[0];
      return next ? (
        <span className={styles.stack}>
          {formatDate(next.date)}
          <span className="faint">
            {tr(next.deadline.label)}
            {next.deadline.status === "needs_verification" ? msg(" · verify") : msg("")}
          </span>
        </span>
      ) : (
        msg("Information unavailable")
      );
    },
  },
  { label: msg("Main gap"), render: (r) => <span className="muted">{r.mainGap}</span> },
];

export default function ComparePage() {
  const t = useT();
  const { profile, compare, setCompare, addApplication, applications } = useApp();
  const items = useMemo(() => {
    const pool = universities.filter((u) => compare.includes(u.slug));
    const scored = recommend(profile, pool, true);
    return compare.map((slug) => scored.find((r) => r.university.slug === slug)).filter((r) => r !== undefined);
  }, [compare, profile]);
  const verdict = compareVerdict(items);

  return (
    <Page>
      <PageHeader eyebrow={t("University comparison")} title={t("Side by side")} description={t("Pick two or three universities. Institutional data, model estimates and the verdict are labelled separately.")} />

      <Reveal>
        <Card>
          <ChipGroup label={t("Universities to compare (up to 3)")} options={universities.map((u) => ({ value: u.slug, label: u.shortName }))} selected={compare} onChange={(slugs) => setCompare(slugs.slice(-3))} />
        </Card>
      </Reveal>

      {items.length < 2 ? (
        <EmptyState title={t("Choose at least two universities")} body={t("Select from the list above, or tap Compare on any match.")} action={<Button href="/matches">{t("Go to matches")}</Button>} />
      ) : (
        <>
          {verdict && (
            <Reveal>
              <Card className={styles.verdict}>
                <DataTag kind="rules" label={t("Verdict · rule-based from your data")} />
                <h2 className={styles.verdictTitle}>{verdict.headline}</h2>
                <ul className={styles.points}>
                  {verdict.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <Button variant="secondary" size="sm" href={`/mentor?ask=${encodeURIComponent(`Compare ${items.map((i) => i.university.name).join(" vs ")} for me.`)}`}>
                  
                  {t("Ask the AI mentor for a deeper comparison")}
                </Button>
              </Card>
            </Reveal>
          )}

          <Reveal>
            <div className={`glass ${styles.tableWrap}`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col" className={styles.corner} />
                    {items.map((r) => (
                      <th key={r.university.slug} scope="col">
                        <Link href={`/universities/${r.university.slug}`} className={styles.uniName}>
                          {r.university.name}
                        </Link>
                        <span className="faint">{tr(r.university.country)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {items.map((r) => (
                        <td key={r.university.slug}>{row.render(r)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" />
                    {items.map((r) => {
                      const tracked = applications.some((a) => a.universitySlug === r.university.slug);
                      return (
                        <td key={r.university.slug}>
                          <Button size="sm" onClick={() => addApplication(r.university.slug)} disabled={tracked}>
                            {tracked ? t("Tracking") : t("Add to applications")}
                          </Button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>
        </>
      )}
    </Page>
  );
}

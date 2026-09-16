"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { Badge, DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/fields";
import { ProgressRing } from "@/components/ui/progress";
import { SourceNote, SourcedValue } from "@/components/ui/source-note";
import { getUniversity } from "@/lib/data/universities";
import { nextOccurrence, formatDate } from "@/lib/engine/deadlines";
import { matchScholarships } from "@/lib/engine/discovery";
import { useApp } from "@/lib/store/app-store";
import type { Scholarship } from "@/lib/types";
import styles from "./scholarships.module.css";

type KindFilter = "all" | Scholarship["kind"];

export default function ScholarshipsPage() {
  const { profile, applications, updateApplication, addApplication } = useApp();
  const [kind, setKind] = useState<KindFilter>("all");
  const matches = useMemo(() => matchScholarships(profile, applications.map((a) => a.universitySlug)), [profile, applications]);
  const shown = matches.filter((m) => kind === "all" || m.scholarship.kind === kind);

  function track(scholarship: Scholarship) {
    const target = scholarship.universities === "any" ? null : scholarship.universities[0];
    const application = target ? applications.find((a) => a.universitySlug === target) : applications[0];
    if (!application) {
      if (target) addApplication(target);
      return;
    }
    if (!application.scholarshipIds.includes(scholarship.id)) {
      updateApplication(application.universitySlug, { scholarshipIds: [...application.scholarshipIds, scholarship.id] });
    }
  }

  const tracked = new Set(applications.flatMap((a) => a.scholarshipIds));

  return (
    <Page>
      <PageHeader eyebrow="Scholarship discovery" title="Funding you could qualify for" description="Eligibility shows the share of published criteria your profile meets. It is not a probability of winning." />

      <Reveal className={styles.controls}>
        <Segmented
          label="Provider"
          value={kind}
          onChange={setKind}
          options={[
            { value: "all", label: "All" },
            { value: "university", label: "University" },
            { value: "government", label: "Government" },
            { value: "private", label: "Private" },
          ]}
        />
      </Reveal>

      <div className={styles.list}>
        {shown.map(({ scholarship: s, eligibility, met, unmet, unknown }) => {
          const isTracked = tracked.has(s.id);
          return (
            <Reveal key={s.id}>
              <article className={clsx("glass", styles.card, eligibility < 30 && styles.dim)}>
                <div className={styles.ring}>
                  <ProgressRing value={eligibility / 100} size={84} stroke={8} tone={eligibility >= 70 ? "green" : "amber"} label={`${eligibility}% of criteria met`}>
                    <span className={styles.pct}>{eligibility}%</span>
                  </ProgressRing>
                  <span className="faint">eligible</span>
                </div>
                <div className={styles.body}>
                  <div className={styles.titleRow}>
                    <h2 className={styles.name}>{s.name}</h2>
                    <div className={styles.badges}>
                      <Badge tone="outline">{s.kind}</Badge>
                      <Badge tone="neutral">{s.basis.replace(/_/g, " ")}</Badge>
                      <Badge tone={s.level === "graduate" ? "amber" : "green"}>{s.level}</Badge>
                    </div>
                  </div>
                  <p className="muted">
                    {s.provider} · {s.coverage}
                  </p>
                  <div className={styles.meta}>
                    <span>
                      Amount: <SourcedValue data={s.amountUsd} format={(v) => `≈ $${v.toLocaleString("en-US")}`} />
                    </span>
                    <span>
                      Deadline: {s.deadline ? `${formatDate(nextOccurrence(s.deadline))}${s.deadline.status === "needs_verification" ? " (needs verification)" : ""}` : "Varies — see source"}
                    </span>
                    {s.universities !== "any" && <span>For: {s.universities.map((slug) => getUniversity(slug)?.shortName ?? slug).join(", ")}</span>}
                  </div>
                  <ul className={styles.criteria}>
                    {met.map((c) => (
                      <li key={c} className={styles.met}>
                        {c}
                      </li>
                    ))}
                    {unmet.map((c) => (
                      <li key={c} className={styles.unmet}>
                        {c}
                      </li>
                    ))}
                    {unknown.map((c) => (
                      <li key={c} className={styles.unknown}>
                        {c}
                      </li>
                    ))}
                  </ul>
                  <p className={styles.notes}>{s.notes}</p>
                  <div className={styles.footer}>
                    <SourceNote data={s.source} />
                    <div className={styles.actions}>
                      <DataTag kind="institutional" />
                      <Button size="sm" variant={isTracked ? "secondary" : "primary"} disabled={isTracked || s.level === "graduate"} onClick={() => track(s)}>
                        {isTracked ? "In your roadmap" : s.level === "graduate" ? "Plan for later" : "Add to roadmap"}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Page>
  );
}

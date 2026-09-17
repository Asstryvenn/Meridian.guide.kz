"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo } from "react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { Badge, DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ProgressRing } from "@/components/ui/progress";
import { SourcedValue, SourceNote } from "@/components/ui/source-note";
import { PredictionPanel } from "@/components/university/prediction-panel";
import { TrueCostCalculator } from "@/components/university/true-cost-calculator";
import { TierBadge } from "@/components/university/tier";
import { professors } from "@/lib/data/professors";
import { getScholarship } from "@/lib/data/scholarships";
import { getUniversity } from "@/lib/data/universities";
import { formatDate, upcomingDeadlines } from "@/lib/engine/deadlines";
import { recommend } from "@/lib/engine/matching";
import { matchProfessors, matchScholarship } from "@/lib/engine/discovery";
import { useApp } from "@/lib/store/app-store";
import styles from "./profile.module.css";

const usd = (v: number) => `$${v.toLocaleString("en-US")}`;
const aidCopy = { full_need: "Meets full demonstrated need", limited: "Limited aid or merit awards", none: "No need-based aid for international students" };

export default function UniversityProfile() {
  const { slug } = useParams<{ slug: string }>();
  const university = getUniversity(slug);
  const { profile, applications, addApplication, compare, toggleCompare } = useApp();

  const recommendation = useMemo(() => (university ? recommend(profile, [university], true)[0] : undefined), [profile, university]);
  const faculty = useMemo(() => (university ? matchProfessors(profile, "", professors.filter((p) => p.universitySlug === university.slug)) : []), [profile, university]);

  if (!university) notFound();

  const tracked = applications.some((a) => a.universitySlug === university.slug);
  const shortlist = applications.map((a) => a.universitySlug);
  const deadlines = upcomingDeadlines(university.deadlines);

  return (
    <Page>
      <PageHeader
        eyebrow={`${university.city} · ${university.country}`}
        title={university.name}
        description={university.summary}
        actions={
          <>
            <Button variant="ghost" onClick={() => toggleCompare(university.slug)}>
              {compare.includes(university.slug) ? "In comparison" : "Compare"}
            </Button>
            <Button onClick={() => addApplication(university.slug)} disabled={tracked}>
              {tracked ? "Tracking application" : "Add to applications"}
            </Button>
          </>
        }
      />

      <nav className={styles.anchors} aria-label="Sections">
        {["Fit", "Programs", "Admissions", "Costs", "Campus", "Careers", "Faculty"].map((s) => (
          <a key={s} href={`#${s.toLowerCase()}`}>
            {s}
          </a>
        ))}
      </nav>

      <section id="fit" className={styles.fit}>
        <Reveal>
          <Card className={styles.fitCard}>
            {recommendation ? (
              <>
                <div className={styles.fitHead}>
                  <TierBadge tier={recommendation.tier} />
                  <DataTag kind="rules" label="Match score" />
                </div>
                <div className={styles.fitScore}>
                  <ProgressRing value={recommendation.matchScore / 100} size={112} stroke={10} tone="green" label={`Match score ${recommendation.matchScore}`}>
                    <span className={styles.fitValue}>{recommendation.matchScore}</span>
                  </ProgressRing>
                  <div>
                    <p className={styles.fitLabel}>Why it fits</p>
                    <ul className={styles.fitReasons}>
                      {recommendation.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                    <p className={styles.fitLabel}>Main gap</p>
                    <p className="muted">{recommendation.mainGap}</p>
                  </div>
                </div>
                <p className={styles.financial}>
                  <Badge tone={recommendation.financial.label === "Within budget" ? "green" : recommendation.financial.label === "Needs verification" ? "neutral" : "amber"}>{recommendation.financial.label}</Badge>
                  <span className="muted">{recommendation.financial.detail}</span>
                </p>
              </>
            ) : (
              <p className="muted">This university has no programs in or near your selected fields, so no personal fit is calculated.</p>
            )}
          </Card>
        </Reveal>
        <Reveal>
          <Card>{recommendation ? <PredictionPanel prediction={recommendation.prediction} /> : <p className="muted">Select a matching field of study to see an admission estimate.</p>}</Card>
        </Reveal>
      </section>

      <Reveal>
        <Card id="programs" className={styles.section}>
          <CardHeader eyebrow="Programs" title="Undergraduate programs" />
          <ul className={styles.programs}>
            {university.programs.map((p) => (
              <li key={p.name} className={profile.fields.includes(p.field) ? styles.programMatch : undefined}>
                <span className={styles.programName}>{p.name}</span>
                <span className="faint">
                  {p.degree} · {p.field}
                </span>
                {p.selectiveNote && <span className={styles.programNote}>{p.selectiveNote}</span>}
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>

      <Reveal>
        <Card id="admissions" className={styles.section}>
          <CardHeader eyebrow="Admissions" title="Requirements and deadlines" action={<DataTag kind="institutional" />} />
          <div className={styles.factGrid}>
            <Fact label="Acceptance rate" source={university.acceptanceRate}>
              <SourcedValue data={university.acceptanceRate} format={(v) => `${Math.round(v * 1000) / 10}%`} />
            </Fact>
            <Fact label="Minimum IELTS" source={university.requirements.minIelts}>
              <SourcedValue data={university.requirements.minIelts} format={(v) => v.toFixed(1)} />
            </Fact>
            <Fact label="Minimum TOEFL iBT" source={university.requirements.minToefl}>
              <SourcedValue data={university.requirements.minToefl} format={String} />
            </Fact>
            <Fact label="Typical SAT of admits" source={university.requirements.typicalSat}>
              <SourcedValue data={university.requirements.typicalSat} format={String} />
            </Fact>
            <Fact label="Typical IB score" source={university.requirements.typicalIb}>
              <SourcedValue data={university.requirements.typicalIb} format={String} />
            </Fact>
          </div>
          <div className={styles.split}>
            <div>
              <p className={styles.subhead}>Application components</p>
              <ul className={styles.bullets}>
                {university.requirements.tests.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className={styles.subhead}>Next deadlines</p>
              <ul className={styles.deadlines}>
                {deadlines.map((d) => (
                  <li key={d.deadline.label}>
                    <span className={styles.deadlineLabel}>{d.deadline.label}</span>
                    <span className="tabular">{formatDate(d.date)}</span>
                    <span className={d.deadline.status === "needs_verification" ? styles.verify : "faint"}>{d.deadline.status === "needs_verification" ? "Needs verification" : `in ${d.days} days`}</span>
                  </li>
                ))}
              </ul>
              <SourceNote data={university.deadlineSource} compact />
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <Card id="costs" className={styles.section}>
          <CardHeader eyebrow="Costs and funding" title="Tuition, living costs and scholarships" action={<DataTag kind="institutional" />} />
          <div className={styles.factGrid}>
            <Fact label="International tuition / year" source={university.intlTuitionUsd}>
              <SourcedValue data={university.intlTuitionUsd} format={([a, b]) => (a === b ? usd(a) : `${usd(a)} – ${usd(b)}`)} />
            </Fact>
            <Fact label="Estimated living cost / year" source={university.livingCostUsd}>
              <SourcedValue data={university.livingCostUsd} format={usd} />
            </Fact>
            <Fact label="Need-based aid" source={university.needBasedAidIntl}>
              <SourcedValue data={university.needBasedAidIntl} format={(v) => aidCopy[v]} />
            </Fact>
          </div>
          <div className="pt-4">
            <TrueCostCalculator
              university={university}
              userCountry={profile.country || "Kazakhstan"}
              userBudgetUsd={profile.annualBudgetUsd || 30000}
            />
          </div>
          {university.scholarshipIds.length > 0 ? (
            <ul className={styles.scholarships}>
              {university.scholarshipIds.map((id) => {
                const s = getScholarship(id);
                if (!s) return null;
                const match = matchScholarship(profile, s, shortlist);
                return (
                  <li key={id}>
                    <div>
                      <p className={styles.programName}>{s.name}</p>
                      <p className="faint">{s.coverage}</p>
                    </div>
                    <Badge tone={match.eligibility >= 70 ? "green" : match.eligibility >= 40 ? "amber" : "neutral"}>{match.eligibility}% eligible</Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">No university-specific scholarships in our catalog yet. Check the official financial aid page.</p>
          )}
        </Card>
      </Reveal>

      <div className={styles.twoCol}>
        <Reveal>
          <Card id="campus" className={styles.section}>
            <CardHeader eyebrow="Campus life" title={`${university.campus} · ${university.size}`} />
            <p className="muted">{university.campusLife}</p>
          </Card>
        </Reveal>
        <Reveal>
          <Card id="careers" className={styles.section}>
            <CardHeader eyebrow="Career outcomes" title="After graduation" />
            <p className="muted">{university.careerOutcomes.value ?? "Information unavailable"}</p>
            <div className={styles.sourceRow}>
              <SourceNote data={university.careerOutcomes} compact />
            </div>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card id="faculty" className={styles.section}>
          <CardHeader
            eyebrow="Professor discovery"
            title="Faculty aligned with your interests"
            action={
              <Button variant="quiet" size="sm" href="/professors">
                All professors <Icon name="arrow" size={14} />
              </Button>
            }
          />
          {faculty.length ? (
            <ul className={styles.faculty}>
              {faculty.map(({ professor, fit, matchedAreas }) => (
                <li key={professor.id}>
                  <div>
                    <p className={styles.programName}>{professor.name}</p>
                    <p className="faint">{professor.department}</p>
                    <p className={styles.areas}>{professor.areas.join(" · ")}</p>
                  </div>
                  <div className={styles.facultyFit}>
                    <span className="tabular">{fit}%</span>
                    <span className="faint">{matchedAreas.length ? "research fit" : "no overlap yet"}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No faculty profiles for this university in our catalog yet.</p>
          )}
        </Card>
      </Reveal>

      <p className={styles.back}>
        <Link href="/universities">← Back to catalog</Link>
      </p>
    </Page>
  );
}

function Fact({ label, source, children }: { label: string; source: Parameters<typeof SourceNote>[0]["data"]; children: React.ReactNode }) {
  return (
    <div className={styles.fact}>
      <p className={styles.factLabel}>{label}</p>
      <p className={styles.factValue}>{children}</p>
      <SourceNote data={source} compact />
    </div>
  );
}

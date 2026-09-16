"use client";

import clsx from "clsx";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { Badge, DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Segmented, TextArea } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icon";
import { ProgressRing } from "@/components/ui/progress";
import { SourcedValue, SourceNote } from "@/components/ui/source-note";
import { PredictionPanel } from "@/components/university/prediction-panel";
import { getScholarship } from "@/lib/data/scholarships";
import { getUniversity } from "@/lib/data/universities";
import { applicationProgress, statusLabel } from "@/lib/engine/applications";
import { formatDate, upcomingDeadlines } from "@/lib/engine/deadlines";
import { matchScholarship } from "@/lib/engine/discovery";
import { recommend } from "@/lib/engine/matching";
import { ieltsEquivalent } from "@/lib/engine/profile-metrics";
import { useApp } from "@/lib/store/app-store";
import { useRoadmap } from "@/lib/store/derived";
import type { Application, ApplicationDocument } from "@/lib/types";
import styles from "./workspace.module.css";

export default function WorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const university = getUniversity(slug);
  const { profile, applications, updateApplication, removeApplication, addApplication, toggleTask } = useApp();
  const { roadmap } = useRoadmap();

  if (!university) notFound();

  const application = applications.find((a) => a.universitySlug === slug);

  if (!application) {
    return (
      <Page>
        <PageHeader eyebrow="Application workspace" title={university.name} description="This university is not in your applications yet." actions={<Button onClick={() => addApplication(slug)}>Start tracking</Button>} />
      </Page>
    );
  }

  const recommendation = recommend(profile, [university], true)[0];
  const progress = applicationProgress(application);
  const deadlines = upcomingDeadlines(university.deadlines);
  const tasks = roadmap.levels.flatMap((l) => l.tasks).filter((t) => t.universitySlug === slug);
  const ielts = ieltsEquivalent(profile);
  const minIelts = university.requirements.minIelts.value;

  const toggleItem = (key: "documents" | "essays", id: string) =>
    updateApplication(slug, { [key]: application[key].map((d: ApplicationDocument) => (d.id === id ? { ...d, done: !d.done } : d)) } as Partial<Application>);

  return (
    <Page>
      <PageHeader
        eyebrow="Application workspace"
        title={university.name}
        description={`${university.city} · ${university.country}`}
        actions={
          <>
            <Button variant="ghost" href={`/universities/${slug}`}>
              University profile
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                removeApplication(slug);
                router.push("/applications");
              }}
            >
              Stop tracking
            </Button>
          </>
        }
      />

      <div className={styles.top}>
        <Reveal>
          <Card className={styles.status}>
            <ProgressRing value={progress} size={104} stroke={9} tone="green" label={`${Math.round(progress * 100)}% of checklist complete`}>
              <span className={styles.ringValue}>{Math.round(progress * 100)}%</span>
            </ProgressRing>
            <div className={styles.statusBody}>
              <Segmented
                label="Status"
                value={application.status}
                onChange={(status) => updateApplication(slug, { status })}
                options={(Object.keys(statusLabel) as Application["status"][]).map((s) => ({ value: s, label: statusLabel[s] }))}
              />
            </div>
          </Card>
        </Reveal>
        <Reveal>
          <Card>
            <CardHeader eyebrow="Deadlines" title={deadlines[0] ? `${deadlines[0].days} days left` : "No deadline on file"} action={<DataTag kind="institutional" />} />
            <ul className={styles.deadlines}>
              {deadlines.map((d) => (
                <li key={d.deadline.label}>
                  <span>{d.deadline.label}</span>
                  <span className="tabular">{formatDate(d.date)}</span>
                  {d.deadline.status === "needs_verification" && <Badge tone="amber">Verify</Badge>}
                </li>
              ))}
            </ul>
            <SourceNote data={university.deadlineSource} compact />
          </Card>
        </Reveal>
      </div>

      <div className={styles.grid}>
        <Reveal>
          <Card>
            <CardHeader eyebrow="Requirements" title="What they ask for" />
            <ul className={styles.requirements}>
              {university.requirements.tests.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className={styles.english}>
              <span>English minimum</span>
              <SourcedValue data={university.requirements.minIelts} format={(v) => `IELTS ${v.toFixed(1)}`} />
              {minIelts !== null && (
                <Badge tone={ielts !== null && ielts >= minIelts ? "green" : "danger"}>{ielts === null ? "No test yet" : ielts >= minIelts ? `You: ${ielts.toFixed(1)} ✓` : `You: ${ielts.toFixed(1)}`}</Badge>
              )}
            </div>
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader eyebrow="Documents" title={`${application.documents.filter((d) => d.done).length} of ${application.documents.length} ready`} />
            <Checklist items={application.documents} onToggle={(id) => toggleItem("documents", id)} />
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader
              eyebrow="Essays"
              title={`${application.essays.filter((d) => d.done).length} of ${application.essays.length} drafted`}
              action={
                <Button variant="quiet" size="sm" href={`/mentor?ask=${encodeURIComponent(`Help me brainstorm my ${university.shortName} supplemental essay.`)}`}>
                  Brainstorm
                </Button>
              }
            />
            <Checklist items={application.essays} onToggle={(id) => toggleItem("essays", id)} />
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader eyebrow="Scholarships" title="Funding for this application" />
            {application.scholarshipIds.length ? (
              <ul className={styles.scholarships}>
                {application.scholarshipIds.map((id) => {
                  const s = getScholarship(id);
                  if (!s) return null;
                  const m = matchScholarship(profile, s, applications.map((a) => a.universitySlug));
                  return (
                    <li key={id}>
                      <span>{s.name}</span>
                      <Badge tone={m.eligibility >= 70 ? "green" : "amber"}>{m.eligibility}% eligible</Badge>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">
                None linked yet. <Link href="/scholarships">Browse scholarships</Link>
              </p>
            )}
          </Card>
        </Reveal>
      </div>

      {tasks.length > 0 && (
        <Reveal>
          <Card>
            <CardHeader eyebrow="Roadmap" title="Steps for this university" />
            <ul className={styles.tasks}>
              {tasks.map((t) => (
                <li key={t.id} className={clsx(t.done && styles.taskDone)}>
                  <button type="button" className={styles.check} aria-pressed={t.done} aria-label={t.title} onClick={() => toggleTask(t.id)}>
                    {t.done && <Icon name="check" size={14} />}
                  </button>
                  <span className={styles.taskTitle}>{t.title}</span>
                  {t.dueDate && <span className="faint tabular">{formatDate(t.dueDate)}</span>}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      )}

      <div className={styles.grid}>
        <Reveal>
          <Card>
            <PredictionPanel prediction={recommendation.prediction} />
          </Card>
        </Reveal>
        <Reveal>
          <Card>
            <CardHeader eyebrow="Notes" title="Your notes" />
            <TextArea label="Private notes" value={application.notes} onChange={(notes) => updateApplication(slug, { notes })} placeholder="Interview tips, contacts, program-specific ideas…" />
          </Card>
        </Reveal>
      </div>
    </Page>
  );
}

function Checklist({ items, onToggle }: { items: ApplicationDocument[]; onToggle: (id: string) => void }) {
  return (
    <ul className={styles.checklist}>
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" className={clsx(styles.item, item.done && styles.itemDone)} aria-pressed={item.done} onClick={() => onToggle(item.id)}>
            <span className={styles.check}>{item.done && <Icon name="check" size={14} />}</span>
            {item.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

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
import { useTaskCompletion } from "@/lib/store/use-task-completion";
import type { Application, ApplicationDocument } from "@/lib/types";
import styles from "./workspace.module.css";
import { useT } from "@/lib/i18n/use-t";

export default function WorkspacePage() {
  const tx = useT();
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const university = getUniversity(slug);
  const { profile, applications, updateApplication, removeApplication, addApplication } = useApp();
  const completeTask = useTaskCompletion();
  const { roadmap } = useRoadmap();

  if (!university) notFound();

  const application = applications.find((a) => a.universitySlug === slug);

  if (!application) {
    return (
      <Page>
        <PageHeader eyebrow={tx("Application workspace")} title={university.name} description={tx("This university is not in your applications yet.")} actions={<Button onClick={() => addApplication(slug)}>{tx("Start tracking")}</Button>} />
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
        eyebrow={tx("Application workspace")}
        title={university.name}
        description={`${tx(university.city)} · ${tx(university.country)}`}
        actions={
          <>
            <Button variant="ghost" href={`/universities/${slug}`}>
              
              {tx("University profile")}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                removeApplication(slug);
                router.push("/applications");
              }}
            >
              
              {tx("Stop tracking")}
            </Button>
          </>
        }
      />

      <div className={styles.top}>
        <Reveal>
          <Card className={styles.status}>
            <ProgressRing value={progress} size={104} stroke={9} tone="green" label={tx("{round}% of checklist complete", { round: Math.round(progress * 100) })}>
              <span className={styles.ringValue}>{Math.round(progress * 100)}%</span>
            </ProgressRing>
            <div className={styles.statusBody}>
              <Segmented
                label={tx("Status")}
                value={application.status}
                onChange={(status) => updateApplication(slug, { status })}
                options={(Object.keys(statusLabel) as Application["status"][]).map((s) => ({ value: s, label: statusLabel[s] }))}
              />
            </div>
          </Card>
        </Reveal>
        <Reveal>
          <Card>
            <CardHeader eyebrow={tx("Deadlines")} title={deadlines[0] ? tx("{days} days left", { days: deadlines[0].days }) : tx("No deadline on file")} action={<DataTag kind="institutional" />} />
            <ul className={styles.deadlines}>
              {deadlines.map((d) => (
                <li key={d.deadline.label}>
                  <span>{tx(d.deadline.label)}</span>
                  <span className="tabular">{formatDate(d.date)}</span>
                  {d.deadline.status === "needs_verification" && <Badge tone="amber">{tx("Verify")}</Badge>}
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
            <CardHeader eyebrow={tx("Requirements")} title={tx("What they ask for")} />
            <ul className={styles.requirements}>
              {university.requirements.tests.map((test) => (
                <li key={test}>{tx(test)}</li>
              ))}
            </ul>
            <div className={styles.english}>
              <span>{tx("English minimum")}</span>
              <SourcedValue data={university.requirements.minIelts} format={(v) => `IELTS ${v.toFixed(1)}`} />
              {minIelts !== null && (
                <Badge tone={ielts !== null && ielts >= minIelts ? "green" : "danger"}>{ielts === null ? tx("No test yet") : ielts >= minIelts ? tx("You: {ielts} (Met)", { ielts: ielts.toFixed(1) }) : `You: ${ielts.toFixed(1)}`}</Badge>
              )}
            </div>
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader eyebrow={tx("Documents")} title={tx("{count} of {count2} ready", { count: application.documents.filter((d) => d.done).length, count2: application.documents.length })} />
            <Checklist items={application.documents} onToggle={(id) => toggleItem("documents", id)} />
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader
              eyebrow={tx("Essays")}
              title={tx("{count} of {count2} drafted", { count: application.essays.filter((d) => d.done).length, count2: application.essays.length })}
              action={
                <Button variant="quiet" size="sm" href={`/mentor?ask=${encodeURIComponent(`Help me brainstorm my ${university.shortName} supplemental essay.`)}`}>
                  
                  {tx("Brainstorm")}
                </Button>
              }
            />
            <Checklist items={application.essays} onToggle={(id) => toggleItem("essays", id)} />
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader eyebrow={tx("Scholarships")} title={tx("Funding for this application")} />
            {application.scholarshipIds.length ? (
              <ul className={styles.scholarships}>
                {application.scholarshipIds.map((id) => {
                  const s = getScholarship(id);
                  if (!s) return null;
                  const m = matchScholarship(profile, s, applications.map((a) => a.universitySlug));
                  return (
                    <li key={id}>
                      <span>{tx(s.name)}</span>
                      <Badge tone={m.eligibility >= 70 ? "green" : "amber"}>{tx("{percent}% eligible", { percent: m.eligibility })}</Badge>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">
                {tx("None linked yet.")} <Link href="/scholarships">{tx("Browse scholarships")}</Link>
              </p>
            )}
          </Card>
        </Reveal>
      </div>

      {tasks.length > 0 && (
        <Reveal>
          <Card>
            <CardHeader eyebrow={tx("Roadmap")} title={tx("Steps for this university")} />
            <ul className={styles.tasks}>
              {tasks.map((t) => (
                <li key={t.id} className={clsx(t.done && styles.taskDone)}>
                  <button type="button" className={styles.check} aria-pressed={t.done} aria-label={t.title} onClick={() => completeTask(t, !t.done)}>
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
            <CardHeader eyebrow={tx("Notes")} title={tx("Your notes")} />
            <TextArea label={tx("Private notes")} value={application.notes} onChange={(notes) => updateApplication(slug, { notes })} placeholder={tx("Interview tips, contacts, program-specific ideas…")} />
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

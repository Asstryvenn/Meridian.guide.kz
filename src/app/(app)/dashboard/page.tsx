"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import Link from "next/link";
import { EmptyState, Page, PageHeader, Reveal } from "@/components/layout/page";
import { DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Meter, ProgressRing } from "@/components/ui/progress";
import { ProgressRings } from "@/components/ui/progress-rings";
import { ArchetypeQuiz } from "@/components/onboarding/archetype-quiz";
import { ARCHETYPES } from "@/lib/data/archetype";
import { PredictionRange } from "@/components/university/prediction-panel";
import { TierBadge } from "@/components/university/tier";
import { getUniversity } from "@/lib/data/universities";
import { formatDate, upcomingDeadlines } from "@/lib/engine/deadlines";
import { useApp } from "@/lib/store/app-store";
import { useDiagnostics, useNotifications, useRecommendations, useRoadmap } from "@/lib/store/derived";
import type { Tier } from "@/lib/types";
import styles from "./dashboard.module.css";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { profile, applications, toggleTask, ecoMode } = useApp();
  const diagnostics = useDiagnostics();
  const { tiers } = useRecommendations();
  const { roadmap, next } = useRoadmap();
  const notifications = useNotifications();
  const [showArchetypeQuiz, setShowArchetypeQuiz] = useState(false);
  const firstName = profile.fullName.split(" ")[0];

  const deadlines = applications
    .map((a) => getUniversity(a.universitySlug))
    .filter((u) => u !== undefined)
    .flatMap((u) => upcomingDeadlines(u.deadlines).slice(0, 1).map((d) => ({ university: u, ...d })))
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  const level = roadmap.levels.find((l) => l.level === roadmap.currentLevel);

  const userArchetype = profile.archetype ? ARCHETYPES[profile.archetype] : null;

  return (
    <Page>
      {ecoMode && (
        <Reveal>
          <div className="p-6 mb-6 rounded-2xl bg-[#589C80]/15 border border-[#589C80]/40 backdrop-blur-xl text-[#F5EED2] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#589C80]">
              <span>🌿</span> Eco-Mode Active — Breathing Room Mode
            </div>
            <h2 className="text-xl font-bold text-[#F5EED2]">
              &ldquo;Take a deep breath. Success is a marathon, not a sprint.&rdquo;
            </h2>
            <p className="text-xs text-[#F5EED2]/70 leading-relaxed">
              Heavy metrics and dense roadmaps are hidden. Non-urgent deadlines have been cushioned to give you breathing room. Focus only on what matters right now.
            </p>
          </div>
        </Reveal>
      )}

      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}.`}
        description={ecoMode ? "Pace yourself today. You are making steady progress." : diagnostics.summary}
      />

      {showArchetypeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <ArchetypeQuiz onClose={() => setShowArchetypeQuiz(false)} />
        </div>
      )}

      <div className="mb-6 p-5 rounded-2xl bg-[#132228]/80 border border-[#589C80]/30 flex flex-col md:flex-row items-center justify-between gap-4 text-[#F5EED2]">
        <div className="space-y-1 text-center md:text-left">
          <div className="text-xs font-mono font-bold text-[#EBAE29] uppercase tracking-wider">
            Student Psychographic Archetype
          </div>
          {userArchetype ? (
            <div>
              <h3 className="text-lg font-extrabold text-[#F5EED2] flex items-center gap-2 justify-center md:justify-start">
                <span>{userArchetype.badge}</span>
                <span>{userArchetype.title}</span>
              </h3>
              <p className="text-xs text-[#589C80]">{userArchetype.tagline}</p>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold text-[#F5EED2]">Discover Your Student Archetype</h3>
              <p className="text-xs text-[#F5EED2]/70">Take a 2-minute quiz to personalize your university match scoring.</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowArchetypeQuiz(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#589C80] to-[#EBAE29] text-xs font-bold text-[#132228] shadow-lg hover:brightness-110 transition-all cursor-pointer flex-shrink-0"
        >
          {userArchetype ? "Retake Archetype Quiz" : "Take Archetype Quiz"}
        </button>
      </div>

      {!ecoMode && <ProgressRings className="mb-6" />}

      <div className={styles.topGrid}>
        <Reveal className={styles.nextWrap}>
          {next ? (
            <section className={styles.next}>
              <div className={styles.nextHead}>
                <span className={styles.nextEyebrow}>Your next action</span>
                <DataTag kind="rules" label="Mentor priority" />
              </div>
              <h2 className={styles.nextTitle}>{next.task.title}</h2>
              <p className={styles.nextReason}>{next.reason}</p>
              {next.task.dueDate && <p className={styles.nextDue}>Suggested by {formatDate(next.task.dueDate)}</p>}
              <div className={styles.nextActions}>
                <Button onClick={() => toggleTask(next.task.id)}>
                  <Icon name="check" size={16} />
                  Mark as done
                </Button>
                <Button variant="secondary" href={`/mentor?ask=${encodeURIComponent(`How do I approach: ${next.task.title}?`)}`}>
                  Ask the mentor
                </Button>
              </div>
            </section>
          ) : (
            <section className={styles.next}>
              <span className={styles.nextEyebrow}>Your next action</span>
              <h2 className={styles.nextTitle}>Everything unlocked is complete.</h2>
              <p className={styles.nextReason}>Add universities to your applications to generate new steps.</p>
            </section>
          )}
        </Reveal>

        {!ecoMode && (
          <Reveal>
            <Card className={styles.progressCard}>
              <ProgressRing value={roadmap.progress} size={132} stroke={11} label={`Roadmap ${Math.round(roadmap.progress * 100)}% complete`}>
                <span className={styles.ringValue}>{Math.round(roadmap.progress * 100)}%</span>
                <span className={styles.ringCaption}>roadmap</span>
              </ProgressRing>
              <div className={styles.progressText}>
                <p className="eyebrow">Level {roadmap.currentLevel}</p>
                <p className={styles.levelTitle}>{level?.title}</p>
                <p className="muted tabular">
                  {roadmap.earnedXp} / {roadmap.totalXp} XP
                </p>
                <Button variant="quiet" size="sm" href="/roadmap">
                  Open roadmap <Icon name="arrow" size={14} />
                </Button>
              </div>
            </Card>
          </Reveal>
        )}
      </div>

      <div className={styles.grid}>
        <Reveal className={styles.span2}>
          <Card>
            <CardHeader
              eyebrow="Recommendations"
              title="Your balanced list"
              action={
                <Button variant="quiet" size="sm" href="/matches">
                  All matches <Icon name="arrow" size={14} />
                </Button>
              }
            />
            <div className={styles.tiers}>
              {(["Dream", "Target", "Safety"] as Tier[]).map((tier) => {
                const top = tiers[tier][0];
                return (
                  <div key={tier} className={styles.tierCol}>
                    <TierBadge tier={tier} />
                    {top ? (
                      <Link href={`/universities/${top.university.slug}`} className={styles.tierItem}>
                        <span className={styles.tierName}>{top.university.shortName}</span>
                        <PredictionRange prediction={top.prediction} />
                        <span className={styles.tierMeta}>Match {top.matchScore} · {top.financial.label}</span>
                      </Link>
                    ) : (
                      <p className={styles.tierEmpty}>No {tier.toLowerCase()} options match your current filters.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader
              eyebrow="Diagnostics"
              title={`Profile strength ${diagnostics.overall}`}
              action={
                <Button variant="quiet" size="sm" href="/diagnostics">
                  Details
                </Button>
              }
            />
            <ul className={styles.dimensions}>
              {diagnostics.dimensions.slice(0, 5).map((d) => (
                <li key={d.key}>
                  <div className={styles.dimensionRow}>
                    <span>{d.label}</span>
                    <span className="tabular faint">{d.score ?? "—"}</span>
                  </div>
                  <Meter value={d.score} tone={d.score !== null && d.score >= 70 ? "green" : "amber"} label={`${d.label} ${d.score ?? "no data"}`} />
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <CardHeader eyebrow="Deadlines" title="Coming up" />
            {deadlines.length ? (
              <ul className={styles.deadlines}>
                {deadlines.map((d) => (
                  <li key={`${d.university.slug}-${d.deadline.label}`}>
                    <Link href={`/applications/${d.university.slug}`} className={styles.deadline}>
                      <span className={clsx(styles.days, d.days <= 30 && styles.daysUrgent)}>
                        <strong className="tabular">{d.days}</strong>
                        <span>days</span>
                      </span>
                      <span className={styles.deadlineText}>
                        <span className={styles.deadlineUni}>{d.university.shortName}</span>
                        <span className="faint">
                          {d.deadline.label} · {formatDate(d.date)}
                        </span>
                        {d.deadline.status === "needs_verification" && <span className={styles.verify}>Needs verification</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Add universities to your applications to track their deadlines.</p>
            )}
          </Card>
        </Reveal>

        <Reveal className={styles.span2}>
          <Card>
            <CardHeader eyebrow="Alerts" title={notifications.length === 0 ? "Nothing urgent" : notifications.length === 1 ? "1 thing needs attention" : `${notifications.length} things need attention`} />
            {notifications.length ? (
              <ul className={styles.alerts}>
                {notifications.map((n) => (
                  <motion.li key={n.id} layout>
                    <Link href={n.href} className={styles.alert}>
                      <span className={clsx(styles.alertDot, styles[`alert_${n.kind}`])} />
                      <span>
                        <span className={styles.alertTitle}>{n.title}</span>
                        <span className="faint">{n.body}</span>
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="muted">We&apos;ll only alert you about approaching deadlines, test score gaps and strong scholarship matches.</p>
            )}
          </Card>
        </Reveal>
      </div>

      {applications.length === 0 && (
        <EmptyState
          title="Start your application list"
          body="Add at least three universities — one Dream, one Target and one Safety — to unlock deadlines, essays and document tracking."
          action={<Button href="/matches">Browse your matches</Button>}
        />
      )}
    </Page>
  );
}

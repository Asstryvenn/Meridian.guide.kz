"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import Link from "next/link";
import { Compass, Leaf, Sparkles } from "lucide-react";
import { EmptyState, Page, PageHeader, Reveal } from "@/components/layout/page";
import { DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Meter, ProgressRing } from "@/components/ui/progress";
import { ProgressRings } from "@/components/ui/progress-rings";
import { ArchetypeQuiz } from "@/components/onboarding/archetype-quiz";
import { CareerAssessmentModal } from "@/components/onboarding/career-assessment-modal";
import { ActivityRecommender } from "@/components/activities/activity-recommender";
import { ChanceBoostModal } from "@/components/diploma/chance-boost-modal";
import { ARCHETYPES } from "@/lib/data/archetype";
import { PredictionRange } from "@/components/university/prediction-panel";
import { TierBadge } from "@/components/university/tier";
import { getUniversity } from "@/lib/data/universities";
import { formatDate, upcomingDeadlines } from "@/lib/engine/deadlines";
import { useApp } from "@/lib/store/app-store";
import { useTaskCompletion } from "@/lib/store/use-task-completion";
import { useDiagnostics, useNotifications, useRecommendations, useRoadmap } from "@/lib/store/derived";
import type { Tier } from "@/lib/types";
import styles from "./dashboard.module.css";
import { useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return msg("Good morning");
  if (hour < 18) return msg("Good afternoon");
  return msg("Good evening");
}

export default function Dashboard() {
  const t = useT();
  const { profile, applications, ecoMode } = useApp();
  const completeTask = useTaskCompletion();
  const diagnostics = useDiagnostics();
  const { tiers } = useRecommendations();
  const { roadmap, next } = useRoadmap();
  const notifications = useNotifications();
  const [showArchetypeQuiz, setShowArchetypeQuiz] = useState(false);
  const [showCareerAssessment, setShowCareerAssessment] = useState(false);
  const [showChanceBoostModal, setShowChanceBoostModal] = useState(false);
  const firstName = profile.fullName.split(" ")[0];

  useEffect(() => {
    if (!profile.careerAssessment) {
      const timer = setTimeout(() => {
        setShowCareerAssessment(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [profile.careerAssessment]);

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
          <div className="p-6 mb-6 rounded-3xl bg-[#589C80]/15 border border-[#589C80]/40 backdrop-blur-xl text-ink space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-green-ink">
              <Leaf size={14} className="text-green-ink" /> {t("Eco-Mode Active — Breathing Room Mode")}
            </div>
            <h2 className="text-xl font-bold text-ink">
              
              &ldquo;{t("Take a deep breath. Success is a marathon, not a sprint.")}&rdquo;
            </h2>
            <p className="text-xs text-ink/70 leading-relaxed">
              
              {t("Heavy metrics and dense roadmaps are muted. Non-urgent deadlines have been cushioned to give you space. Focus on today's single most important step.")}
            </p>

            <div className="p-4 rounded-2xl bg-panel/80 border border-[#589C80]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-[#589C80] animate-ping shrink-0" />
                <span className="text-xs font-mono text-ink">
                  
                  {t("Box Breathing: Inhale (4s) • Hold (4s) • Exhale (4s) • Rest (4s)")}
                </span>
              </div>
              <Button
                variant="quiet"
                size="sm"
                href="/mentor"
              >
                
                {t("Open Vent / Support Mode")}
              </Button>
            </div>
          </div>
        </Reveal>
      )}

      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}.`}
        description={ecoMode ? t("Pace yourself today. You are making steady progress.") : diagnostics.summary}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowChanceBoostModal(true)}
              className="cursor-pointer"
            >
              <Sparkles size={14} className="mr-1.5 inline" />
              <span>{t("Upload Achievement")}</span>
            </Button>
          </div>
        }
      />

      <ChanceBoostModal
        isOpen={showChanceBoostModal}
        onClose={() => setShowChanceBoostModal(false)}
      />

      <CareerAssessmentModal
        isOpen={showCareerAssessment}
        onClose={() => setShowCareerAssessment(false)}
      />

      {showArchetypeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto overscroll-contain scroll-touch">
          <ArchetypeQuiz onClose={() => setShowArchetypeQuiz(false)} />
        </div>
      )}

      <div className="mb-6 p-5 rounded-3xl bg-panel/80 border border-[#EBAE29]/30 flex flex-col md:flex-row items-center justify-between gap-4 text-ink shadow-sm">
        <div className="space-y-1 text-center md:text-left">
          <div className="text-xs font-mono font-bold text-amber-ink uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
            <Compass size={14} className="text-[#EBAE29]" />
            <span>{t("Career Guidance & Trajectory")}</span>
          </div>
          {profile.careerAssessment ? (
            <div>
              <h3 className="text-lg font-extrabold text-ink flex items-center gap-2 justify-center md:justify-start">
                <span>{profile.careerAssessment.topMatches[0]?.title}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#589C80]/20 text-green-ink border border-[#589C80]/40">
                  {profile.careerAssessment.topMatches[0]?.matchPercent}% {t("Fit")}
                </span>
              </h3>
              <p className="text-xs text-ink/80 max-w-xl">
                {profile.careerAssessment.topMatches[0]?.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2 justify-center md:justify-start">
                {profile.careerAssessment.topMatches[0]?.foundationalSkills.map((skill) => (
                  <span key={skill} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-black/5 dark:bg-white/5 border border-line text-ink/70">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold text-ink">{t("Discover Your Best-Fit Career Trajectory")}</h3>
              <p className="text-xs text-ink/70">{t("Complete a 7-minute assessment to identify high-impact career pathways and required foundational competencies.")}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowCareerAssessment(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#EBAE29] to-[#589C80] text-xs font-bold text-white shadow-lg hover:brightness-110 transition-all cursor-pointer flex-shrink-0"
        >
          {profile.careerAssessment ? t("Review Assessment") : t("Start Career Assessment")}
        </button>
      </div>

      <div className="mb-6 p-5 rounded-3xl bg-panel/80 border border-[#589C80]/30 flex flex-col md:flex-row items-center justify-between gap-4 text-ink">
        <div className="space-y-1 text-center md:text-left">
          <div className="text-xs font-mono font-bold text-amber-ink uppercase tracking-wider">
            
            {t("Student Psychographic Archetype")}
          </div>
          {userArchetype ? (
            <div>
              <h3 className="text-lg font-extrabold text-ink flex items-center gap-2 justify-center md:justify-start">
                <span>{userArchetype.badge}</span>
                <span>{userArchetype.title}</span>
              </h3>
              <p className="text-xs text-green-ink">{userArchetype.tagline}</p>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold text-ink">{t("Discover Your Student Archetype")}</h3>
              <p className="text-xs text-ink/70">{t("Take a 2-minute quiz to personalize your university match scoring.")}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowArchetypeQuiz(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#589C80] to-[#EBAE29] text-xs font-bold text-on-accent shadow-lg hover:brightness-110 transition-all cursor-pointer flex-shrink-0"
        >
          {userArchetype ? t("Retake Archetype Quiz") : t("Take Archetype Quiz")}
        </button>
      </div>

      {!ecoMode && <ProgressRings className="mb-6" />}

      <div className={styles.topGrid}>
        <Reveal className={styles.nextWrap}>
          {next ? (
            <section className={styles.next}>
              <div className={styles.nextHead}>
                <span className={styles.nextEyebrow}>{t("Your next action")}</span>
                <DataTag kind="rules" label={t("Mentor priority")} />
              </div>
              <h2 className={styles.nextTitle}>{next.task.title}</h2>
              <p className={styles.nextReason}>{next.reason}</p>
              {next.task.dueDate && <p className={styles.nextDue}>{t("Suggested by {date}", { date: formatDate(next.task.dueDate) })}</p>}
              <div className={styles.nextActions}>
                <Button onClick={() => completeTask(next.task, true)}>
                  <Icon name="check" size={16} />
                  {t("Mark as done")}
                </Button>
                <Button variant="secondary" href={`/mentor?ask=${encodeURIComponent(`How do I approach: ${next.task.title}?`)}`}>
                  
                  {t("Ask the mentor")}
                </Button>
              </div>
            </section>
          ) : (
            <section className={styles.next}>
              <span className={styles.nextEyebrow}>{t("Your next action")}</span>
              <h2 className={styles.nextTitle}>{t("Everything unlocked is complete.")}</h2>
              <p className={styles.nextReason}>{t("Add universities to your applications to generate new steps.")}</p>
            </section>
          )}
        </Reveal>

        {!ecoMode && (
          <Reveal>
            <Card className={styles.progressCard}>
              <ProgressRing value={roadmap.progress} size={132} stroke={11} label={t("Roadmap {round}% complete", { round: Math.round(roadmap.progress * 100) })}>
                <span className={styles.ringValue}>{Math.round(roadmap.progress * 100)}%</span>
                <span className={styles.ringCaption}>{t("roadmap")}</span>
              </ProgressRing>
              <div className={styles.progressText}>
                <p className="eyebrow">{t("Level {level}", { level: roadmap.currentLevel })}</p>
                <p className={styles.levelTitle}>{level?.title}</p>
                <p className="muted tabular">
                  {t("{earned} / {total} XP", { earned: roadmap.earnedXp, total: roadmap.totalXp })}
                </p>
                <Button variant="quiet" size="sm" href="/roadmap">
                  {t("Open roadmap")} <Icon name="arrow" size={14} />
                </Button>
              </div>
            </Card>
          </Reveal>
        )}
      </div>

      {!ecoMode && (
        <Reveal className="my-8">
          <ActivityRecommender />
        </Reveal>
      )}

      {!ecoMode && (
        <div className={styles.grid}>
          <Reveal className={styles.span2}>
            <Card>
              <CardHeader
                eyebrow={t("Recommendations")}
                title={t("Your balanced list")}
                action={
                  <Button variant="quiet" size="sm" href="/matches">
                    {t("All matches")} <Icon name="arrow" size={14} />
                  </Button>
                }
              />
              <div className={styles.tiers}>
                {([t("Dream"), t("Target"), t("Safety")] as Tier[]).map((tier) => {
                  const top = tiers[tier][0];
                  return (
                    <div key={tier} className={styles.tierCol}>
                      <TierBadge tier={tier} />
                      {top ? (
                        <Link href={`/universities/${top.university.slug}`} className={styles.tierItem}>
                          <span className={styles.tierName}>{top.university.shortName}</span>
                          <PredictionRange prediction={top.prediction} />
                          <span className={styles.tierMeta}>{t("Match {score}", { score: top.matchScore })} · {t(top.financial.label)}</span>
                        </Link>
                      ) : (
                        <p className={styles.tierEmpty}>{t("No {tier} options match your current filters.", { tier: t(tier).toLowerCase() })}</p>
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
                eyebrow={t("Diagnostics")}
                title={t("Profile strength {overall}", { overall: diagnostics.overall })}
                action={
                  <Button variant="quiet" size="sm" href="/diagnostics">
                    
                    {t("Details")}
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
                    <Meter value={d.score} tone={d.score !== null && d.score >= 70 ? "green" : "amber"} label={`${d.label} ${d.score ?? t("no data")}`} />
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal>
            <Card>
              <CardHeader eyebrow={t("Deadlines")} title={t("Coming up")} />
              {deadlines.length ? (
                <ul className={styles.deadlines}>
                  {deadlines.map((d) => (
                    <li key={`${d.university.slug}-${d.deadline.label}`}>
                      <Link href={`/applications/${d.university.slug}`} className={styles.deadline}>
                        <span className={clsx(styles.days, d.days <= 30 && styles.daysUrgent)}>
                          <strong className="tabular">{d.days}</strong>
                          <span>{t("days")}</span>
                        </span>
                        <span className={styles.deadlineText}>
                          <span className={styles.deadlineUni}>{d.university.shortName}</span>
                          <span className="faint">
                            {t(d.deadline.label)} · {formatDate(d.date)}
                          </span>
                          {d.deadline.status === "needs_verification" && <span className={styles.verify}>{t("Needs verification")}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">{t("Add universities to your applications to track their deadlines.")}</p>
              )}
            </Card>
          </Reveal>

          <Reveal className={styles.span2}>
            <Card>
              <CardHeader eyebrow={t("Alerts")} title={notifications.length === 0 ? t("Nothing urgent") : notifications.length === 1 ? t("1 thing needs attention") : t("{count} things need attention", { count: notifications.length })} />
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
                <p className="muted">{t("We'll only alert you about approaching deadlines, test score gaps and strong scholarship matches.")}</p>
              )}
            </Card>
          </Reveal>
        </div>
      )}

      {applications.length === 0 && (
        <EmptyState
          title={t("Start your application list")}
          body={t("Add at least three universities — one Dream, one Target and one Safety — to unlock deadlines, essays and document tracking.")}
          action={<Button href="/matches">{t("Browse your matches")}</Button>}
        />
      )}
    </Page>
  );
}

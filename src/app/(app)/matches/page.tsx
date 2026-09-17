"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { EmptyState, Page, PageHeader, Reveal } from "@/components/layout/page";
import { DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/fields";
import { CompareTray } from "@/components/university/compare-tray";
import { RecommendationCard } from "@/components/university/recommendation-card";
import { useRecommendations } from "@/lib/store/derived";
import type { Tier } from "@/lib/types";
import styles from "./matches.module.css";
import { useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

type Filter = "All" | Tier;

const tierCopy: Record<Tier, string> = {
  Dream: msg("Admission is a reach even with a strong application."),
  Target: msg("Your profile is within the typical admitted range."),
  Safety: msg("You are likely to be admitted if you apply carefully."),
};

export default function MatchesPage() {
  const t = useT();
  const { list, tiers } = useRecommendations();
  const [filter, setFilter] = useState<Filter>("All");
  const shown = filter === "All" ? list : tiers[filter];

  return (
    <Page>
      <PageHeader
        eyebrow={t("Recommendation engine")}
        title={t("Dream, Target, Safety")}
        description={t("Ranked by how well each university fits your field, budget, preferences and goals. Tiers come from the admission estimate range.")}
        actions={
          <Button variant="secondary" href="/universities">
            
            {t("Search the catalog")}
          </Button>
        }
      />

      <Reveal className={styles.controls}>
        <Segmented
          label={t("Show")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "All", label: t("All {count}", { count: list.length }) },
            { value: "Dream", label: t("Dream {count}", { count: tiers.Dream.length }) },
            { value: "Target", label: t("Target {count}", { count: tiers.Target.length }) },
            { value: "Safety", label: t("Safety {count}", { count: tiers.Safety.length }) },
          ]}
        />
        <div className={styles.legend}>
          <DataTag kind="prediction" />
          <DataTag kind="rules" label={t("Match score")} />
          <DataTag kind="institutional" />
        </div>
      </Reveal>

      {filter !== "All" && (
        <Reveal>
          <p className={styles.tierNote}>{t(tierCopy[filter])}</p>
        </Reveal>
      )}

      {list.length < 3 && (
        <EmptyState
          title={t("Too few matches")}
          body={t("Pick at least one field of study and widen your country preferences so we can build a balanced list.")}
          action={<Button href="/onboarding?edit=1">{t("Update preferences")}</Button>}
        />
      )}

      <motion.div layout className={styles.grid}>
        <AnimatePresence mode="popLayout">
          {shown.map((recommendation) => (
            <motion.div
              key={recommendation.university.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <RecommendationCard recommendation={recommendation} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <CompareTray />
    </Page>
  );
}

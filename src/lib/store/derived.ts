"use client";

import { useMemo } from "react";
import { diagnose } from "@/lib/engine/diagnostics";
import { groupByTier, recommend } from "@/lib/engine/matching";
import { buildNotifications } from "@/lib/engine/notifications";
import { buildRoadmap, nextAction } from "@/lib/engine/roadmap";
import { inLocale } from "@/lib/i18n/catalog";
import { useLocale } from "@/lib/i18n/use-t";
import { useApp } from "./app-store";

export function useDiagnostics() {
  const { profile } = useApp();
  const locale = useLocale();
  return useMemo(() => inLocale(locale, () => diagnose(profile)), [profile, locale]);
}

export function useRecommendations() {
  const { profile } = useApp();
  const locale = useLocale();
  return useMemo(
    () =>
      inLocale(locale, () => {
        const list = recommend(profile);
        return { list, tiers: groupByTier(list) };
      }),
    [profile, locale],
  );
}

export function useRoadmap() {
  const { profile, applications, completedTasks, customRoadmapTasks } = useApp();
  const locale = useLocale();
  return useMemo(
    () =>
      inLocale(locale, () => {
        const roadmap = buildRoadmap(profile, applications, completedTasks, new Date(), customRoadmapTasks);
        return { roadmap, next: nextAction(roadmap) };
      }),
    [profile, applications, completedTasks, customRoadmapTasks, locale],
  );
}

export function useNotifications() {
  const { profile, applications, dismissedNotifications } = useApp();
  const locale = useLocale();
  return useMemo(() => inLocale(locale, () => buildNotifications(profile, applications, dismissedNotifications)), [profile, applications, dismissedNotifications, locale]);
}

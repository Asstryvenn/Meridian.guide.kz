"use client";

import { useMemo } from "react";
import { diagnose } from "@/lib/engine/diagnostics";
import { groupByTier, recommend } from "@/lib/engine/matching";
import { buildNotifications } from "@/lib/engine/notifications";
import { buildRoadmap, nextAction } from "@/lib/engine/roadmap";
import { useApp } from "./app-store";

export function useDiagnostics() {
  const { profile } = useApp();
  return useMemo(() => diagnose(profile), [profile]);
}

export function useRecommendations() {
  const { profile } = useApp();
  return useMemo(() => {
    const list = recommend(profile);
    return { list, tiers: groupByTier(list) };
  }, [profile]);
}

export function useRoadmap() {
  const { profile, applications, completedTasks, customRoadmapTasks } = useApp();
  return useMemo(() => {
    const roadmap = buildRoadmap(profile, applications, completedTasks, new Date(), customRoadmapTasks);
    return { roadmap, next: nextAction(roadmap) };
  }, [profile, applications, completedTasks, customRoadmapTasks]);
}

export function useNotifications() {
  const { profile, applications, dismissedNotifications } = useApp();
  return useMemo(() => buildNotifications(profile, applications, dismissedNotifications), [profile, applications, dismissedNotifications]);
}

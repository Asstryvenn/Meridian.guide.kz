"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import type { RoadmapTask } from "@/lib/types";
import { useApp } from "./app-store";
import { useRoadmap } from "./derived";
import { tr } from "@/lib/i18n/catalog";

export function useTaskCompletion() {
  const { setTaskDone } = useApp();
  const { roadmap } = useRoadmap();
  const { notify } = useToast();

  return useCallback(
    (task: RoadmapTask, done: boolean) => {
      setTaskDone(task.id, done);
      if (!done) {
        notify({ tone: "info", title: tr("Task reopened"), body: tr("−{xp} XP", { xp: task.xp }) });
        return;
      }
      try {
        navigator.vibrate?.(12);
      } catch {}
      const level = roadmap.levels.find((l) => l.level === task.level);
      const finishesLevel = level && level.completed + 1 === level.tasks.length;
      const unlocksNext = level && level.completed + 1 === Math.ceil(level.tasks.length / 2);
      notify({ tone: "xp", title: tr("+{xp} XP", { xp: task.xp }), body: task.title });
      if (finishesLevel) {
        notify({ tone: "level", title: tr("Level {level} complete!", { level: level.level }), body: tr("{title} is done. Keep going.", { title: level.title }) });
      } else if (unlocksNext && roadmap.levels.some((l) => l.level > task.level && l.locked)) {
        notify({ tone: "success", title: tr("Next level unlocked"), body: tr("You finished half of this level.") });
      }
    },
    [setTaskDone, roadmap, notify],
  );
}

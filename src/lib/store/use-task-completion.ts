"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import type { RoadmapTask } from "@/lib/types";
import { useApp } from "./app-store";
import { useRoadmap } from "./derived";

export function useTaskCompletion() {
  const { setTaskDone } = useApp();
  const { roadmap } = useRoadmap();
  const { notify } = useToast();

  return useCallback(
    (task: RoadmapTask, done: boolean) => {
      setTaskDone(task.id, done);
      if (!done) {
        notify({ tone: "info", title: "Task reopened", body: `−${task.xp} XP` });
        return;
      }
      try {
        navigator.vibrate?.(12);
      } catch {}
      const level = roadmap.levels.find((l) => l.level === task.level);
      const finishesLevel = level && level.completed + 1 === level.tasks.length;
      const unlocksNext = level && level.completed + 1 === Math.ceil(level.tasks.length / 2);
      notify({ tone: "xp", title: `+${task.xp} XP`, body: task.title });
      if (finishesLevel) {
        notify({ tone: "level", title: `Level ${level.level} complete!`, body: `${level.title} is done. Keep going.` });
      } else if (unlocksNext && roadmap.levels.some((l) => l.level > task.level && l.locked)) {
        notify({ tone: "success", title: "Next level unlocked", body: "You finished half of this level." });
      }
    },
    [setTaskDone, roadmap, notify],
  );
}

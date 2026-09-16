"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store/app-store";
import { useI18n } from "@/components/i18n/i18n-context";
import { getRecommendationsForProfile } from "@/lib/engine/extracurricular-recommender";
import type { FieldOfStudy, RecommendedActivity, RoadmapTask } from "@/lib/types";

const availableFields: FieldOfStudy[] = [
  "Computer Science",
  "Artificial Intelligence",
  "Data Science",
  "Economics",
  "Business",
  "Medicine",
  "Biology",
  "Physics",
  "Mathematics",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Design",
];

export function ActivityRecommender() {
  const { profile, addCustomRoadmapTask, customRoadmapTasks } = useApp();
  const { t, locale } = useI18n();

  const [selectedField, setSelectedField] = useState<FieldOfStudy>(
    profile.fields[0] || "Computer Science"
  );
  const [recommendations, setRecommendations] = useState<RecommendedActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const existing = new Set(customRoadmapTasks.map((t) => t.id));
    setAddedIds(existing);
  }, [customRoadmapTasks]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "extracurricular_recommendations",
        payload: {
          field: selectedField,
          activities: profile.activities,
        },
        locale,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.recommendations && Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
        } else {
          setRecommendations(
            getRecommendationsForProfile({ ...profile, fields: [selectedField] }, locale)
          );
        }
      })
      .catch(() => {
        if (!active) return;
        setRecommendations(
          getRecommendationsForProfile({ ...profile, fields: [selectedField] }, locale)
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedField, profile, locale]);

  const handleAddToRoadmap = (activity: RecommendedActivity) => {
    const newTask: RoadmapTask = {
      id: activity.id,
      title: activity.roadmapTaskTitle,
      detail: `${activity.category} (${activity.role}): ${activity.description}`,
      kind: "activity",
      level: 3,
      xp: activity.xpReward,
      dueDate: null,
      done: false,
    };

    addCustomRoadmapTask(newTask);
    setAddedIds((prev) => new Set([...prev, activity.id]));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#132228]/85 border border-[#589C80]/30 shadow-2xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <h2 className="text-xl font-bold tracking-tight text-[#F5EED2]">
              {t.recommender.title}
            </h2>
          </div>
          <p className="text-xs text-[#F5EED2]/70 max-w-xl">
            {t.recommender.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-mono font-semibold text-[#EBAE29] uppercase">
            {t.recommender.fieldLabel}:
          </label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value as FieldOfStudy)}
            className="text-xs px-3 py-2 rounded-xl bg-[#132228] border border-[#589C80]/40 text-[#F5EED2] font-semibold focus:outline-none focus:border-[#EBAE29] cursor-pointer"
          >
            {availableFields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-[#132228]/50 border border-[#589C80]/20 animate-pulse p-6"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {recommendations.map((rec) => {
              const isAdded = addedIds.has(rec.id);
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl bg-[#132228]/90 border border-[#589C80]/30 hover:border-[#EBAE29] transition-all duration-300 p-6 flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#589C80]/20 text-[#589C80] border border-[#589C80]/40">
                        {rec.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold text-[#EBAE29] bg-[#EBAE29]/15 border border-[#EBAE29]/30">
                        {rec.impactPotential} {t.recommender.impact}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#F5EED2] leading-snug">
                        {rec.title}
                      </h3>
                      <p className="text-xs font-mono text-[#589C80] mt-0.5">
                        {rec.role}
                      </p>
                    </div>

                    <p className="text-xs text-[#F5EED2]/80 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[#589C80]/20">
                    <div className="flex items-center justify-between text-xs font-mono text-[#F5EED2]/70">
                      <span>
                        ⏱ ~{rec.estimatedHoursPerWeek} {t.recommender.hoursWeek}
                      </span>
                      <span className="text-[#EBAE29] font-bold">
                        +{rec.xpReward} XP
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToRoadmap(rec)}
                      disabled={isAdded}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-mono tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                        isAdded
                          ? "bg-[#589C80]/20 border border-[#589C80]/50 text-[#589C80]"
                          : "bg-gradient-to-r from-[#589C80] to-[#EBAE29] text-[#132228] hover:brightness-110 shadow-lg shadow-[#589C80]/15"
                      }`}
                    >
                      <span>{isAdded ? "✓" : "+"}</span>
                      <span>
                        {isAdded
                          ? t.recommender.addedToRoadmap
                          : t.recommender.addToRoadmap}
                      </span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

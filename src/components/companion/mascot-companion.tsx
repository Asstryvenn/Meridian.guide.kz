"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertCircle, Flame, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/lib/store/app-store";
import type { TotemMascotId } from "@/lib/types";
import styles from "./mascot-companion.module.css";

export const TOTEM_DETAILS: Record<
  TotemMascotId,
  { name: string; title: string; image: string; color: string; personality: string }
> = {
  alikhan: {
    name: "Alikhan",
    title: "The Ambitious Pioneer",
    image: "/totems/alikhan.png",
    color: "#589C80",
    personality: "Driven, tech-focused, and optimistic about building global-impact solutions.",
  },
  zhanbolat: {
    name: "Zhanbolat",
    title: "The Royal Scholar",
    image: "/totems/zhanbolat.png",
    color: "#EBAE29",
    personality: "Strategic, analytical, and relentless in academic excellence.",
  },
  aizere: {
    name: "Aizere",
    title: "The Creative Luminary",
    image: "/totems/aizere.png",
    color: "#E27A62",
    personality: "Charismatic, expressive, and passionate about community and storytelling.",
  },
  nurali: {
    name: "Nurali",
    title: "The Determined Leader",
    image: "/totems/nurali.png",
    color: "#3B82F6",
    personality: "Disciplined, articulate, and dedicated to leadership and debate.",
  },
  arystan: {
    name: "Alikhan",
    title: "The Ambitious Pioneer",
    image: "/totems/alikhan.png",
    color: "#589C80",
    personality: "Driven, tech-focused, and optimistic about building global-impact solutions.",
  },
  sunkar: {
    name: "Zhanbolat",
    title: "The Royal Scholar",
    image: "/totems/zhanbolat.png",
    color: "#EBAE29",
    personality: "Strategic, analytical, and relentless in academic excellence.",
  },
  amina: {
    name: "Aizere",
    title: "The Creative Luminary",
    image: "/totems/aizere.png",
    color: "#E27A62",
    personality: "Charismatic, expressive, and passionate about community and storytelling.",
  },
};

export function MascotCompanion() {
  const { chosenTotem, mascotState, currentStreak, totalExp } = useApp();
  const [bubbleOpen, setBubbleOpen] = useState(false);

  const totem = TOTEM_DETAILS[chosenTotem] || TOTEM_DETAILS.alikhan;

  useEffect(() => {
    if (mascotState !== "idle") {
      setBubbleOpen(true);
      const timer = setTimeout(() => setBubbleOpen(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [mascotState]);

  const getSpeechContent = () => {
    if (mascotState === "celebrating") {
      return {
        title: "Spectacular Work!",
        text: "Task completed! Your application spike is growing stronger.",
        badge: <Sparkles size={11} />,
        badgeClass: styles.badgeCelebrating,
      };
    }
    if (mascotState === "streak_fire") {
      return {
        title: `${currentStreak} Day Streak!`,
        text: "Consistency is key to Ivy League and selective university admissions!",
        badge: <Flame size={11} />,
        badgeClass: styles.badgeStreak,
      };
    }
    if (mascotState === "warning_alert") {
      return {
        title: "Deadline Alert!",
        text: "A milestone deadline was missed. 50 EXP deducted. Let's catch up now!",
        badge: <AlertCircle size={11} />,
        badgeClass: styles.badgeAlert,
      };
    }
    return {
      title: `${totem.name} · Companion`,
      text: `Streak: ${currentStreak} days · ${totalExp} EXP. Ready for your next milestone!`,
      badge: null,
      badgeClass: "",
    };
  };

  const speech = getSpeechContent();

  const stateClass =
    mascotState === "celebrating"
      ? styles.celebrating
      : mascotState === "streak_fire"
      ? styles.streakFire
      : mascotState === "warning_alert"
      ? styles.warningAlert
      : styles.idle;

  return (
    <aside className={styles.container} aria-label="Totem Companion">
      {bubbleOpen && (
        <div className={styles.speechBubble}>
          <span className={styles.bubbleTitle}>
            {speech.badge}
            <span>{speech.title}</span>
          </span>
          <p>{speech.text}</p>
          <span className={styles.bubbleAction}>Click to dismiss</span>
        </div>
      )}

      <button
        type="button"
        className={clsx(styles.mascotButton, stateClass)}
        onClick={() => setBubbleOpen((v) => !v)}
        aria-label={`${totem.name} companion. Click to talk.`}
      >
        <Image
          src={totem.image}
          alt={totem.name}
          width={64}
          height={64}
          priority
          className={styles.avatarImage}
        />
        {speech.badge && <span className={clsx(styles.badgeState, speech.badgeClass)}>{speech.badge}</span>}
      </button>
    </aside>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertCircle, Flame, Sparkles } from "lucide-react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
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

interface MascotCompanionProps {
  embedded?: boolean;
}

export function MascotCompanion({ embedded = false }: MascotCompanionProps) {
  const { chosenTotem, mascotState, currentStreak, totalExp } = useApp();
  const [bubbleOpen, setBubbleOpen] = useState(false);

  const totem = TOTEM_DETAILS[chosenTotem] || TOTEM_DETAILS.alikhan;

  useEffect(() => {
    if (mascotState !== "idle") {
      const showTimer = setTimeout(() => {
        setBubbleOpen(true);
      }, 0);
      const hideTimer = setTimeout(() => {
        setBubbleOpen(false);
      }, 5000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
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

  const content = (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex flex-col items-center pointer-events-auto"
    >
      <AnimatePresence>
        {bubbleOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 right-0 z-20 w-max max-w-[240px] pointer-events-auto p-3 rounded-2xl bg-neutral-900/90 border border-white/[0.08] shadow-2xl backdrop-blur-xl text-neutral-100"
          >
            <span className={styles.bubbleTitle}>
              {speech.badge}
              <span>{speech.title}</span>
            </span>
            <p className="text-xs mt-1 text-neutral-300 leading-relaxed">{speech.text}</p>
            <span className="text-[10px] text-neutral-500 font-mono mt-1.5 block">
              Click to dismiss
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-md p-1.5 rounded-full shadow-lg">
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
          {speech.badge && (
            <span className={clsx(styles.badgeState, speech.badgeClass)}>{speech.badge}</span>
          )}
        </button>
      </div>
    </motion.div>
  );

  if (embedded) {
    return content;
  }

  return (
    <aside
      className="fixed bottom-6 right-6 flex flex-col items-center gap-3 z-50 pointer-events-none"
      aria-label="Totem Companion"
    >
      {content}
    </aside>
  );
}

export default MascotCompanion;

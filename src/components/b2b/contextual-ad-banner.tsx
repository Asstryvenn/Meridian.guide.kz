"use client";

import { useMemo } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import type { Advertisement, RoadmapTask } from "@/lib/types";
import styles from "./contextual-ad-banner.module.css";

interface ContextualAdBannerProps {
  task: RoadmapTask;
}

export function ContextualAdBanner({ task }: ContextualAdBannerProps) {
  const { profile, advertisements } = useApp();

  const matchingAd: Advertisement | null = useMemo(() => {
    if (!advertisements || !advertisements.length) return null;

    const taskText = `${task.title} ${task.detail} ${task.kind}`.toLowerCase();
    const studentCountry = (profile.country || "").toLowerCase();

    return (
      advertisements.find((ad) => {
        if (!ad.active) return false;
        const kwMatch = taskText.includes(ad.targetKeyword.toLowerCase());
        const countryMatch =
          ad.targetCountry === "all" ||
          ad.targetCountry.toLowerCase() === studentCountry ||
          (studentCountry.includes("kazakhstan") && ad.targetCountry.toLowerCase() === "kazakhstan");
        return kwMatch && countryMatch;
      }) || null
    );
  }, [task, profile.country, advertisements]);

  if (!matchingAd) return null;

  return (
    <aside className={styles.adCard} aria-label="Sponsored educational course recommendation">
      <header className={styles.adHeader}>
        <span className={styles.sponsoredBadge}>
          <ShieldCheck size={11} />
          <span>Verified Partner</span>
        </span>
        {matchingAd.discountNote && <span className={styles.discountPill}>{matchingAd.discountNote}</span>}
      </header>
      <div className={styles.adContent}>
        <h4 className={styles.adTitle}>{matchingAd.title}</h4>
        <p className={styles.adSubtitle}>{matchingAd.subtitle}</p>
      </div>
      <footer className={styles.adFooter}>
        <a
          href={matchingAd.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaLink}
        >
          <span>{matchingAd.ctaLabel}</span>
          <ExternalLink size={12} />
        </a>
      </footer>
    </aside>
  );
}

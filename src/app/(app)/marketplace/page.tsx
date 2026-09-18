"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Flame, Gift, Sparkles, Tag } from "lucide-react";
import clsx from "clsx";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { useToast } from "@/components/ui/toast";
import { defaultRewards } from "@/lib/store/defaults";
import { useApp } from "@/lib/store/app-store";
import type { RewardItem } from "@/lib/types";
import styles from "./marketplace.module.css";
import { useT } from "@/lib/i18n/use-t";

type CategoryFilter = "all" | "counseling" | "ielts" | "waiver" | "sat" | "essay";

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All Rewards" },
  { id: "counseling", label: "Admissions Counseling" },
  { id: "ielts", label: "IELTS / TOEFL Courses" },
  { id: "waiver", label: "Fee Waivers" },
  { id: "sat", label: "SAT / Test Prep" },
  { id: "essay", label: "Essay Review" },
];

export default function MarketplacePage() {
  const t = useT();
  const { totalExp, currentStreak, redeemedRewards, purchaseReward } = useApp();
  const { notify } = useToast();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredRewards = useMemo(() => {
    if (filter === "all") return defaultRewards;
    return defaultRewards.filter((r) => r.category === filter);
  }, [filter]);

  const handleRedeem = (reward: RewardItem) => {
    const res = purchaseReward(reward);
    if (!res.success) {
      notify({ tone: "error", title: t("Cannot redeem"), body: t(res.error || "Insufficient EXP balance") });
      return;
    }
    notify({
      tone: "success",
      title: t("Reward Unlocked!"),
      body: t("You redeemed {title}. Your voucher code is ready.", { title: reward.title }),
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Page>
      <PageHeader
        eyebrow={t("Meridian Marketplace")}
        title={t("Spend EXP for Real Admissions Rewards")}
        description={t("Convert the XP you earn by completing Roadmap milestones into real university application fee waivers, counseling sessions, and test prep vouchers.")}
      />

      <Reveal>
        <div className={styles.balanceCard}>
          <div className={styles.balanceMeta}>
            <span className={styles.balanceLabel}>{t("Your Balance")}</span>
            <span className={styles.balanceValue}>{totalExp} EXP</span>
            <span className={styles.balanceSub}>
              {t("Earn more by completing milestones on your Roadmap")}
            </span>
          </div>
          <div className={styles.streakBadge}>
            <Flame size={18} />
            <span>{t("{count} Day Streak", { count: currentStreak })}</span>
          </div>
        </div>
      </Reveal>

      <div className={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={clsx(styles.filterBtn, filter === cat.id && styles.filterBtnActive)}
            onClick={() => setFilter(cat.id)}
          >
            {t(cat.label)}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filteredRewards.map((reward) => {
          const canAfford = totalExp >= reward.cost;
          return (
            <Reveal key={reward.id}>
              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.provider}>{reward.provider}</span>
                  <span className={styles.badge}>{reward.badge}</span>
                </div>
                <h3 className={styles.itemTitle}>{reward.title}</h3>
                <p className={styles.itemDesc}>{reward.description}</p>
                <div className={styles.cardFoot}>
                  <span className={styles.costTag}>{reward.cost} EXP</span>
                  <button
                    type="button"
                    className={styles.redeemBtn}
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford}
                  >
                    <Gift size={13} />
                    <span>{canAfford ? t("Redeem Code") : t("Need {cost} EXP", { cost: reward.cost })}</span>
                  </button>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      {redeemedRewards.length > 0 && (
        <section className={styles.redeemedSection}>
          <h2 className={styles.redeemedTitle}>{t("My Unlocked Vouchers & Promo Codes")}</h2>
          <div className={styles.redeemedList}>
            {redeemedRewards.map((item) => (
              <div key={item.id} className={styles.voucherCard}>
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-green-ink" />
                  <span className={styles.voucherTitle}>{item.title}</span>
                </div>
                <div className={styles.codeBox}>
                  <span>{item.discountCode}</span>
                  <button
                    type="button"
                    className={styles.copyCodeBtn}
                    onClick={() => handleCopyCode(item.discountCode)}
                  >
                    {copiedCode === item.discountCode ? (
                      <>
                        <Check size={13} />
                        <span>{t("Copied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>{t("Copy")}</span>
                      </>
                    )}
                  </button>
                </div>
                <span className="text-[10px] text-ink/50">
                  {t("Redeemed on {date} · {cost} EXP spent", {
                    date: item.redeemedAt.slice(0, 10),
                    cost: item.cost,
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}

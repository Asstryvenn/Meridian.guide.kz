"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Megaphone, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useApp } from "@/lib/store/app-store";
import styles from "./b2b.module.css";
import { useT } from "@/lib/i18n/use-t";

export default function B2BPortalPage() {
  const t = useT();
  const { advertisements, createAdvertisement, toggleAdvertisementActive, toggleBusinessAccount } = useApp();
  const { notify } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [targetCountry, setTargetCountry] = useState("Kazakhstan");
  const [targetKeyword, setTargetKeyword] = useState("ielts");
  const [ctaLabel, setCtaLabel] = useState("Claim 20% Discount");
  const [ctaUrl, setCtaUrl] = useState("https://");
  const [discountNote, setDiscountNote] = useState("Promo Code: MERIDIAN20");

  const totalImpressions = useMemo(
    () => advertisements.reduce((sum, a) => sum + (a.impressions || 0), 0),
    [advertisements]
  );
  const totalClicks = useMemo(
    () => advertisements.reduce((sum, a) => sum + (a.clicks || 0), 0),
    [advertisements]
  );
  const averageCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subtitle || !ctaUrl) {
      notify({ tone: "error", title: t("Missing fields"), body: t("Please fill in campaign title, details, and link.") });
      return;
    }

    createAdvertisement({
      b2bAccountId: "b2b-active-partner",
      title,
      subtitle,
      targetCountry,
      targetKeyword,
      ctaLabel,
      ctaUrl,
      discountNote,
      active: true,
    });

    notify({
      tone: "success",
      title: t("Campaign Published"),
      body: t("Your contextual sponsorship is now live across student roadmaps."),
    });

    setFormOpen(false);
    setTitle("");
    setSubtitle("");
  };

  return (
    <Page>
      <PageHeader
        eyebrow={t("B2B Partner Portal")}
        title={t("Educational Business & Advertising Hub")}
        description={t("Connect directly with thousands of competitive high school applicants preparing for standardized exams, university admissions, and scholarships.")}
      />

      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-xs text-ink/70 hover:text-ink flex items-center gap-1">
          <ArrowLeft size={13} />
          <span>{t("Back to Student Portal")}</span>
        </Link>
        <Button variant="secondary" size="sm" onClick={toggleBusinessAccount}>
          {t("Switch to Student Mode")}
        </Button>
      </div>

      <Reveal>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t("Total Ad Impressions")}</span>
            <span className={styles.statValue}>{totalImpressions.toLocaleString()}</span>
            <span className={styles.statSub}>+18.4% this week</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t("Total Lead Clicks")}</span>
            <span className={styles.statValue}>{totalClicks.toLocaleString()}</span>
            <span className={styles.statSub}>+24.1% conversion rate</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t("Average CTR")}</span>
            <span className={styles.statValue}>{averageCtr}%</span>
            <span className={styles.statSub}>Industry standard: 4.2%</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t("Active Campaigns")}</span>
            <span className={styles.statValue}>{advertisements.filter((a) => a.active).length}</span>
            <span className={styles.statSub}>Contextual targeting active</span>
          </div>
        </div>
      </Reveal>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{t("Sponsored Roadmap Placements")}</h2>
        <Button size="sm" onClick={() => setFormOpen((v) => !v)}>
          <Plus size={14} />
          <span>{formOpen ? t("Cancel") : t("New Sponsored Placement")}</span>
        </Button>
      </div>

      {formOpen && (
        <form className={styles.newCampaignForm} onSubmit={handleCreate}>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-ink uppercase tracking-wider">
            <Megaphone size={14} />
            <span>{t("Create Context-Aware Sponsored Ad")}</span>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("Campaign Title")}</label>
              <input
                className={styles.formInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. IELTS Zone Almaty: 7.5+ Band Course"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("Target Student Country")}</label>
              <select
                className={styles.formSelect}
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
              >
                <option value="Kazakhstan">Kazakhstan</option>
                <option value="Uzbekistan">Uzbekistan</option>
                <option value="Kyrgyzstan">Kyrgyzstan</option>
                <option value="all">All Countries</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("Target Keyword / Trigger")}</label>
              <select
                className={styles.formSelect}
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
              >
                <option value="ielts">IELTS Exam</option>
                <option value="sat">SAT Exam</option>
                <option value="toefl">TOEFL Exam</option>
                <option value="essay">Personal Statement / Essay</option>
                <option value="scholarship">Scholarships & Aid</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("Voucher / Promo Code Note")}</label>
              <input
                className={styles.formInput}
                value={discountNote}
                onChange={(e) => setDiscountNote(e.target.value)}
                placeholder="e.g. Promo Code: MERIDIAN20"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("CTA Button Label")}</label>
              <input
                className={styles.formInput}
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="e.g. Claim 20% Discount"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("Destination URL")}</label>
              <input
                type="url"
                className={styles.formInput}
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://yourwebsite.com/offer"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("Offer Description & Details")}</label>
            <textarea
              className={styles.formInput}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Intensive 4-week weekend bootcamp in Almaty & Astana with British Council certified instructors."
              rows={2}
              required
            />
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" size="sm" onClick={() => setFormOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button type="submit" size="sm">
              <CheckCircle2 size={13} />
              <span>{t("Launch Placement")}</span>
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className={styles.campaignsTable}>
          <thead>
            <tr>
              <th className={styles.th}>{t("Placement Title")}</th>
              <th className={styles.th}>{t("Targeting")}</th>
              <th className={styles.th}>{t("Status")}</th>
              <th className={styles.th}>{t("Impressions")}</th>
              <th className={styles.th}>{t("Clicks")}</th>
              <th className={styles.th}>{t("Action")}</th>
            </tr>
          </thead>
          <tbody>
            {advertisements.map((ad) => (
              <tr key={ad.id}>
                <td className={styles.td}>
                  <div className="font-bold text-ink">{ad.title}</div>
                  <div className="text-xs text-ink/60">{ad.subtitle}</div>
                </td>
                <td className={styles.td}>
                  <span className="font-mono text-xs bg-panel px-2 py-0.5 rounded border border-line">
                    {ad.targetCountry} · {ad.targetKeyword.toUpperCase()}
                  </span>
                </td>
                <td className={styles.td}>
                  <span
                    className={clsx(
                      styles.statusPill,
                      ad.active ? styles.statusActive : styles.statusPaused
                    )}
                  >
                    {ad.active ? t("Active") : t("Paused")}
                  </span>
                </td>
                <td className={styles.td}>{ad.impressions.toLocaleString()}</td>
                <td className={styles.td}>{ad.clicks.toLocaleString()}</td>
                <td className={styles.td}>
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => toggleAdvertisementActive(ad.id)}
                  >
                    {ad.active ? t("Pause") : t("Activate")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-panel border border-[#589C80]/30 flex items-start gap-4">
        <ShieldCheck size={28} className="text-green-ink shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-ink">{t("Contextual Intent Matching Active")}</h3>
          <p className="text-xs text-ink/70 mt-1 leading-relaxed">
            {t("When a student from Kazakhstan adds an IELTS Exam task to their Roadmap, your localized course offer is automatically rendered in their feed. All placements comply with educational quality verification standards.")}
          </p>
        </div>
      </div>
    </Page>
  );
}

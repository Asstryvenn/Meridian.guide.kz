"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Award,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Compass,
  BarChart3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useLocale, useT } from "@/lib/i18n/use-t";
import type { PortfolioAnalysisResult } from "@/app/api/ai/portfolio-analyze/route";

const SCAN_STEPS = [
  "Evaluating GPA, SAT, and academic coursework rigor...",
  "Analyzing extracurricular leadership & intellectual spike...",
  "Benchmarking profile against Top 30 admitted applicant corpus...",
  "Synthesizing narrative strengths and strategic mitigation plan...",
];

export function PortfolioDeepScan() {
  const t = useT();
  const locale = useLocale();
  const { profile, applications } = useApp();

  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [analysis, setAnalysis] = useState<PortfolioAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runDeepScan() {
    setLoading(true);
    setError(null);
    setStepIndex(0);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      const response = await fetch("/api/ai/portfolio-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          locale,
          targetUniversities: applications.map((a) => a.universitySlug),
        }),
      });

      if (!response.ok) throw new Error("Failed to scan portfolio");
      const data = await response.json();
      setAnalysis(data.result);
    } catch {
      setError(t("Failed to complete AI portfolio analysis. Please try again."));
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  }

  return (
    <div className="p-6 rounded-3xl bg-panel border border-[#589C80]/30 shadow-lg space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#589C80]/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#EBAE29]" />
            <h3 className="text-base font-bold text-ink">
              {t("Comprehensive AI Portfolio Scanning")}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#589C80]/20 text-green-ink border border-[#589C80]/30">
              GPT-4o Engine
            </span>
          </div>
          <p className="text-xs text-ink/70">
            {t("Deep holistic evaluation across academic metrics, narrative cohesion, leadership spikes, and competitive positioning.")}
          </p>
        </div>

        <button
          type="button"
          onClick={runDeepScan}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#EBAE29] text-on-accent font-mono text-xs font-bold hover:bg-[#EBAE29]/90 shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{t("Scanning Portfolio...")}</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>{analysis ? t("Re-Scan Portfolio") : t("Run Full AI Portfolio Scan")}</span>
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#589C80]/15 flex items-center justify-center border border-[#589C80]/30 text-green-ink animate-pulse">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-ink">
              {t(SCAN_STEPS[stepIndex])}
            </p>
            <p className="text-xs font-mono text-ink/50">
              {t("Step {current} of {total}", { current: stepIndex + 1, total: SCAN_STEPS.length })}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-800/40 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-surface-sunken border border-[#589C80]/20 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-ink/60 uppercase">
                {t("Overall Competitiveness Score")}
              </span>
              <div className="flex items-baseline gap-2 py-2">
                <span className="text-4xl font-mono font-black text-ink">
                  {analysis.overallScore}
                </span>
                <span className="text-xs font-mono text-ink/50">/ 100</span>
              </div>
              <div className="w-full bg-black/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#589C80] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${analysis.overallScore}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-sunken border border-[#589C80]/20 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-ink/60 uppercase">
                {t("Competitiveness Tier")}
              </span>
              <p className="text-lg font-bold text-green-ink py-2 leading-snug">
                {analysis.competitivenessTier}
              </p>
              <p className="text-[11px] font-mono text-ink/60">
                {t("Based on comprehensive Ivy League admissions criteria")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface-sunken border border-[#589C80]/20 flex flex-col justify-between">
              <span className="text-[11px] font-mono text-ink/60 uppercase">
                {t("Recommended Spike Focus")}
              </span>
              <p className="text-xs font-bold text-ink py-2 leading-relaxed">
                {analysis.recommendedSpike}
              </p>
              <span className="text-[10px] font-mono text-[#EBAE29] flex items-center gap-1">
                <TrendingUp size={12} />
                {t("Strategic Differentiator")}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-panel border border-[#589C80]/30 space-y-2">
            <h4 className="text-xs font-mono text-ink/60 uppercase flex items-center gap-2">
              <Compass size={14} className="text-[#589C80]" />
              <span>{t("Holistic Admissions Evaluation")}</span>
            </h4>
            <p className="text-xs text-ink/90 leading-relaxed">
              {analysis.holisticEvaluation}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-panel border border-[#589C80]/30 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-ink" />
                <h4 className="text-xs font-bold text-ink uppercase font-mono">
                  {t("Narrative Strengths & High-Impact Signals")}
                </h4>
              </div>
              <div className="space-y-2.5">
                {analysis.narrativeStrengths.map((st, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-surface-sunken border border-[#589C80]/20 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-ink">{st.title}</p>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#589C80]/20 text-green-ink uppercase font-bold">
                        {st.impact}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink/70 leading-relaxed">
                      {st.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-panel border border-red-800/30 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-400" />
                <h4 className="text-xs font-bold text-ink uppercase font-mono">
                  {t("Critical Weaknesses & Mitigation Plan")}
                </h4>
              </div>
              <div className="space-y-2.5">
                {analysis.criticalWeaknesses.map((wk, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-surface-sunken border border-red-800/20 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-ink">{wk.title}</p>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/30 text-red-400 border border-red-800/30 uppercase font-bold">
                        {wk.urgency}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink/70 leading-relaxed">
                      {wk.description}
                    </p>
                    <div className="pt-1 text-[11px] font-mono text-amber-ink">
                      <strong>{t("Mitigation")}:</strong> {wk.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-panel border border-[#589C80]/30 space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#EBAE29]" />
              <h4 className="text-xs font-bold text-ink uppercase font-mono">
                {t("Strategic Next Steps & Milestone Actions")}
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.strategicNextSteps.map((step, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-surface-sunken border border-[#589C80]/20 space-y-1.5"
                >
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EBAE29]/20 text-amber-ink font-bold">
                    {step.timeframe}
                  </span>
                  <p className="text-xs font-bold text-ink pt-1">{step.action}</p>
                  <p className="text-[11px] text-ink/70 leading-relaxed">{step.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#589C80]/15 to-[#EBAE29]/15 border border-[#589C80]/30 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-mono uppercase text-ink/60">
                {t("Admissions Committee Outlook")}
              </p>
              <p className="text-xs font-semibold text-ink italic">
                &ldquo;{analysis.admissionsOddsOutlook}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

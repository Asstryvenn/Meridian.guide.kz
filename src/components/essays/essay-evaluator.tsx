"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  FileText,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  BarChart3,
  Sliders,
  ChevronDown,
  Cpu,
  BrainCircuit,
  ChevronRight,
  Lightbulb,
  Wand2,
  UserCheck,
  X,
  Layers,
  FileCheck2,
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useI18n } from "@/components/i18n/i18n-context";
import { useT } from "@/lib/i18n/use-t";
import {
  computeStage1MlMetrics,
  CORPUS_BENCHMARKS,
} from "@/lib/engine/essay-dataset-corpus";
import { STANDARD_ESSAY_PROMPTS, type EssayStandardPrompt } from "@/lib/data/essay-prompts";
import type { HybridEssayEvaluationResult } from "@/lib/types";
import type { BrainstormAngle } from "@/app/api/ai/essay-angles/route";
import type { EssayEnhanceResult } from "@/app/api/ai/essay-enhance/route";

function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dashoffset = circumference * (1 - clamped / 100);

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128" aria-hidden>
        <circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth="10"
          className="stroke-black/10 dark:stroke-white/10 fill-none"
        />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-[#EBAE29] fill-none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashoffset }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black tracking-tight text-ink font-mono">{score}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink/60">out of 100</span>
      </div>
    </div>
  );
}

export function EssayEvaluator() {
  const tx = useT();
  const { locale } = useI18n();
  const { profile, applications } = useApp();

  const [selectedPromptId, setSelectedPromptId] = useState<string>(STANDARD_ESSAY_PROMPTS[0].id);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);
  const [targetUniversity, setTargetUniversity] = useState(
    applications[0]?.universitySlug ? applications[0].universitySlug.toUpperCase() : "Selective Global University"
  );
  const [essayText, setEssayText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<HybridEssayEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const [brainstormLoading, setBrainstormLoading] = useState(false);
  const [angles, setAngles] = useState<BrainstormAngle[] | null>(null);
  const [showBrainstormModal, setShowBrainstormModal] = useState(false);

  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<EssayEnhanceResult | null>(null);
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [enhanceTab, setEnhanceTab] = useState<"critiques" | "polished">("polished");

  const [humanizeLoading, setHumanizeLoading] = useState(false);
  const [humanizeSuccess, setHumanizeSuccess] = useState(false);

  const currentStandardPrompt = STANDARD_ESSAY_PROMPTS.find((p) => p.id === selectedPromptId) || STANDARD_ESSAY_PROMPTS[0];
  const activePromptText = isCustomPrompt ? customPrompt : currentStandardPrompt.prompt;

  const liveStage1Metrics = useMemo(() => {
    return computeStage1MlMetrics(essayText);
  }, [essayText]);

  async function handleEvaluate() {
    if (liveStage1Metrics.word_count < 30) {
      setError(tx("Please enter at least 30 words before evaluating."));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/essay-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayText,
          prompt: activePromptText,
          targetUniversity,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate essay");
      }

      const data = await response.json();
      if (data.result) {
        setEvaluation(data.result);
      }
    } catch {
      setError(tx("Evaluation request failed. Please check your network connection and retry."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBrainstorm() {
    setBrainstormLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/essay-angles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePromptText,
          profile,
          locale,
        }),
      });
      if (!res.ok) throw new Error("Brainstorm request failed");
      const data = await res.json();
      setAngles(data.angles || []);
      setShowBrainstormModal(true);
    } catch {
      setError(tx("Could not generate brainstorming angles. Please try again."));
    } finally {
      setBrainstormLoading(false);
    }
  }

  async function handleEnhance() {
    if (liveStage1Metrics.word_count < 40) {
      setError(tx("Please enter at least 40 words before enhancing."));
      return;
    }
    setEnhanceLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/essay-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayText,
          prompt: activePromptText,
          targetUniversity,
          locale,
        }),
      });
      if (!res.ok) throw new Error("Enhance request failed");
      const data = await res.json();
      setEnhancedResult(data.result);
      setEnhanceTab("polished");
      setShowEnhanceModal(true);
    } catch {
      setError(tx("Failed to enhance essay. Please check connection."));
    } finally {
      setEnhanceLoading(false);
    }
  }

  async function handleHumanize() {
    if (liveStage1Metrics.word_count < 40) {
      setError(tx("Please enter at least 40 words before humanizing."));
      return;
    }
    setHumanizeLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/essay-humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayText,
          locale,
        }),
      });
      if (!res.ok) throw new Error("Humanize request failed");
      const data = await res.json();
      if (data.humanizedText) {
        setEssayText(data.humanizedText);
        setHumanizeSuccess(true);
        setTimeout(() => setHumanizeSuccess(false), 3500);
      }
    } catch {
      setError(tx("Failed to humanize essay. Please try again."));
    } finally {
      setHumanizeLoading(false);
    }
  }

  function applyAngle(angle: BrainstormAngle) {
    const outlineBlock = `Title: ${angle.hookTheme}\n\nStory Arc:\n${angle.narrativeArc}\n\nOutline:\n${angle.outlinePoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n[Begin drafting your personal story here...]`;
    setEssayText(outlineBlock);
    setShowBrainstormModal(false);
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto px-1 sm:px-0">
      <div className="p-6 rounded-3xl bg-panel/90 border border-[#589C80]/30 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-ink uppercase tracking-wider">
              <BrainCircuit size={15} className="text-[#EBAE29]" />
              <span>{tx("Hybrid ML & OpenAI Admissions Pipeline")}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
              {tx("Admissions Essay Evaluation Engine")}
            </h2>
            <p className="text-xs text-ink/70 leading-relaxed max-w-2xl">
              {tx("Calibrated against 1,002 admitted applicant essays. Select standard prompts, brainstorm unique narrative angles, enhance prose, and humanize authentic voice.")}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-right">
              <span className="block text-[10px] font-mono text-ink/60 uppercase">{tx("Corpus Baseline")}</span>
              <span className="text-xs font-bold text-green-ink font-mono">{CORPUS_BENCHMARKS.totalEssays} {tx("Admissions Essays")}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-ink/80 block">
                {tx("Standard Admissions Prompt")}
              </label>
              <button
                type="button"
                onClick={handleBrainstorm}
                disabled={brainstormLoading}
                className="text-xs font-mono text-[#EBAE29] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {brainstormLoading ? <RefreshCw size={12} className="animate-spin" /> : <Lightbulb size={12} />}
                <span>{tx("Brainstorm 3 Angles")}</span>
              </button>
            </div>

            {!isCustomPrompt ? (
              <div className="relative">
                <select
                  value={selectedPromptId}
                  onChange={(e) => setSelectedPromptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-xs text-ink focus:outline-none focus:border-[#589C80] appearance-none pr-8 cursor-pointer"
                >
                  <optgroup label="Common Application Prompts">
                    {STANDARD_ESSAY_PROMPTS.filter((p) => p.category === "Common App").map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.wordLimit} words)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="UC System Personal Insight Questions (PIQ)">
                    {STANDARD_ESSAY_PROMPTS.filter((p) => p.category === "UC System PIQ").map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.wordLimit} words)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Supplemental Archetypes">
                    {STANDARD_ESSAY_PROMPTS.filter((p) => p.category === "Supplemental Archetypes").map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.wordLimit} words)
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-ink/40 pointer-events-none" />
              </div>
            ) : (
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={tx("Type your custom prompt here...")}
                className="w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-xs text-ink focus:outline-none focus:border-[#589C80]"
              />
            )}

            <div className="flex items-center justify-between text-[11px] text-ink/60 font-mono">
              <button
                type="button"
                onClick={() => setIsCustomPrompt((prev) => !prev)}
                className="hover:underline text-green-ink cursor-pointer"
              >
                {isCustomPrompt ? tx("Choose standard prompt") : tx("+ Write custom prompt...")}
              </button>
              {!isCustomPrompt && (
                <span>{tx("Max limit")}: {currentStandardPrompt.wordLimit} {tx("words")}</span>
              )}
            </div>

            {!isCustomPrompt && (
              <p className="text-[11px] text-ink/70 italic p-2 rounded-lg bg-surface-sunken border border-line/30 leading-relaxed">
                &ldquo;{currentStandardPrompt.prompt}&rdquo;
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-ink/80 block">
              {tx("Target Institution")}
            </label>
            <input
              type="text"
              value={targetUniversity}
              onChange={(e) => setTargetUniversity(e.target.value)}
              placeholder="e.g. Stanford, MIT, Harvard, Oxford..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-xs text-ink focus:outline-none focus:border-[#589C80]"
            />
            <div className="p-3 rounded-xl bg-surface-sunken border border-line/40 text-[11px] text-ink/70 space-y-1">
              <span className="font-bold text-green-ink font-mono uppercase text-[10px] block">{tx("Target Calibrations")}</span>
              <p>{tx("Evaluates thematic fit and admissions committee standards for {school}.", { school: targetUniversity })}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-mono font-bold text-ink/80">
              {tx("Essay Draft")}
            </label>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-ink/70">
              <span>{liveStage1Metrics.word_count} {tx("words")}</span>
              <span>•</span>
              <span>{liveStage1Metrics.sentence_count} {tx("sentences")}</span>
              <span>•</span>
              <span className={clsx(liveStage1Metrics.lexical_density >= 0.65 ? "text-green-ink font-bold" : "text-amber-ink")}>
                {tx("Lexical Density:")} {(liveStage1Metrics.lexical_density * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <textarea
            rows={12}
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder={tx("Paste or write your admissions essay draft here. Use the toolbar buttons below to brainstorm angles, polish prose, or humanize the voice...")}
            className="w-full p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line text-sm text-ink leading-relaxed font-sans focus:outline-none focus:border-[#589C80] resize-y"
          />
        </div>

        {humanizeSuccess && (
          <div className="p-3 rounded-xl bg-[#589C80]/15 border border-[#589C80]/30 text-xs text-green-ink font-mono flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{tx("Essay successfully humanized! Robotic phrasing eliminated while preserving your authentic meaning.")}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleEnhance}
              disabled={enhanceLoading || liveStage1Metrics.word_count < 30}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#EBAE29]/20 text-amber-ink hover:bg-[#EBAE29]/30 border border-[#EBAE29]/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {enhanceLoading ? <RefreshCw size={13} className="animate-spin" /> : <Wand2 size={13} />}
              <span>{tx("Enhance Essay")}</span>
            </button>

            <button
              type="button"
              onClick={handleHumanize}
              disabled={humanizeLoading || liveStage1Metrics.word_count < 30}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#589C80]/20 text-green-ink hover:bg-[#589C80]/30 border border-[#589C80]/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {humanizeLoading ? <RefreshCw size={13} className="animate-spin" /> : <UserCheck size={13} />}
              <span>{tx("Humanize Voice")}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleEvaluate}
            disabled={isLoading || liveStage1Metrics.word_count < 30}
            className={clsx(
              "px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center",
              isLoading || liveStage1Metrics.word_count < 30
                ? "bg-line text-ink/40 cursor-not-allowed"
                : "bg-gradient-to-br from-[#4e9377] via-[#5ea489] to-[#d4a342] text-white hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#4e9377]/20 border border-white/10"
            )}
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{tx("Evaluating with Hybrid Engine...")}</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>{tx("Evaluate With Hybrid Architecture")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showBrainstormModal && angles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl bg-panel border border-[#589C80]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#589C80]/20">
              <div className="flex items-center gap-2">
                <Lightbulb className="text-[#EBAE29]" size={20} />
                <h3 className="text-base font-bold text-ink">
                  {tx("3 Creative Narrative Angles Tailored to Your Profile")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBrainstormModal(false)}
                className="p-1 rounded-lg text-ink/60 hover:text-ink cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {angles.map((angle) => (
                <div
                  key={angle.angleNumber}
                  className="p-5 rounded-2xl bg-surface-sunken border border-[#589C80]/30 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#EBAE29]/20 text-amber-ink">
                      {tx("Angle {number}", { number: angle.angleNumber })}
                    </span>
                    <button
                      type="button"
                      onClick={() => applyAngle(angle)}
                      className="text-xs font-mono font-bold text-green-ink hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{tx("Use this outline")}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-ink">{angle.hookTheme}</h4>
                  <p className="text-xs text-ink/80 leading-relaxed">{angle.narrativeArc}</p>

                  <div className="p-2.5 rounded-xl bg-panel border border-[#589C80]/20 text-[11px] text-ink/70">
                    <strong>{tx("Profile Fit")}: </strong>
                    {angle.profileConnection}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase text-ink/50">{tx("Story Arc Progression")}</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-ink/90 font-sans">
                      {angle.outlinePoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-green-ink font-bold">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showEnhanceModal && enhancedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-panel border border-[#589C80]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#589C80]/20">
              <div className="flex items-center gap-2">
                <Wand2 className="text-[#EBAE29]" size={20} />
                <h3 className="text-base font-bold text-ink">
                  {tx("Advanced Essay Polishing & Version Comparison")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEnhanceModal(false)}
                className="p-1 rounded-lg text-ink/60 hover:text-ink cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-line/40 pb-2">
              <button
                type="button"
                onClick={() => setEnhanceTab("polished")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  enhanceTab === "polished"
                    ? "bg-[#589C80] text-on-accent shadow-sm"
                    : "text-ink/70 hover:text-ink"
                }`}
              >
                {tx("AI-Enhanced Final Version")}
              </button>
              <button
                type="button"
                onClick={() => setEnhanceTab("critiques")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  enhanceTab === "critiques"
                    ? "bg-[#589C80] text-on-accent shadow-sm"
                    : "text-ink/70 hover:text-ink"
                }`}
              >
                {tx("Original & Structural Critiques")} ({enhancedResult.critiques.length})
              </button>
            </div>

            {enhanceTab === "polished" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#589C80]/15 border border-[#589C80]/30 space-y-1">
                  <span className="text-[10px] font-mono text-green-ink font-bold uppercase">{tx("Tone & Impact Verdict")}</span>
                  <p className="text-xs text-ink leading-relaxed">{enhancedResult.toneVerdict}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-ink/80">{tx("Polished Essay Text")}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyText(enhancedResult.enhancedText, "polished_copy")}
                        className="text-xs font-mono text-green-ink hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === "polished_copy" ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === "polished_copy" ? tx("Copied") : tx("Copy Text")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEssayText(enhancedResult.enhancedText);
                          setShowEnhanceModal(false);
                        }}
                        className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#EBAE29] text-on-accent hover:bg-[#EBAE29]/90 cursor-pointer"
                      >
                        {tx("Apply to Editor")}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-surface-sunken border border-line text-sm text-ink leading-relaxed font-sans whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                    {enhancedResult.enhancedText}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-panel border border-line space-y-2">
                  <span className="text-xs font-mono font-bold text-ink uppercase">{tx("Key Improvements Executed")}</span>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-ink/80">
                    {enhancedResult.keyImprovements.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-green-ink shrink-0 mt-0.5" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {enhanceTab === "critiques" && (
              <div className="space-y-3">
                {enhancedResult.critiques.map((crit, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surface-sunken border border-line space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EBAE29]/20 text-amber-ink uppercase font-bold">
                        {crit.type}
                      </span>
                      <span className="text-xs text-ink/50 font-mono">#{idx + 1}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-serif">
                      &ldquo;{crit.originalSnippet}&rdquo;
                    </div>
                    <p className="text-xs text-ink/80 leading-relaxed">{crit.critique}</p>
                    <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-600 font-serif">
                      <strong>{tx("Suggested Revision")}: </strong>
                      &ldquo;{crit.suggestedRevision}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-3xl bg-panel border border-[#589C80]/40 shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 border-b border-line/40 pb-6">
              <div className="space-y-3 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#589C80]/20 text-green-ink border border-[#589C80]/40">
                    <CheckCircle2 size={12} />
                    <span>{tx("ML Verified")}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EBAE29]/20 text-amber-ink border border-[#EBAE29]/40">
                    <Sparkles size={12} />
                    <span>{tx("OpenAI Supervised")}</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-ink">
                  {tx("Admissions Scorecard")}
                </h3>
                <p className="text-xs text-ink/80 max-w-xl leading-relaxed">
                  {evaluation.narrative_evaluation}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <ScoreGauge score={evaluation.final_score} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 items-center justify-center lg:justify-start">
              <div className="px-3.5 py-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-line flex items-center gap-2">
                <TrendingUp size={14} className="text-[#EBAE29]" />
                <span className="text-xs font-mono text-ink/70">{tx("ML Confidence Match:")}</span>
                <span className="text-xs font-mono font-bold text-amber-ink">{evaluation.ml_confidence_match}%</span>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-line flex items-center gap-2">
                <Award size={14} className="text-[#589C80]" />
                <span className="text-xs font-mono text-ink/70">{tx("Admission Probability:")}</span>
                <span className="text-xs font-mono font-bold text-green-ink">{evaluation.ml_metrics.admission_probability}%</span>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-line flex items-center gap-2">
                <Sliders size={14} className="text-ink/60" />
                <span className="text-xs font-mono text-ink/70">{tx("Structural Coherence:")}</span>
                <span className="text-xs font-mono font-bold text-ink">{evaluation.ml_metrics.structural_coherence}/100</span>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-line flex items-center gap-2">
                <BarChart3 size={14} className="text-ink/60" />
                <span className="text-xs font-mono text-ink/70">{tx("Lexical Density:")}</span>
                <span className="text-xs font-mono font-bold text-ink">{(evaluation.ml_metrics.lexical_density * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#589C80]/10 border border-[#589C80]/30 space-y-3">
                <h4 className="text-sm font-bold text-green-ink flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{tx("Key Core Strengths")}</span>
                </h4>
                <ul className="space-y-2">
                  {evaluation.strengths.map((s, idx) => (
                    <li key={idx} className="text-xs text-ink/90 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#589C80] mt-1.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <h4 className="text-sm font-bold text-amber-ink flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{tx("Areas for High-Impact Polish")}</span>
                </h4>
                <ul className="space-y-2">
                  {evaluation.weaknesses.map((w, idx) => (
                    <li key={idx} className="text-xs text-ink/90 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EBAE29] mt-1.5 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-line/40 pb-3">
                <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                  <BookOpen size={16} className="text-[#EBAE29]" />
                  <span>{tx("Sentence-Level Actionable Revision Viewer")}</span>
                </h4>
                <span className="text-xs font-mono text-ink/60">
                  {evaluation.sentence_improvements.length} {tx("recommendations")}
                </span>
              </div>

              {evaluation.sentence_improvements.length === 0 ? (
                <p className="text-xs text-ink/60 italic p-4 text-center">
                  {tx("No weak or cliché sentences detected. Syntactic ownership and cadence are well-balanced.")}
                </p>
              ) : (
                <div className="space-y-3">
                  {evaluation.sentence_improvements.map((item, idx) => {
                    const isExpanded = expandedIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl bg-black/5 dark:bg-white/5 border border-line transition-all overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                          className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-ink text-xs font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-medium text-ink truncate font-serif">
                              &ldquo;{item.original}&rdquo;
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-amber-500/15 text-amber-ink border border-amber-500/30 hidden sm:inline">
                              {item.issue.slice(0, 24)}...
                            </span>
                            {isExpanded ? <ChevronDown size={16} className="text-ink/60" /> : <ChevronRight size={16} className="text-ink/60" />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-4 pb-4 space-y-3 border-t border-line/30 pt-3"
                            >
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-ink font-mono">
                                <strong className="block mb-0.5 uppercase text-[10px] text-amber-600">{tx("Identified Issue:")}</strong>
                                {item.issue}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-serif">
                                  <span className="text-[10px] font-mono uppercase text-red-500/80 block not-italic mb-1 font-bold">
                                    {tx("Original Excerpt")}
                                  </span>
                                  &ldquo;{item.original}&rdquo;
                                </div>

                                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-600 font-serif">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-mono uppercase text-green-600/80 block not-italic font-bold">
                                      {tx("Recommended Active Revision")}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyText(item.suggested, `rev_${idx}`)}
                                      className="text-[10px] font-mono text-green-700 hover:underline flex items-center gap-1 cursor-pointer not-italic"
                                    >
                                      {copiedId === `rev_${idx}` ? <Check size={12} /> : <Copy size={12} />}
                                      <span>{copiedId === `rev_${idx}` ? tx("Copied") : tx("Copy")}</span>
                                    </button>
                                  </div>
                                  &ldquo;{item.suggested}&rdquo;
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

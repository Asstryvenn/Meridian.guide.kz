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
} from "lucide-react";
import { Meter } from "@/components/ui/progress";
import { useApp } from "@/lib/store/app-store";
import { useI18n } from "@/components/i18n/i18n-context";
import { useT } from "@/lib/i18n/use-t";
import {
  extractEssayCorpusMetrics,
  CORPUS_BENCHMARKS,
} from "@/lib/engine/essay-dataset-corpus";
import type {
  EssayEvaluationResult,
  SentenceImprovement,
  StructuralSectionFeedback,
} from "@/lib/types";

const SAMPLE_PROMPTS = [
  "Common App: Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.",
  "Common App: The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure.",
  "Supplemental: Why are you applying to our university, and how will our academic community support your intellectual aspirations?",
  "Supplemental: Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
];

export function EssayEvaluator() {
  const tx = useT();
  const { locale } = useI18n();
  const { applications } = useApp();

  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[0]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);
  const [targetUniversity, setTargetUniversity] = useState(
    applications[0]?.universitySlug ? applications[0].universitySlug.toUpperCase() : "Selective University"
  );
  const [essayText, setEssayText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<EssayEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "structure" | "sentences" | "corpus">("overview");

  const liveMetrics = useMemo(() => {
    return extractEssayCorpusMetrics(essayText);
  }, [essayText]);

  const activePromptText = isCustomPrompt ? customPrompt : prompt;

  async function handleEvaluate() {
    if (liveMetrics.wordCount < 40) {
      setError(tx("Please enter at least 40 words before evaluating."));
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

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto">
      <div className="p-6 rounded-3xl bg-panel/90 border border-[#589C80]/30 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-ink uppercase tracking-wider">
              <FileText size={14} className="text-[#EBAE29]" />
              <span>{tx("Essay Configuration & Calibration")}</span>
            </div>
            <h2 className="text-xl font-extrabold text-ink">
              {tx("Kaggle Corpus Trained Essay Evaluation")}
            </h2>
            <p className="text-xs text-ink/70">
              {tx("Calibrated against 1,002 admitted applicant essays for lexical richness, narrative progression, and clarity.")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-[11px] font-mono text-ink/60">{tx("Corpus Baseline")}</span>
              <span className="text-xs font-bold text-green-ink">{CORPUS_BENCHMARKS.totalEssays} {tx("Admitted Essays")}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-ink/80 block">
              {tx("Admissions Prompt")}
            </label>
            {!isCustomPrompt ? (
              <div className="relative">
                <select
                  value={prompt}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setIsCustomPrompt(true);
                    } else {
                      setPrompt(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-xs text-ink appearance-none pr-8 cursor-pointer focus:outline-none focus:border-[#589C80]"
                >
                  {SAMPLE_PROMPTS.map((p, idx) => (
                    <option key={idx} value={p} className="bg-panel text-ink">
                      {p.slice(0, 85)}...
                    </option>
                  ))}
                  <option value="__custom__" className="bg-panel text-amber-ink font-semibold">
                    {tx("+ Write custom prompt...")}
                  </option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3.5 pointer-events-none text-ink/60" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={tx("Enter custom essay prompt...")}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-[#589C80] text-xs text-ink focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomPrompt(false)}
                  className="text-[11px] text-amber-ink hover:underline cursor-pointer"
                >
                  {tx("← Choose from standard prompts")}
                </button>
              </div>
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
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-ink/80">
              {tx("Your Essay Draft")}
            </label>
            <div className="flex items-center gap-3 text-xs font-mono text-ink/70">
              <span>{liveMetrics.wordCount} {tx("words")}</span>
              <span>•</span>
              <span>{liveMetrics.sentenceCount} {tx("sentences")}</span>
              <span>•</span>
              <span className={clsx(liveMetrics.lexicalRichness >= 0.65 ? "text-green-ink font-bold" : "text-amber-ink")}>
                {tx("Lexical Richness:")} {(liveMetrics.lexicalRichness * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <textarea
            rows={12}
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder={tx("Paste or write your admissions essay draft here. Meridian Guide will evaluate narrative structure, tension, lexical diversity, and sentence-level polish...")}
            className="w-full p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line text-sm text-ink leading-relaxed font-sans focus:outline-none focus:border-[#589C80] resize-y"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-[11px] text-ink/60 font-mono">
            {tx("Evaluates against Content Value, Significance/Arc, Clarity/Voice, and Admissions Competitiveness.")}
          </p>

          <button
            type="button"
            onClick={handleEvaluate}
            disabled={isLoading || liveMetrics.wordCount < 30}
            className={clsx(
              "px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer",
              isLoading || liveMetrics.wordCount < 30
                ? "bg-line text-ink/40 cursor-not-allowed"
                : "bg-gradient-to-r from-[#EBAE29] via-[#589C80] to-[#EBAE29] bg-size-200 text-white hover:brightness-110 active:scale-95"
            )}
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{tx("Analyzing Against Corpus...")}</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>{tx("Evaluate Essay")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-3xl bg-panel border border-[#589C80]/40 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-line/40 pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#589C80]/20 text-green-ink border border-[#589C80]/40">
                  <Award size={13} />
                  <span>{tx("Admission Percentile:")} {tx("Top")} {100 - evaluation.percentile}%</span>
                </div>
                <h3 className="text-2xl font-extrabold text-ink">
                  {tx("Comprehensive Evaluation Report")}
                </h3>
                <p className="text-xs text-ink/80 max-w-xl leading-relaxed">
                  {evaluation.admissionsVerdict}
                </p>
              </div>

              <div className="flex items-center gap-4 self-center md:self-auto">
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line min-w-[110px]">
                  <span className="text-[11px] font-mono text-ink/60 uppercase">{tx("Overall Score")}</span>
                  <span className="text-3xl font-extrabold text-[#EBAE29]">{evaluation.overallScore}</span>
                  <span className="text-[10px] text-ink/50 font-mono">/ 100</span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line min-w-[110px]">
                  <span className="text-[11px] font-mono text-ink/60 uppercase">{tx("Corpus Standing")}</span>
                  <span className="text-3xl font-extrabold text-green-ink">{evaluation.percentile}th</span>
                  <span className="text-[10px] text-ink/50 font-mono">{tx("percentile")}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-ink/70">{tx("Content Depth")}</span>
                  <span className="text-sm font-bold text-ink">{evaluation.scores.contentDepth}</span>
                </div>
                <Meter
                  value={evaluation.scores.contentDepth}
                  tone={evaluation.scores.contentDepth >= 75 ? "green" : "amber"}
                  label={tx("Content Depth")}
                />
                <p className="text-[10px] text-ink/60 leading-tight">
                  {tx("Substance & intellectual authenticity")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-ink/70">{tx("Story Arc & Friction")}</span>
                  <span className="text-sm font-bold text-ink">{evaluation.scores.storyArc}</span>
                </div>
                <Meter
                  value={evaluation.scores.storyArc}
                  tone={evaluation.scores.storyArc >= 75 ? "green" : "amber"}
                  label={tx("Story Arc & Friction")}
                />
                <p className="text-[10px] text-ink/60 leading-tight">
                  {tx("Narrative crucible & personal stakes")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-ink/70">{tx("Clarity & Voice")}</span>
                  <span className="text-sm font-bold text-ink">{evaluation.scores.clarityTone}</span>
                </div>
                <Meter
                  value={evaluation.scores.clarityTone}
                  tone={evaluation.scores.clarityTone >= 75 ? "green" : "amber"}
                  label={tx("Clarity & Voice")}
                />
                <p className="text-[10px] text-ink/60 leading-tight">
                  {tx("Syntactic cadence & lexical vitality")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-ink/70">{tx("Competitiveness")}</span>
                  <span className="text-sm font-bold text-ink">{evaluation.scores.competitiveness}</span>
                </div>
                <Meter
                  value={evaluation.scores.competitiveness}
                  tone={evaluation.scores.competitiveness >= 75 ? "green" : "amber"}
                  label={tx("Competitiveness")}
                />
                <p className="text-[10px] text-ink/60 leading-tight">
                  {tx("Admissions committee distinctiveness")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-line/40 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={clsx(
                  "px-4 py-2 text-xs font-mono font-bold transition-all border-b-2 cursor-pointer",
                  activeTab === "overview"
                    ? "border-[#EBAE29] text-amber-ink"
                    : "border-transparent text-ink/60 hover:text-ink"
                )}
              >
                {tx("Strengths & Gaps")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("structure")}
                className={clsx(
                  "px-4 py-2 text-xs font-mono font-bold transition-all border-b-2 cursor-pointer",
                  activeTab === "structure"
                    ? "border-[#EBAE29] text-amber-ink"
                    : "border-transparent text-ink/60 hover:text-ink"
                )}
              >
                {tx("Structural Architecture")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sentences")}
                className={clsx(
                  "px-4 py-2 text-xs font-mono font-bold transition-all border-b-2 cursor-pointer",
                  activeTab === "sentences"
                    ? "border-[#EBAE29] text-amber-ink"
                    : "border-transparent text-ink/60 hover:text-ink"
                )}
              >
                {tx("Sentence Rewrites")} ({evaluation.sentenceImprovements.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("corpus")}
                className={clsx(
                  "px-4 py-2 text-xs font-mono font-bold transition-all border-b-2 cursor-pointer",
                  activeTab === "corpus"
                    ? "border-[#EBAE29] text-amber-ink"
                    : "border-transparent text-ink/60 hover:text-ink"
                )}
              >
                {tx("Kaggle Benchmarks")}
              </button>
            </div>

            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-[#589C80]/10 border border-[#589C80]/30 space-y-3">
                  <h4 className="text-sm font-bold text-green-ink flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{tx("Key Narrative Strengths")}</span>
                  </h4>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((str, idx) => (
                      <li key={idx} className="text-xs text-ink/90 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#589C80] mt-1.5 shrink-0" />
                        <span>{str}</span>
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
            )}

            {activeTab === "structure" && (
              <div className="space-y-4">
                {evaluation.structuralCritique.map((sec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                        <BookOpen size={15} className="text-[#EBAE29]" />
                        <span>{sec.sectionTitle}</span>
                      </h4>
                      <span
                        className={clsx(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                          sec.status === "excellent"
                            ? "bg-green-500/20 text-green-ink border border-green-500/30"
                            : sec.status === "strong"
                            ? "bg-[#589C80]/20 text-green-ink border border-[#589C80]/30"
                            : "bg-amber-500/20 text-amber-ink border border-amber-500/30"
                        )}
                      >
                        {sec.status === "excellent" ? tx("Excellent") : sec.status === "strong" ? tx("Strong") : tx("Needs Refinement")}
                      </span>
                    </div>
                    <p className="text-xs text-ink/80 leading-relaxed">{sec.analysis}</p>
                    <div className="p-3 rounded-xl bg-panel border border-[#589C80]/20 text-xs text-green-ink font-medium">
                      <strong className="text-ink font-bold block mb-0.5">{tx("Recommendation:")}</strong>
                      {sec.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "sentences" && (
              <div className="space-y-4">
                {evaluation.sentenceImprovements.length === 0 ? (
                  <p className="text-xs text-ink/60 italic p-4 text-center">
                    {tx("No sentence-level syntactic concerns identified. Your flow and cadence are well-balanced.")}
                  </p>
                ) : (
                  evaluation.sentenceImprovements.map((imp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-ink border border-amber-500/30">
                          {imp.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(imp.suggested, `imp_${idx}`)}
                          className="text-[11px] font-mono text-ink/60 hover:text-ink flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `imp_${idx}` ? <Check size={12} className="text-green-ink" /> : <Copy size={12} />}
                          <span>{copiedId === `imp_${idx}` ? tx("Copied") : tx("Copy Suggestion")}</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-serif">
                          <span className="text-[10px] font-mono font-bold uppercase text-red-500 block not-italic">
                            {tx("Original Draft")}
                          </span>
                          &ldquo;{imp.original}&rdquo;
                        </div>
                        <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-serif">
                          <span className="text-[10px] font-mono font-bold uppercase text-green-500 block not-italic">
                            {tx("Recommended Rewrite")}
                          </span>
                          &ldquo;{imp.suggested}&rdquo;
                        </div>
                      </div>

                      <p className="text-xs text-ink/70 leading-relaxed font-sans">
                        <strong className="text-ink font-semibold">{tx("Pedagogical Reason:")}</strong> {imp.reason}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "corpus" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-line space-y-3">
                  <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                    <BarChart3 size={15} className="text-[#EBAE29]" />
                    <span>{tx("Admissions Corpus Statistical Calibration (1,002 Essays)")}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-panel border border-line space-y-1">
                      <span className="text-[10px] font-mono text-ink/60 uppercase block">{tx("Lexical Richness")}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-ink">{(evaluation.metrics.lexicalRichness * 100).toFixed(1)}%</span>
                        <span className="text-[11px] font-mono text-ink/50">vs 64.8% {tx("mean")}</span>
                      </div>
                      <span className="text-[10px] text-green-ink block">{tx("Top 10% benchmark: > 82.1%")}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-panel border border-line space-y-1">
                      <span className="text-[10px] font-mono text-ink/60 uppercase block">{tx("Sentence Cadence")}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-ink">{evaluation.metrics.avgSentenceLength}</span>
                        <span className="text-[11px] font-mono text-ink/50">vs 9.2 {tx("words/sentence")}</span>
                      </div>
                      <span className="text-[10px] text-ink/60 block">{tx("Optimal range: 8.5 – 14.0 words")}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-panel border border-line space-y-1">
                      <span className="text-[10px] font-mono text-ink/60 uppercase block">{tx("Average Word Length")}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-ink">{evaluation.metrics.avgWordLength}</span>
                        <span className="text-[11px] font-mono text-ink/50">vs 6.6 {tx("chars/word")}</span>
                      </div>
                      <span className="text-[10px] text-ink/60 block">{tx("Indicates collegiate terminology")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

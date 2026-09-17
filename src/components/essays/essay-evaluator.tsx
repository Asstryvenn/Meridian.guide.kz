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
} from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useI18n } from "@/components/i18n/i18n-context";
import { useT } from "@/lib/i18n/use-t";
import {
  computeStage1MlMetrics,
  CORPUS_BENCHMARKS,
} from "@/lib/engine/essay-dataset-corpus";
import type {
  HybridEssayEvaluationResult,
  HybridSentenceImprovement,
} from "@/lib/types";

const SAMPLE_PROMPTS = [
  "Common App: Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.",
  "Common App: The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure.",
  "Supplemental: Why are you applying to our university, and how will our academic community support your intellectual aspirations?",
  "Supplemental: Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
];

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
  const { applications } = useApp();

  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[0]);
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

  const liveStage1Metrics = useMemo(() => {
    return computeStage1MlMetrics(essayText);
  }, [essayText]);

  const activePromptText = isCustomPrompt ? customPrompt : prompt;

  async function handleEvaluate() {
    if (liveStage1Metrics.word_count < 40) {
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
              {tx("Stage 1 executes quantitative ML feature extraction against 1,002 Kaggle admitted essays. Stage 2 applies an elite OpenAI supervisory review to validate narrative friction, cadence, and personal agency.")}
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
            placeholder={tx("Paste or write your admissions essay draft here. The ML model evaluates structural coherence and lexical density, followed by OpenAI supervisory calibration...")}
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
          <div className="flex items-center gap-2 text-xs font-mono text-ink/60">
            <Cpu size={14} className="text-[#589C80]" />
            <span>{tx("Two-Stage Validation: Kaggle ML Ingestion + OpenAI Review")}</span>
          </div>

          <button
            type="button"
            onClick={handleEvaluate}
            disabled={isLoading || liveStage1Metrics.word_count < 30}
            className={clsx(
              "px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center",
              isLoading || liveStage1Metrics.word_count < 30
                ? "bg-line text-ink/40 cursor-not-allowed"
                : "bg-gradient-to-r from-[#EBAE29] via-[#589C80] to-[#EBAE29] text-white hover:brightness-110 active:scale-95"
            )}
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{tx("Processing ML & OpenAI Pipeline...")}</span>
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

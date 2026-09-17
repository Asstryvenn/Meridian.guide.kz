"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Scale } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { ARCHETYPES, QUIZ_QUESTIONS, calculateArchetype } from "@/lib/data/archetype";
import type { ArchetypeId } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";

interface ArchetypeQuizProps {
  onComplete?: (archetypeId: ArchetypeId) => void;
  onClose?: () => void;
}

export function ArchetypeQuiz({ onComplete, onClose }: ArchetypeQuizProps) {
  const t = useT();
  const { setArchetype } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<ArchetypeId | null>(null);

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100);

  const handleSelectOption = (optionIndex: number) => {
    const updatedAnswers = { ...answers, [currentQuestion.id]: optionIndex };
    setAnswers(updatedAnswers);

    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const calculated = calculateArchetype(updatedAnswers);
      setResult(calculated);
      setArchetype(calculated);
      if (onComplete) {
        onComplete(calculated);
      }
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto p-6 rounded-2xl bg-panel/90 border border-[#589C80]/30 shadow-2xl backdrop-blur-xl text-ink">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border border-[#589C80]/40 text-ink/70 hover:text-ink hover:border-[#EBAE29] transition-all cursor-pointer"
        >
          
          {t("Close")}
        </button>
      )}

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-amber-ink">
                <span>{t("Question {index} of {count}", { index: currentIndex + 1, count: QUIZ_QUESTIONS.length })}</span>
                <span>{t("{percent}% complete", { percent: progressPercent })}</span>
              </div>
              <div className="w-full h-1.5 bg-panel rounded-full overflow-hidden border border-[#589C80]/20">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#589C80] to-[#EBAE29] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-ink leading-snug">
                {currentQuestion.question}
              </h3>
              <p className="text-sm text-ink/70">
                {currentQuestion.subtitle}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = answers[currentQuestion.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-[#589C80]/20 border-[#EBAE29] shadow-lg shadow-[#EBAE29]/10"
                        : "bg-panel/60 border-[#589C80]/25 hover:border-[#589C80]/60 hover:bg-[#589C80]/10"
                    }`}
                  >
                    <div className="font-medium text-ink text-base mb-1">
                      {option.label}
                    </div>
                    <div className="text-xs text-ink/70 leading-relaxed">
                      {option.detail}
                    </div>
                  </button>
                );
              })}
            </div>

            {currentIndex > 0 && (
              <div className="pt-2 flex justify-start">
                <button
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="text-xs text-green-ink hover:text-amber-ink transition-colors cursor-pointer"
                >
                  
                  {t("← Back to previous question")}
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-4"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#EBAE29]/20 border border-[#EBAE29]/50 text-amber-ink font-mono text-xs uppercase tracking-widest">
              {ARCHETYPES[result].badge}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-ink">
                {ARCHETYPES[result].title}
              </h2>
              <p className="text-sm font-medium text-green-ink">
                {ARCHETYPES[result].tagline}
              </p>
            </div>

            <p className="text-sm text-ink/80 leading-relaxed max-w-lg mx-auto">
              {ARCHETYPES[result].description}
            </p>

            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto pt-2">
              {ARCHETYPES[result].traits.map((trait, tIdx) => (
                <div key={tIdx} className="px-3 py-2 rounded-lg bg-[#589C80]/10 border border-[#589C80]/30 text-xs font-medium text-ink flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-ink shrink-0" />
                  <span>{trait}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-panel border border-[#589C80]/30 text-left space-y-3">
              <div className="text-xs font-bold text-amber-ink uppercase tracking-wider">
                
                {t("Recommended Extracurriculars")}
              </div>
              <ul className="space-y-2 text-xs text-ink/80">
                {ARCHETYPES[result].recommendedExtracurriculars.map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-2">
                    <Check size={14} className="text-green-ink shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
              <div className="text-xs font-bold text-green-ink uppercase tracking-wider pt-2">
                
                {t("Complementary Profile Balancers")}
              </div>
              <ul className="space-y-2 text-xs text-ink/80">
                {ARCHETYPES[result].complementaryExtracurriculars.map((comp, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2">
                    <Scale size={14} className="text-amber-ink shrink-0 mt-0.5" />
                    <span>{comp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-[#589C80]/40 text-xs text-ink hover:border-[#EBAE29] transition-all cursor-pointer"
              >
                
                {t("Retake Quiz")}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#589C80] to-[#EBAE29] text-xs font-bold text-on-accent shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  
                  {t("Apply to Matching Engine")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

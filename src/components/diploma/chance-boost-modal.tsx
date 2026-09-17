"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X, FileText, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { useApp } from "@/lib/store/app-store";
import { useI18n } from "@/components/i18n/i18n-context";
import { useRecommendations } from "@/lib/store/derived";
import type { ActivityCategory } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";

interface ChanceBoostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChanceBoostModal({ isOpen, onClose }: ChanceBoostModalProps) {
  const tx = useT();
  const { addAchievementBoost } = useApp();
  const { list } = useRecommendations();
  const { t } = useI18n();

  const [step, setStep] = useState<"upload" | "celebrate">("upload");
  const [awardTitle, setAwardTitle] = useState("");
  const [category, setCategory] = useState<ActivityCategory>("Olympiad");
  const [boostAmount, setBoostAmount] = useState<number>(4.8);
  const [targetUniName, setTargetUniName] = useState("Stanford University");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const topMatchUni = list[0]?.university?.name || tx("Harvard University");

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.55 },
        colors: ["#EBAE29", "#589C80", "#F5EED2", "#FFFFFF"],
      });
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardTitle.trim()) return;

    const baseBoost = category === "Olympiad" ? 6.4 : category === "Research" ? 5.8 : 4.2;
    const computed = Number((baseBoost + Math.random() * 1.8).toFixed(1));

    setBoostAmount(computed);
    setTargetUniName(topMatchUni);

    addAchievementBoost(awardTitle.trim(), category, computed);

    setStep("celebrate");
    triggerConfetti();
  };

  const handleClose = () => {
    setStep("upload");
    setAwardTitle("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {step === "upload" ? (
          <motion.div
            key="upload-modal"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg p-6 rounded-3xl bg-panel border border-[#589C80]/40 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#589C80]/20">
              <div className="flex items-center gap-2.5">
                <Award size={20} className="text-amber-ink" />
                <h3 className="text-base font-bold text-ink">
                  {t.diplomaModal.uploadDiploma}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg text-ink/50 hover:text-ink hover:bg-ink/5 cursor-pointer"
                aria-label={tx("Close")}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-ink/70 uppercase">
                  
                  {tx("Diploma or Award Title")}
                </label>
                <input
                  type="text"
                  required
                  value={awardTitle}
                  onChange={(e) => setAwardTitle(e.target.value)}
                  placeholder={tx("e.g. 1st Place National Hackathon / IBO Silver Medal")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-panel border border-[#589C80]/30 text-xs text-ink focus:outline-none focus:border-[#EBAE29]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-ink/70 uppercase">
                  
                  {tx("Achievement Category")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-panel border border-[#589C80]/30 text-xs text-ink focus:outline-none focus:border-[#EBAE29] cursor-pointer"
                >
                  <option value="Olympiad">{tx("Olympiad / Academic Competition")}</option>
                  <option value="Research">{tx("Research Paper / Publication")}</option>
                  <option value="Competition">{tx("Hackathon / Case Competition")}</option>
                  <option value="Project">{tx("Engineering / Software Project")}</option>
                  <option value="Leadership">{tx("Student Leadership Initiative")}</option>
                  <option value="Award">{tx("Merit Award / Grant")}</option>
                </select>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-2xl border-2 border-dashed border-[#589C80]/30 hover:border-[#EBAE29] bg-panel/60 transition-all cursor-pointer text-center space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <div className="flex justify-center">
                  <FileText size={32} className="text-green-ink" />
                </div>
                <p className="text-xs font-semibold text-ink">
                  
                  {tx("Attach scanned certificate or verification link")}
                </p>
                <p className="text-[10px] font-mono text-green-ink">
                  
                  {tx("PDF, PNG, JPG (verified through portfolio engine)")}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-mono border border-[#589C80]/30 text-ink/70 hover:text-ink cursor-pointer"
                >
                  
                  {tx("Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-[#589C80] to-[#EBAE29] text-on-accent hover:brightness-110 shadow-lg cursor-pointer"
                >
                  
                  {tx("Verify Achievement")}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="celebrate-modal"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md p-8 rounded-3xl bg-panel border-2 border-[#EBAE29] shadow-2xl text-center space-y-5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#EBAE29]/10 to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 rounded-full bg-[#EBAE29]/20 absolute"
              />
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#589C80] to-[#EBAE29] flex items-center justify-center text-on-accent shadow-xl shadow-[#EBAE29]/30 relative z-10">
                <Sparkles size={28} />
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-[#EBAE29]/20 text-amber-ink border border-[#EBAE29]/40">
                {t.diplomaModal.heading}
              </span>

              <h3 className="text-xl font-extrabold text-ink leading-tight">
                
                {tx("Admission Probability Boosted")}
              </h3>

              <div className="p-4 rounded-2xl bg-panel/90 border border-[#589C80]/30 space-y-1">
                <p className="text-xs text-ink/70">
                  {t.diplomaModal.boostText} <span className="font-bold text-ink">{targetUniName}</span>:
                </p>
                <p className="text-3xl font-extrabold font-mono text-amber-ink">
                  +{boostAmount}%
                </p>
              </div>

              <p className="text-xs font-mono text-green-ink">
                
                {tx("+450 XP awarded to your applicant profile")}
              </p>
            </div>

            <div className="pt-2 relative z-10">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-2xl font-mono text-xs font-bold bg-[#EBAE29] text-on-accent hover:bg-[#EBAE29]/90 shadow-xl shadow-[#EBAE29]/20 transition-all cursor-pointer"
              >
                {t.diplomaModal.claimReward}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n/use-t";
import { MascotCompanion } from "@/components/companion/mascot-companion";
import { AiAssistantDrawer } from "@/components/mentor/ai-assistant-drawer";
import { VoiceMentorModal } from "@/components/mentor/VoiceMentorModal";
import { PomodoroDockButton } from "@/components/ui/pomodoro-timer";

export function FloatingDock() {
  const t = useT();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-3 z-50 pointer-events-none select-none">
        <MascotCompanion embedded />

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAssistantOpen((prev) => !prev)}
            aria-label={t("AI Assistant")}
            title={t("AI Assistant")}
            aria-expanded={assistantOpen}
            className="group relative inline-flex items-center gap-2 h-10 px-3.5 rounded-full border border-neutral-200/90 dark:border-white/[0.12] bg-white/90 hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-800 text-neutral-800 dark:text-white shadow-lg dark:shadow-xl backdrop-blur-md transition-all duration-200 ease-out hover:scale-[1.03] hover:border-amber-400/60 dark:hover:border-amber-400/50 cursor-pointer select-none"
          >
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <Sparkles size={16} className="text-amber-500 dark:text-amber-400 group-hover:rotate-12 transition-transform duration-200 ease-out" />
            <span className="text-xs font-semibold tracking-tight">{t("AI Assistant")}</span>
          </button>

          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            aria-label={t("Voice Admissions Mentor")}
            title={t("Voice Admissions Mentor")}
            className="w-10 h-10 rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-lg dark:shadow-xl backdrop-blur-md flex items-center justify-center transition-all duration-200 ease-out hover:scale-[1.05] hover:border-emerald-300 dark:hover:border-emerald-500/40 cursor-pointer select-none"
          >
            <Mic size={17} />
          </button>
        </div>

        <div className="bottom-0 pointer-events-auto flex items-center">
          <PomodoroDockButton />
        </div>
      </div>

      <AiAssistantDrawer
        isOpen={assistantOpen}
        onOpenChange={setAssistantOpen}
        hideTrigger
      />

      <VoiceMentorModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
      />
    </>
  );
}

export default FloatingDock;

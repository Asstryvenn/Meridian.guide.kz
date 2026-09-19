"use client";

import { useState } from "react";
import { Mic, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n/use-t";
import { MascotCompanion } from "@/components/companion/mascot-companion";
import { AiAssistantDrawer } from "@/components/mentor/ai-assistant-drawer";
import { VoiceMentorModal } from "@/components/mentor/VoiceMentorModal";

export function FloatingDock() {
  const t = useT();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-3 z-50 pointer-events-none">
        <MascotCompanion embedded />

        <div className="bottom-0 pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAssistantOpen((prev) => !prev)}
            aria-label={t("AI Assistant")}
            title={t("AI Assistant")}
            aria-expanded={assistantOpen}
            className="group relative inline-flex items-center gap-2 h-11 px-4 rounded-full border border-white/[0.12] bg-neutral-900/90 hover:bg-neutral-800 text-white shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:border-amber-400/50 cursor-pointer select-none"
          >
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <Sparkles size={16} className="text-amber-400 group-hover:rotate-12 transition-transform duration-200" />
            <span className="text-xs font-semibold tracking-tight">{t("AI Assistant")}</span>
          </button>

          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            aria-label={t("Voice Admissions Mentor")}
            title={t("Voice Admissions Mentor")}
            className="w-11 h-11 rounded-full border border-white/[0.12] bg-neutral-900/90 hover:bg-neutral-800 text-emerald-400 shadow-xl backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-[1.05] hover:border-emerald-400/50 cursor-pointer select-none"
          >
            <Mic size={17} />
          </button>
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

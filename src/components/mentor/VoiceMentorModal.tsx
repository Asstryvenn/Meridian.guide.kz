"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Sparkles, Volume2, X } from "lucide-react";
import { useT } from "@/lib/i18n/use-t";

interface VoiceMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_VOICE_TOPICS = [
  "Simulate an Ivy League interview question",
  "Critique my personal statement narrative spike",
  "What extracurriculars should I focus on this month?",
  "How can I maximize international financial aid?",
];

export function VoiceMentorModal({ isOpen, onClose }: VoiceMentorModalProps) {
  const t = useT();
  const [isListening, setIsListening] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Tap mic to start voice session");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsListening(false);
    setAudioVolume(0);
  }, []);

  const handleClose = useCallback(() => {
    cleanupAudio();
    onClose();
  }, [cleanupAudio, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  const startListening = async () => {
    try {
      cleanupAudio();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMetrics = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setAudioVolume(Math.min(100, Math.round((average / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateMetrics);
        };

        updateMetrics();
      }

      setIsListening(true);
      setStatusMessage("Listening... Speak naturally with your admissions mentor");
    } catch {
      cleanupAudio();
      setStatusMessage("Microphone permission was denied or unavailable");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      cleanupAudio();
      setStatusMessage("Session paused. Tap mic to resume");
    } else {
      startListening();
    }
  };

  const handleSelectTopic = (topic: string) => {
    setActiveTopic(topic);
    setStatusMessage(`Prompt active: "${topic}"`);
    if (!isListening) {
      startListening();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200/90 dark:border-white/[0.08] bg-white/95 dark:bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-xl text-neutral-900 dark:text-white"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label={t("Close")}
              className="absolute top-5 right-5 p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100/80 hover:bg-neutral-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.1] border border-neutral-200 dark:border-white/[0.08] transition-all duration-200 group focus:outline-none"
            >
              <X size={18} className="hover:rotate-90 transition-transform duration-200" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                  {t("Voice Admissions Mentor")}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t("Real-time conversational strategy & interview practice")}
                </p>
              </div>
            </div>

            <div className="my-8 flex flex-col items-center justify-center gap-6">
              <div className="relative flex items-center justify-center">
                {isListening && (
                  <motion.div
                    className="absolute w-32 h-32 rounded-full bg-emerald-500/15"
                    animate={{
                      scale: [1, 1.15 + (audioVolume / 100) * 0.35, 1],
                      opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={toggleListening}
                  aria-label={isListening ? "Mute microphone" : "Unmute microphone"}
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border ${
                    isListening
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30 scale-105"
                      : "bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 border-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-neutral-200 dark:border-white/[0.1]"
                  }`}
                >
                  {isListening ? <Mic size={30} /> : <MicOff size={30} className="text-neutral-400" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 h-8">
                {Array.from({ length: 12 }).map((_, index) => {
                  const barHeight = isListening
                    ? Math.max(6, Math.min(32, (audioVolume / 100) * 32 * (0.4 + (index % 5) * 0.15)))
                    : 4;

                  return (
                    <motion.span
                      key={index}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isListening ? "bg-emerald-400" : "bg-neutral-300 dark:bg-white/20"
                      }`}
                      animate={{ height: `${barHeight}px` }}
                    />
                  );
                })}
              </div>

              <div className="text-center px-4">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{statusMessage}</p>
                {activeTopic && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1 italic">
                    {activeTopic}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200/80 dark:border-white/[0.06]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-2.5">
                {t("Suggested prompts")}
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_VOICE_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleSelectTopic(topic)}
                    className="text-xs text-left px-3 py-1.5 rounded-lg bg-neutral-100/80 hover:bg-neutral-200/80 border border-neutral-200/80 hover:border-emerald-500/40 text-neutral-700 hover:text-neutral-900 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] dark:border-white/[0.06] dark:hover:border-emerald-500/30 dark:text-neutral-300 dark:hover:text-white transition-all duration-200"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Volume2 size={13} className="text-neutral-400" />
                {t("Audio stream encrypted")}
              </span>
              <span>{t("Press Esc or click outside to dismiss")}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VoiceMentorModal;

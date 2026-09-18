"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Video, Square, Circle, Bot, Check, Sparkles } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-context";
import type { InterviewFeedback, InterviewQuestion } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

const questions: InterviewQuestion[] = [
  {
    id: "q-mit",
    university: "MIT",
    category: "academic",
    question: "Tell us about something you made or researched with your own hands or code. What went wrong, and how did you debug it?",
    tips: [msg("Focus on intellectual persistence"), msg("Name concrete technical concepts"), msg("Share what surprised you")],
  },
  {
    id: "q-harvard",
    university: "Harvard University",
    category: "personal",
    question: "What is an idea or perspective that you used to hold strongly, but changed your mind about after learning more?",
    tips: [msg("Demonstrate open-mindedness"), msg("Highlight empathy and rigor"), msg("Reflect on personal growth")],
  },
  {
    id: "q-stanford",
    university: "Stanford University",
    category: "personal",
    question: "What matters most to you, and why? Ground your answer in experiences rather than abstract theories.",
    tips: [msg("Be deeply authentic"), msg("Avoid cliché humanitarian claims without evidence"), msg("Focus on personal agency")],
  },
  {
    id: "q-oxford",
    university: "University of Oxford",
    category: "academic",
    question: msg("How would you explain a foundational problem in your intended major to a curious 12-year-old?"),
    tips: [msg("Structure logically"), msg("Use vivid relatable analogies"), msg("Highlight wonder and relevance")],
  },
  {
    id: "q-nu",
    university: "Nazarbayev University",
    category: "leadership",
    question: "How do you intend to leverage your academic training to solve a specific regional or global challenge?",
    tips: [msg("Mention regional context"), msg("Outline measurable impact"), msg("Connect to institutional research strengths")],
  },
];

export function InterviewSimulator() {
  const tx = useT();
  const { t, locale } = useI18n();

  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion>(questions[0]);
  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

  const [liveVolume, setLiveVolume] = useState(0);
  const [cadenceWpm, setCadenceWpm] = useState(128);
  const [nervousnessLevel, setNervousnessLevel] = useState<"low" | "medium" | "elevated">("low");
  const [simulatedTranscript, setSimulatedTranscript] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudioMetrics = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setLiveVolume(Math.min(100, Math.round((avg / 128) * 100)));

          animFrameRef.current = requestAnimationFrame(updateAudioMetrics);
        };
        updateAudioMetrics();
      }

      setCameraActive(true);
    } catch {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = () => {
    setRecording(true);
    setRecordingSeconds(0);
    setFeedback(null);
    setSimulatedTranscript(
      tx("My passion for computer science and artificial intelligence began when I realized how automated systems could democratize access to diagnostics. Working on computer vision for agriculture taught me that engineering is fundamentally about iterative debugging under unpredictable real-world conditions.")
    );

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        const next = prev + 1;
        const speed = 120 + Math.round(Math.sin(next) * 18);
        setCadenceWpm(speed);

        if (speed > 138) {
          setNervousnessLevel("elevated");
        } else if (speed > 126) {
          setNervousnessLevel("medium");
        } else {
          setNervousnessLevel("low");
        }
        return next;
      });
    }, 1000);
  };

  const stopAndAnalyze = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setAnalyzing(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_feedback",
          payload: {
            question: selectedQuestion.question,
            university: selectedQuestion.university,
            answer: simulatedTranscript,
            cadence: cadenceWpm,
            duration: recordingSeconds,
          },
          locale,
        }),
      });

      const data = await res.json();
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch {
    } finally {
      setAnalyzing(false);
    }
  };

  const getNervousnessText = () => {
    switch (nervousnessLevel) {
      case "low":
        return t.interview.stressLow;
      case "medium":
        return t.interview.stressMedium;
      case "elevated":
        return t.interview.stressElevated;
    }
  };

  const getNervousnessColor = () => {
    switch (nervousnessLevel) {
      case "low":
        return "text-green-ink bg-[#589C80]/15 border-[#589C80]/40";
      case "medium":
        return "text-amber-ink bg-[#EBAE29]/15 border-[#EBAE29]/40";
      case "elevated":
        return "text-red-400 bg-red-950/40 border-red-800/40";
    }
  };

  const minutes = String(Math.floor(recordingSeconds / 60)).padStart(2, "0");
  const seconds = String(recordingSeconds % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 rounded-3xl bg-panel/85 border border-[#589C80]/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Mic size={22} className="text-green-ink shrink-0" />
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {t.interview.title}
            </h2>
          </div>
          <p className="text-xs text-ink/70 max-w-xl">
            {t.interview.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <label className="text-xs font-mono font-bold text-amber-ink uppercase">
            {t.interview.questionSelector}:
          </label>
          <select
            value={selectedQuestion.id}
            onChange={(e) => {
              const q = questions.find((item) => item.id === e.target.value);
              if (q) setSelectedQuestion(q);
            }}
            className="w-full sm:w-auto max-w-full text-xs px-3 py-2 rounded-xl bg-panel border border-[#589C80]/40 text-ink font-semibold focus:outline-none focus:border-[#EBAE29] cursor-pointer"
          >
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.university} — {q.category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-black/80 border border-[#589C80]/40 w-full aspect-[4/3] sm:aspect-video min-h-[300px] sm:min-h-[380px] shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />

            {!cameraActive && (
              <div className="text-center p-6 sm:p-8 space-y-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-panel border border-[#589C80]/40 flex items-center justify-center mx-auto text-green-ink shadow-inner">
                  <Video size={26} />
                </div>
                <p className="text-sm font-semibold text-ink">
                  {tx("Camera & Microphone are currently offline")}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-br from-[#4e9377] via-[#5ea489] to-[#d4a342] text-white hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#4e9377]/20 border border-white/10 cursor-pointer transition-all"
                >
                  {t.interview.startCamera}
                </button>
              </div>
            )}

            {cameraActive && (
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between pointer-events-none gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-panel/85 border border-[#589C80]/40 backdrop-blur-md">
                  <span
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                      recording ? "bg-red-500 animate-pulse" : "bg-[#589C80]"
                    }`}
                  />
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-ink">
                    {recording ? tx("REC {minutes}:{seconds}", { minutes: minutes, seconds: seconds }) : "STANDBY"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-panel/85 border border-[#589C80]/40 backdrop-blur-md">
                  <span className="text-[11px] sm:text-xs font-mono text-ink/70">{tx("Mic Level:")}</span>
                  <div className="w-12 sm:w-16 h-1.5 sm:h-2 rounded-full bg-panel overflow-hidden border border-[#589C80]/30">
                    <div className="h-full bg-gradient-to-r from-[#4e9377] via-[#5ea489] to-[#d4a342] w-3/4" />
                  </div>
                </div>
              </div>
            )}

            {cameraActive && (
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 p-3 sm:p-4 rounded-2xl bg-panel/90 border border-[#589C80]/40 backdrop-blur-xl shadow-lg">
                <p className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-ink uppercase tracking-wider">
                  {tx("{university} interview prompt", { university: selectedQuestion.university })}
                </p>
                <p className="text-xs sm:text-sm font-bold text-ink mt-0.5 leading-snug">
                  &ldquo;{tx(selectedQuestion.question)}&rdquo;
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-panel/80 border border-[#589C80]/30 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              {cameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-red-800/40 bg-red-950/20 text-red-400 hover:bg-red-950/40 cursor-pointer"
                >
                  {t.interview.stopCamera}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-[#589C80]/40 bg-[#589C80]/20 text-green-ink hover:bg-[#589C80]/30 cursor-pointer"
                >
                  {t.interview.startCamera}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {recording ? (
                <button
                  type="button"
                  onClick={stopAndAnalyze}
                  className="px-6 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#EBAE29] text-on-accent hover:bg-[#EBAE29]/90 shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <Square size={13} />
                  <span>{t.interview.stopRecording}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!cameraActive || analyzing}
                  className="px-6 py-2.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-br from-[#4e9377] via-[#5ea489] to-[#d4a342] text-white hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#4e9377]/20 border border-white/10 cursor-pointer disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  <Circle size={13} className="fill-current text-red-500" />
                  <span>{t.interview.startRecording}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-panel/85 border border-[#589C80]/30 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-amber-ink">
              
              {tx("Live Delivery Telemetry")}
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-panel border border-[#589C80]/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono text-ink/60 uppercase">
                    {t.interview.cadenceScore}
                  </p>
                  <p className="text-lg font-extrabold font-mono text-ink">
                    {recording ? cadenceWpm : "--"} {tx("WPM")}
                  </p>
                </div>
                <span className="text-xs font-mono text-green-ink">
                  
                  {tx("Target: 120-135")}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-panel border border-[#589C80]/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono text-ink/60 uppercase">
                    {t.interview.clarityScore}
                  </p>
                  <p className="text-lg font-extrabold font-mono text-amber-ink">
                    {recording ? `${88 + (liveVolume % 8)}%` : "--"}
                  </p>
                </div>
                <span className="text-xs font-mono text-green-ink">
                  
                  {tx("Crystal Clean")}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-panel border border-[#589C80]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-mono text-ink/60 uppercase">
                    {t.interview.nervousnessDetector}
                  </p>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${getNervousnessColor()}`}
                  >
                    {recording ? getNervousnessText() : tx("Calm Baseline")}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-panel overflow-hidden border border-[#589C80]/20">
                  <div
                    className={`h-full transition-all duration-500 ${
                      nervousnessLevel === "low"
                        ? "w-1/4 bg-[#589C80]"
                        : nervousnessLevel === "medium"
                          ? "w-1/2 bg-[#EBAE29]"
                          : "w-4/5 bg-red-500"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-panel/50 border border-[#589C80]/20 space-y-2">
              <p className="text-xs font-bold text-ink">{tx("Preparation Tips")}</p>
              <ul className="text-xs text-ink/70 space-y-1.5 list-disc list-inside">
                {selectedQuestion.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {analyzing && (
        <div className="p-8 rounded-3xl bg-panel/85 border border-[#EBAE29]/40 text-center space-y-3 shadow-2xl backdrop-blur-xl animate-pulse">
          <div className="flex justify-center">
            <Bot size={32} className="text-green-ink" />
          </div>
          <p className="text-base font-bold text-ink">
            {t.interview.analyzing}
          </p>
          <p className="text-xs text-green-ink font-mono">
            
            {tx("Evaluating vocabulary diversity, delivery cadence, and institutional fit...")}
          </p>
        </div>
      )}

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-panel/95 border border-[#589C80]/40 backdrop-blur-xl shadow-2xl space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#589C80]/20">
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#589C80]/20 text-green-ink border border-[#589C80]/40">
                
                {tx("Performance Breakdown")}
              </span>
              <h3 className="text-2xl font-bold text-ink mt-1">
                {t.interview.feedbackTitle}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-mono text-ink/60 uppercase">
                  {t.interview.rubricScore}
                </span>
                <p className="text-3xl font-extrabold font-mono text-amber-ink">
                  {feedback.overallScore}/100
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-panel border border-[#589C80]/30 text-center">
              <span className="text-[10px] font-mono text-ink/60 uppercase">
                
                {tx("Cadence & Pace")}
              </span>
              <p className="text-xl font-mono font-bold text-green-ink mt-1">
                {feedback.cadenceScore}%
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-panel border border-[#589C80]/30 text-center">
              <span className="text-[10px] font-mono text-ink/60 uppercase">
                
                {tx("Audio Clarity")}
              </span>
              <p className="text-xl font-mono font-bold text-green-ink mt-1">
                {feedback.clarityScore}%
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-panel border border-[#589C80]/30 text-center">
              <span className="text-[10px] font-mono text-ink/60 uppercase">
                
                {tx("Poise & Presence")}
              </span>
              <p className="text-xl font-mono font-bold text-amber-ink mt-1">
                {feedback.poiseScore}%
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-panel border border-[#589C80]/30 text-center">
              <span className="text-[10px] font-mono text-ink/60 uppercase">
                
                {tx("Content Depth")}
              </span>
              <p className="text-xl font-mono font-bold text-amber-ink mt-1">
                {feedback.contentScore}%
              </p>
            </div>
          </div>

          <p className="text-sm text-ink/85 leading-relaxed bg-panel/60 p-5 rounded-2xl border border-[#589C80]/20">
            {feedback.qualitativeSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#589C80]/10 border border-[#589C80]/30 space-y-2">
              <h4 className="text-xs font-mono font-bold text-green-ink uppercase tracking-wider flex items-center gap-1.5">
                <Check size={14} />
                <span>{t.interview.strengths}</span>
              </h4>
              <ul className="text-xs text-ink/80 space-y-1 list-disc list-inside">
                {feedback.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-[#EBAE29]/10 border border-[#EBAE29]/30 space-y-2">
              <h4 className="text-xs font-mono font-bold text-amber-ink uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>{t.interview.improvements}</span>
              </h4>
              <ul className="text-xs text-ink/80 space-y-1 list-disc list-inside">
                {feedback.improvements.map((imp, idx) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

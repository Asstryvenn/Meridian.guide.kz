"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/components/i18n/i18n-context";
import type { InterviewFeedback, InterviewQuestion } from "@/lib/types";

const questions: InterviewQuestion[] = [
  {
    id: "q-mit",
    university: "MIT",
    category: "academic",
    question: "Tell us about something you made or researched with your own hands or code. What went wrong, and how did you debug it?",
    tips: ["Focus on intellectual persistence", "Name concrete technical concepts", "Share what surprised you"],
  },
  {
    id: "q-harvard",
    university: "Harvard University",
    category: "personal",
    question: "What is an idea or perspective that you used to hold strongly, but changed your mind about after learning more?",
    tips: ["Demonstrate open-mindedness", "Highlight empathy and rigor", "Reflect on personal growth"],
  },
  {
    id: "q-stanford",
    university: "Stanford University",
    category: "personal",
    question: "What matters most to you, and why? Ground your answer in experiences rather than abstract theories.",
    tips: ["Be deeply authentic", "Avoid cliché humanitarian claims without evidence", "Focus on personal agency"],
  },
  {
    id: "q-oxford",
    university: "University of Oxford",
    category: "academic",
    question: "How would you explain a foundational problem in your intended major to a curious 12-year-old?",
    tips: ["Structure logically", "Use vivid relatable analogies", "Highlight wonder and relevance"],
  },
  {
    id: "q-nu",
    university: "Nazarbayev University",
    category: "leadership",
    question: "How do you intend to leverage your academic training to solve a specific regional or global challenge?",
    tips: ["Mention regional context", "Outline measurable impact", "Connect to institutional research strengths"],
  },
];

export function InterviewSimulator() {
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
  const analyserRef = useRef<AnalyserNode | null>(null);
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

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

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
      "My passion for computer science and artificial intelligence began when I realized how automated systems could democratize access to diagnostics. Working on computer vision for agriculture taught me that engineering is fundamentally about iterative debugging under unpredictable real-world conditions."
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
        return "text-[#589C80] bg-[#589C80]/15 border-[#589C80]/40";
      case "medium":
        return "text-[#EBAE29] bg-[#EBAE29]/15 border-[#EBAE29]/40";
      case "elevated":
        return "text-red-400 bg-red-950/40 border-red-800/40";
    }
  };

  const minutes = String(Math.floor(recordingSeconds / 60)).padStart(2, "0");
  const seconds = String(recordingSeconds % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#132228]/85 border border-[#589C80]/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎙️</span>
            <h2 className="text-xl font-bold tracking-tight text-[#F5EED2]">
              {t.interview.title}
            </h2>
          </div>
          <p className="text-xs text-[#F5EED2]/70 max-w-xl">
            {t.interview.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-mono font-bold text-[#EBAE29] uppercase">
            {t.interview.questionSelector}:
          </label>
          <select
            value={selectedQuestion.id}
            onChange={(e) => {
              const q = questions.find((item) => item.id === e.target.value);
              if (q) setSelectedQuestion(q);
            }}
            className="text-xs px-3 py-2 rounded-xl bg-[#132228] border border-[#589C80]/40 text-[#F5EED2] font-semibold focus:outline-none focus:border-[#EBAE29] cursor-pointer"
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
          <div className="relative rounded-3xl overflow-hidden bg-black/80 border border-[#589C80]/40 aspect-video shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />

            {!cameraActive && (
              <div className="text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#132228] border border-[#589C80]/40 flex items-center justify-center mx-auto text-2xl shadow-inner">
                  📹
                </div>
                <p className="text-sm font-semibold text-[#F5EED2]">
                  Camera & Microphone are currently offline
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-[#589C80] to-[#EBAE29] text-[#132228] hover:brightness-110 shadow-lg cursor-pointer"
                >
                  {t.interview.startCamera}
                </button>
              </div>
            )}

            {cameraActive && (
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#132228]/85 border border-[#589C80]/40 backdrop-blur-md">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      recording ? "bg-red-500 animate-pulse" : "bg-[#589C80]"
                    }`}
                  />
                  <span className="text-xs font-mono font-bold text-[#F5EED2]">
                    {recording ? `REC ${minutes}:${seconds}` : "STANDBY"}
                  </span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#132228]/85 border border-[#589C80]/40 backdrop-blur-md">
                  <span className="text-xs font-mono text-[#F5EED2]/70">Mic Level:</span>
                  <div className="w-16 h-2 rounded-full bg-[#132228] overflow-hidden border border-[#589C80]/30">
                    <div className="h-full bg-gradient-to-r from-[#589C80] to-[#EBAE29] w-3/4" />
                  </div>
                </div>
              </div>
            )}

            {cameraActive && (
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#132228]/90 border border-[#589C80]/40 backdrop-blur-xl shadow-lg">
                <p className="text-[11px] font-mono font-bold text-[#EBAE29] uppercase tracking-wider">
                  {selectedQuestion.university} Interview Prompt
                </p>
                <p className="text-sm font-bold text-[#F5EED2] mt-0.5 leading-snug">
                  &ldquo;{selectedQuestion.question}&rdquo;
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#132228]/80 border border-[#589C80]/30 backdrop-blur-xl">
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
                  className="px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-[#589C80]/40 bg-[#589C80]/20 text-[#589C80] hover:bg-[#589C80]/30 cursor-pointer"
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
                  className="px-6 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#EBAE29] text-[#132228] hover:bg-[#EBAE29]/90 shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <span>⏹</span>
                  <span>{t.interview.stopRecording}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!cameraActive || analyzing}
                  className="px-6 py-2.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-[#589C80] to-[#EBAE29] text-[#132228] hover:brightness-110 shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <span>⏺</span>
                  <span>{t.interview.startRecording}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-[#132228]/85 border border-[#589C80]/30 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#EBAE29]">
              Live Delivery Telemetry
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#132228] border border-[#589C80]/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono text-[#F5EED2]/60 uppercase">
                    {t.interview.cadenceScore}
                  </p>
                  <p className="text-lg font-extrabold font-mono text-[#F5EED2]">
                    {recording ? cadenceWpm : "--"} WPM
                  </p>
                </div>
                <span className="text-xs font-mono text-[#589C80]">
                  Target: 120-135
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#132228] border border-[#589C80]/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono text-[#F5EED2]/60 uppercase">
                    {t.interview.clarityScore}
                  </p>
                  <p className="text-lg font-extrabold font-mono text-[#EBAE29]">
                    {recording ? `${88 + (liveVolume % 8)}%` : "--"}
                  </p>
                </div>
                <span className="text-xs font-mono text-[#589C80]">
                  Crystal Clean
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#132228] border border-[#589C80]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-mono text-[#F5EED2]/60 uppercase">
                    {t.interview.nervousnessDetector}
                  </p>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${getNervousnessColor()}`}
                  >
                    {recording ? getNervousnessText() : "Calm Baseline"}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#132228] overflow-hidden border border-[#589C80]/20">
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

            <div className="p-4 rounded-2xl bg-[#132228]/50 border border-[#589C80]/20 space-y-2">
              <p className="text-xs font-bold text-[#F5EED2]">Preparation Tips</p>
              <ul className="text-xs text-[#F5EED2]/70 space-y-1.5 list-disc list-inside">
                {selectedQuestion.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {analyzing && (
        <div className="p-8 rounded-3xl bg-[#132228]/85 border border-[#EBAE29]/40 text-center space-y-3 shadow-2xl backdrop-blur-xl animate-pulse">
          <span className="text-3xl">🤖</span>
          <p className="text-base font-bold text-[#F5EED2]">
            {t.interview.analyzing}
          </p>
          <p className="text-xs text-[#589C80] font-mono">
            Evaluating vocabulary diversity, delivery cadence, and institutional fit...
          </p>
        </div>
      )}

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-[#132228]/95 border border-[#589C80]/40 backdrop-blur-xl shadow-2xl space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#589C80]/20">
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#589C80]/20 text-[#589C80] border border-[#589C80]/40">
                Performance Breakdown
              </span>
              <h3 className="text-2xl font-bold text-[#F5EED2] mt-1">
                {t.interview.feedbackTitle}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-mono text-[#F5EED2]/60 uppercase">
                  {t.interview.rubricScore}
                </span>
                <p className="text-3xl font-extrabold font-mono text-[#EBAE29]">
                  {feedback.overallScore}/100
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#132228] border border-[#589C80]/30 text-center">
              <span className="text-[10px] font-mono text-[#F5EED2]/60 uppercase">
                Cadence & Pace
              </span>
              <p className="text-xl font-mono font-bold text-[#589C80] mt-1">
                {feedback.cadenceScore}%
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#132228] border border-[#589C80]/30 text-center">
              <span className="text-[10px] font-mono text-[#F5EED2]/60 uppercase">
                Audio Clarity
              </span>
              <p className="text-xl font-mono font-bold text-[#589C80] mt-1">
                {feedback.clarityScore}%
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#132228] border border-[#589C80]/30 text-center">
              <span className="text-[10px] font-mono text-[#F5EED2]/60 uppercase">
                Poise & Presence
              </span>
              <p className="text-xl font-mono font-bold text-[#EBAE29] mt-1">
                {feedback.poiseScore}%
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#132228] border border-[#589C80]/30 text-center">
              <span className="text-[10px] font-mono text-[#F5EED2]/60 uppercase">
                Content Depth
              </span>
              <p className="text-xl font-mono font-bold text-[#EBAE29] mt-1">
                {feedback.contentScore}%
              </p>
            </div>
          </div>

          <p className="text-sm text-[#F5EED2]/85 leading-relaxed bg-[#132228]/60 p-5 rounded-2xl border border-[#589C80]/20">
            {feedback.qualitativeSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#589C80]/10 border border-[#589C80]/30 space-y-2">
              <h4 className="text-xs font-mono font-bold text-[#589C80] uppercase tracking-wider flex items-center gap-1.5">
                <span>✓</span>
                <span>{t.interview.strengths}</span>
              </h4>
              <ul className="text-xs text-[#F5EED2]/80 space-y-1 list-disc list-inside">
                {feedback.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-[#EBAE29]/10 border border-[#EBAE29]/30 space-y-2">
              <h4 className="text-xs font-mono font-bold text-[#EBAE29] uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span>
                <span>{t.interview.improvements}</span>
              </h4>
              <ul className="text-xs text-[#F5EED2]/80 space-y-1 list-disc list-inside">
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

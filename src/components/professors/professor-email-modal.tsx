"use client";

import { useState } from "react";
import { Check, Copy, Mail, RefreshCw, Send, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import type { Professor, StudentProfile } from "@/lib/types";
import styles from "./professor-email-modal.module.css";

interface ProfessorEmailModalProps {
  professor: Professor;
  universityName: string;
  profile: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
}

type OutreachGoal = "research_internship" | "lab_discussion" | "independent_study" | "paper_inquiry";

const GOALS: { id: OutreachGoal; label: string }[] = [
  { id: "research_internship", label: "Research Internship" },
  { id: "lab_discussion", label: "Lab Discussion" },
  { id: "independent_study", label: "Independent Study" },
  { id: "paper_inquiry", label: "Recent Paper Inquiry" },
];

export function ProfessorEmailModal({
  professor,
  universityName,
  profile,
  isOpen,
  onClose,
}: ProfessorEmailModalProps) {
  const [goal, setGoal] = useState<OutreachGoal>("research_internship");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const customKey = typeof window !== "undefined" ? localStorage.getItem("meridian_openai_api_key") || "" : "";
      const res = await fetch("/api/ai/cold-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customKey ? { "x-openai-key": customKey } : {}),
        },
        body: JSON.stringify({
          professorName: professor.name,
          professorEmail: professor.email,
          professorDepartment: professor.department,
          professorAreas: professor.areas,
          universityName,
          studentName: profile.fullName || "Prospective Student",
          studentCountry: profile.country || "International",
          studentGrade: profile.grade || 11,
          studentArchetype: profile.archetype || "researcher",
          studentFields: profile.fields,
          studentInterests: profile.interestsNote,
          outreachGoal: goal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to generate email");
      }

      setSubject(data.subject);
      setBody(data.body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to AI service");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(professor.email)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>AI Professor Outreach Drafter</h2>
            <p className={styles.subtitle}>
              Personalized cold email tailored to professor's research and your applicant spike
            </p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.profInfo}>
            <div className={styles.profAvatar}>{professor.name.charAt(0)}</div>
            <div className={styles.profMeta}>
              <span className={styles.profName}>{professor.name}</span>
              <span className="text-xs text-ink/70">
                {professor.department} · {universityName}
              </span>
              <span className={styles.profEmail}>{professor.email}</span>
            </div>
          </div>

          <div>
            <p className={styles.sectionLabel}>Outreach Objective</p>
            <div className={styles.goalsGrid}>
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={clsx(styles.goalButton, goal === g.id && styles.goalButtonActive)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          {body ? (
            <div className={styles.emailArea}>
              <p className={styles.sectionLabel}>Subject Line</p>
              <input
                className={styles.subjectInput}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <p className={styles.sectionLabel}>Email Body</p>
              <textarea
                className={styles.bodyTextarea}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#589C80]/20 text-green-ink flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Ready to Compose Cold Email</p>
                <p className="text-xs text-ink/70 max-w-sm mt-1">
                  Our AI analyzes Prof. {professor.name}&apos;s lab areas (
                  {professor.areas.slice(0, 3).join(", ")}) and your student spike to generate an
                  impactful email.
                </p>
              </div>
              <Button onClick={handleGenerate} disabled={loading} className="mt-2">
                <Sparkles size={14} />
                <span>{loading ? "Drafting with OpenAI…" : "Generate Cold Email"}</span>
              </Button>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div className="text-xs text-ink/60">
            {professor.email ? `Target: ${professor.email}` : "Email missing"}
          </div>
          <div className={styles.actions}>
            {body && (
              <>
                <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={loading}>
                  <RefreshCw size={13} className={clsx(loading && "animate-spin")} />
                  <span>Regenerate</span>
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCopy}>
                  {copied ? <Check size={13} className="text-green-ink" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy Email"}</span>
                </Button>
                <Button size="sm" onClick={handleOpenClient}>
                  <Send size={13} />
                  <span>Send via Mail</span>
                </Button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { LifeBuoy, Bug, HelpCircle, MessageSquare, X, CheckCircle2, Send, Loader2 } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useT } from "@/lib/i18n/use-t";
import styles from "./tech-support-modal.module.css";

export type SupportType = "ticket" | "bug" | "inquiry";

interface TechSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: SupportType;
}

export function TechSupportModal({ isOpen, onClose, defaultType = "ticket" }: TechSupportModalProps) {
  const t = useT();
  const { user } = useApp();
  const [type, setType] = useState<SupportType>(defaultType);
  const [email, setEmail] = useState(() => (user?.email ? user.email : ""));
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError(t("Please provide a valid email address."));
      return;
    }
    if (!subject.trim() || subject.trim().length < 3) {
      setError(t("Please enter a subject with at least 3 characters."));
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setError(t("Please enter a detailed message (minimum 10 characters)."));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          email: email.trim(),
          name: name.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          priority,
          metadata: {
            page: typeof window !== "undefined" ? window.location.pathname : "",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          },
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to submit request.");
      }

      setTicketId(data.ticketId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setTicketId(null);
    setSubject("");
    setMessage("");
    setError(null);
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.iconWrap}>
              <LifeBuoy size={20} />
            </div>
            <div>
              <h2 className={styles.title}>{t("Technical Support")}</h2>
              <p className={styles.subtitle}>{t("Submit a ticket, bug report, or direct inquiry")}</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("Close")}>
            <X size={18} />
          </button>
        </div>

        {ticketId ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={28} />
            </div>
            <h3 className={styles.title}>{t("Request Received")}</h3>
            <p className={styles.subtitle}>
              {t("Thank you. Your inquiry has been logged into our support queue.")}
            </p>
            <div className={styles.ticketBadge}>
              <span>{t("Reference")}:</span>
              <span>{ticketId}</span>
            </div>
            <button type="button" className={styles.submitBtn} onClick={handleReset}>
              {t("Done")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.body}>
              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.typeSelector} role="radiogroup" aria-label={t("Request Type")}>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${type === "ticket" ? styles.typeBtnActive : ""}`}
                  onClick={() => setType("ticket")}
                >
                  <MessageSquare size={14} />
                  <span>{t("Ticket")}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${type === "bug" ? styles.typeBtnActive : ""}`}
                  onClick={() => setType("bug")}
                >
                  <Bug size={14} />
                  <span>{t("Bug")}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${type === "inquiry" ? styles.typeBtnActive : ""}`}
                  onClick={() => setType("inquiry")}
                >
                  <HelpCircle size={14} />
                  <span>{t("Inquiry")}</span>
                </button>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t("Your Email")}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@meridian.kz"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t("Your Name")}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("Optional")}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t("Subject")}</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={type === "bug" ? t("Describe the issue briefly") : t("Summary of your inquiry")}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t("Priority")}</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "low" | "normal" | "high" | "urgent")}
                    className={styles.select}
                  >
                    <option value="low">{t("Low")}</option>
                    <option value="normal">{t("Normal")}</option>
                    <option value="high">{t("High")}</option>
                    <option value="urgent">{t("Urgent")}</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t("Description & Details")}</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === "bug"
                      ? t("Please describe what happened, steps to reproduce, and your device/browser.")
                      : t("How can our engineering and admissions support team assist you?")
                  }
                  className={styles.textarea}
                />
              </div>
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                {t("Cancel")}
              </button>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>{t("Submitting...")}</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>{t("Submit Request")}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function TechSupportTrigger({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button type="button" onClick={onClick} className={styles.triggerBtn} title={t("Tech Support & Inquiries")}>
      <LifeBuoy size={14} />
      <span className="hidden sm:inline">{t("Support")}</span>
    </button>
  );
}

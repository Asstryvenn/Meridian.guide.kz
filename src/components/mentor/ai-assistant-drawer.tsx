"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { useApp } from "@/lib/store/app-store";
import { useRoadmap } from "@/lib/store/derived";
import { useLocale, useT } from "@/lib/i18n/use-t";
import styles from "./ai-assistant-drawer.module.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestionPrompts = [
  "What are my real chances at my top matches?",
  "What should I focus on this month?",
  "Which scholarships should I apply for?",
  "Which deadlines are coming up?",
];

export function AiAssistantDrawer() {
  const t = useT();
  const locale = useLocale();
  const { profile, applications, completedTasks } = useApp();
  const { next } = useRoadmap();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: t("Hello! I am your AI Admissions Assistant. Ask me anything about university match chances, essay strategies, deadlines, or test requirements."),
    },
  ]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: trimmed };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const payload = {
        profile,
        applications,
        completedTasks,
        nextTask: next,
        locale,
        messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
      };

      const response = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to send message");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantId = `assistant-${Date.now()}`;

      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        const currentText = assistantText;
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantId ? { ...msg, content: currentText } : msg)),
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: t("I ran into an issue connecting to the admissions model. Please try asking again in a moment."),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handlePromptClick(promptText: string) {
    sendMessage(t(promptText));
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.fab} ${isOpen ? styles.fabActive : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t("AI Assistant")}
        title={t("AI Assistant")}
        aria-expanded={isOpen}
      >
        <span className={styles.fabBadge} />
        <Icon name="spark" size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              className={styles.scrim}
              onClick={() => setIsOpen(false)}
              aria-label={t("Close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className={styles.drawer}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              aria-label={t("AI Assistant")}
            >
              <header className={styles.header}>
                <div className={styles.headerTitle}>
                  <div className={styles.headerIcon}>
                    <Icon name="spark" size={18} />
                  </div>
                  <div>
                    <h2 className={styles.titleText}>{t("AI Assistant")}</h2>
                    <div className={styles.statusPill}>
                      <span className={styles.statusDot} />
                      <span>{t("Admissions Intelligence")}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setIsOpen(false)}
                  aria-label={t("Close")}
                >
                  <Icon name="close" size={16} />
                </button>
              </header>

              <div className={styles.body}>
                <div className={styles.suggestions}>
                  <span className={styles.suggestionsLabel}>{t("Recommended questions")}</span>
                  <div className={styles.chipList}>
                    {suggestionPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className={styles.promptChip}
                        onClick={() => handlePromptClick(prompt)}
                      >
                        {t(prompt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.messages}>
                  {messages.map((msg) => {
                    const isUser = msg.role === "user";
                    const hasNextAction = /^(next action|следующий шаг|келесі қадам):/i.test(msg.content.trim());
                    const cleanContent = msg.content.replace(/^(next action|следующий шаг|келесі қадам):\s*/i, "");

                    return (
                      <div
                        key={msg.id}
                        className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}
                      >
                        <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
                          {cleanContent || (loading && msg.role === "assistant" ? "..." : "")}
                        </div>
                        {hasNextAction && (
                          <div className={styles.nextActionCallout}>
                            <strong>{t("Next action")}: </strong>
                            {cleanContent}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {loading && (
                    <div className={styles.typingIndicator}>
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              </div>

              <form className={styles.inputForm} onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  className={styles.inputField}
                  placeholder={t("Ask anything about admissions, roadmaps, or essays...")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className={styles.sendButton}
                  disabled={loading || !input.trim()}
                  aria-label={t("Send")}
                >
                  <Icon name="arrow" size={16} />
                </button>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

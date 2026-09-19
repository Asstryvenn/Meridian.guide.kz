"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Plus, Trash2, X, Send, Sparkles, Menu, RotateCcw, KeyRound, Mic } from "lucide-react";
import { useApp } from "@/lib/store/app-store";
import { useRoadmap } from "@/lib/store/derived";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { VoiceMentorModal } from "./VoiceMentorModal";
import styles from "./ai-assistant-drawer.module.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = "meridian:ai_sessions";

const suggestionPrompts = [
  "What are my real chances at my top matches?",
  "What should I focus on this month?",
  "Which scholarships should I apply for?",
  "Which deadlines are coming up?",
];

function createDefaultSession(greeting: string): ChatSession {
  return {
    id: `session-${Date.now()}`,
    title: "New admissions chat",
    createdAt: Date.now(),
    messages: [
      {
        id: "welcome",
        role: "assistant",
        content: greeting,
      },
    ],
  };
}

interface AiAssistantDrawerProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function AiAssistantDrawer({
  isOpen: controlledIsOpen,
  onOpenChange,
  hideTrigger = false,
}: AiAssistantDrawerProps = {}) {
  const t = useT();
  const locale = useLocale();
  const { profile, applications, completedTasks } = useApp();
  const { next } = useRoadmap();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  const setIsOpen = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      setInternalOpen((current) => {
        const nextVal = typeof val === "function" ? val(current) : val;
        onOpenChange?.(nextVal);
        return nextVal;
      });
    },
    [onOpenChange]
  );
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const defaultGreeting = t("Hello! I am your AI Admissions Assistant powered by GPT-4o. Ask me anything about university match chances, essay strategies, deadlines, or test requirements.");

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window === "undefined") return [createDefaultSession(defaultGreeting)];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [createDefaultSession(defaultGreeting)];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || `session-${Date.now()}`;
  });

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || createDefaultSession(defaultGreeting);
  const messages = currentSession.messages;

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("meridian_openai_api_key") || "";
  });
  const [keySaved, setKeySaved] = useState(false);

  function handleSaveKey() {
    if (typeof window !== "undefined") {
      if (customApiKey.trim()) {
        localStorage.setItem("meridian_openai_api_key", customApiKey.trim());
        setKeySaved(true);
        setTimeout(() => setKeySaved(false), 2000);
      } else {
        localStorage.removeItem("meridian_openai_api_key");
      }
    }
  }

  function handleClearKey() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("meridian_openai_api_key");
      setCustomApiKey("");
      setKeySaved(false);
    }
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      textareaRef.current?.focus();
    }
  }, [isOpen, messages]);

  function adjustTextareaHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function createNewChat() {
    const newSession = createDefaultSession(defaultGreeting);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setSidebarOpen(false);
    setInput("");
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fallback = createDefaultSession(defaultGreeting);
        setActiveSessionId(fallback.id);
        return [fallback];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: trimmed };
      const updatedMessages = [...messages, userMsg];

      const currentTitle =
        currentSession.title === "New admissions chat" || currentSession.title === t("New admissions chat")
          ? trimmed.slice(0, 36) + (trimmed.length > 36 ? "..." : "")
          : currentSession.title;

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? { ...s, title: currentTitle, messages: updatedMessages }
            : s
        )
      );

      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setLoading(true);

      try {
        const payload = {
          profile,
          applications,
          completedTasks,
          nextTask: next,
          locale,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        };

        const customKey = typeof window !== "undefined" ? localStorage.getItem("meridian_openai_api_key") || "" : "";
        const response = await fetch("/api/mentor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(customKey ? { "x-openai-key": customKey } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
          const errJson = await response.json().catch(() => null);
          const detail = errJson?.message || errJson?.error;
          throw new Error(detail || "Failed to connect to admissions model");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        const assistantId = `assistant-${Date.now()}`;

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSession.id
              ? { ...s, messages: [...updatedMessages, { id: assistantId, role: "assistant", content: "" }] }
              : s
          )
        );

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
          const snapshot = assistantText;
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSession.id
                ? {
                    ...s,
                    messages: s.messages.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m)),
                  }
                : s
            )
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        const isMissingKey = msg.includes("OPENAI_KEY_MISSING") || /key|billing|quota/i.test(msg);
        const displayContent = isMissingKey
          ? t("OpenAI API key is missing or invalid. Please configure OPENAI_API_KEY in Vercel Project Settings > Environment Variables, or enter your API key using the Key button at the top.")
          : (msg || t("I ran into an issue connecting to the admissions model. Please try asking again in a moment."));

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSession.id
              ? {
                  ...s,
                  messages: [
                    ...s.messages,
                    {
                      id: `err-${Date.now()}`,
                      role: "assistant",
                      content: displayContent,
                    },
                  ],
                }
              : s
          )
        );
        if (isMissingKey) setShowKeyConfig(true);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, currentSession, t, profile, applications, completedTasks, next, locale]
  );

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          className={`${styles.fab} ${isOpen ? styles.fabActive : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={t("AI Assistant")}
          title={t("AI Assistant")}
          aria-expanded={isOpen}
        >
          <span className={styles.fabBadge} />
          <Sparkles size={18} />
          <span className={styles.fabLabel}>{t("AI Assistant")}</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/70 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={styles.fullscreenOverlay}
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
          {sidebarOpen && (
            <div
              className={styles.sidebarOverlay}
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
            <div className={styles.sidebarHeader}>
              <button type="button" className={styles.newChatBtn} onClick={createNewChat}>
                <Plus size={16} />
                <span>{t("New Chat")}</span>
              </button>
            </div>

            <div className={styles.sessionList}>
              {sessions.map((sess) => (
                <button
                  key={sess.id}
                  type="button"
                  onClick={() => {
                    setActiveSessionId(sess.id);
                    setSidebarOpen(false);
                  }}
                  className={`${styles.sessionItem} ${sess.id === currentSession.id ? styles.sessionActive : ""}`}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span className={styles.sessionTitle}>{sess.title}</span>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      className={styles.sessionDelete}
                      onClick={(e) => deleteSession(sess.id, e)}
                      title={t("Delete session")}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </button>
              ))}
            </div>

            <div className={styles.sidebarFooter}>
              <span>{profile.fullName || t("Student")}</span>
              <span className="tabular font-mono opacity-60">GPA {profile.gpa ?? "—"}</span>
            </div>
          </aside>

          <main className={styles.mainWorkspace}>
            <header className={styles.workspaceHeader}>
              <div className={styles.headerLeft}>
                <button
                  type="button"
                  className={`${styles.iconBtn} md:hidden`}
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  aria-label={t("Toggle chat history")}
                >
                  <Menu size={16} />
                </button>
                <div>
                  <h2 className={styles.headerTitle}>{currentSession.title}</h2>
                </div>
                <div className={styles.modelBadge}>
                  <span className={styles.statusDot} />
                  <span>GPT-4o Admissions AI</span>
                </div>
              </div>

              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setVoiceModalOpen(true)}
                  title={t("Voice Admissions Mentor")}
                  aria-label={t("Voice Admissions Mentor")}
                >
                  <Mic size={16} />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setShowKeyConfig((prev) => !prev)}
                  title={t("OpenAI API Key Configuration")}
                >
                  <KeyRound size={16} />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={createNewChat}
                  title={t("New Chat")}
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-full text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] transition-all duration-200 group focus:outline-none"
                  onClick={() => setIsOpen(false)}
                  aria-label={t("Close")}
                >
                  <X size={18} className="hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </header>

            {showKeyConfig && (
              <div className={styles.keyBanner}>
                <div className={styles.keyHeader}>
                  <span className={styles.keyTitle}>
                    <KeyRound size={14} />
                    {t("OpenAI API Key Configuration")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKeyConfig(false)}
                    className={styles.iconBtn}
                    aria-label={t("Close")}
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className={styles.keyDescription}>
                  {t("For Vercel production: set OPENAI_API_KEY in Vercel Project Settings > Environment Variables and redeploy. You can also paste your personal OpenAI key directly below:")}
                </p>
                <div className={styles.keyForm}>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className={styles.keyInput}
                  />
                  <button type="button" onClick={handleSaveKey} className={styles.keySaveBtn}>
                    {keySaved ? t("Saved!") : t("Save Key")}
                  </button>
                  {customApiKey && (
                    <button type="button" onClick={handleClearKey} className={styles.keyClearBtn}>
                      {t("Clear")}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className={styles.messagesArea}>
              <div className={styles.threadContainer}>
                {messages.length <= 1 && (
                  <div className={styles.welcomeState}>
                    <div className={styles.welcomeIcon}>
                      <Sparkles size={28} />
                    </div>
                    <h3 className={styles.welcomeTitle}>{t("Admissions Intelligence Workspace")}</h3>
                    <p className={styles.welcomeSubtitle}>
                      {t("Ask complex questions regarding university admission chances, strategy, essays, and deadlines.")}
                    </p>
                    <div className={styles.promptsGrid}>
                      {suggestionPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          className={styles.promptCard}
                          onClick={() => sendMessage(t(prompt))}
                        >
                          {t(prompt)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  const hasNextAction = /^(next action|следующий шаг|келесі қадам):/i.test(msg.content.trim());
                  const cleanContent = msg.content.replace(new RegExp("^(next action|следующий шаг|келесі қадам):\\s*", "i"), "");

                  return (
                    <div
                      key={msg.id}
                      className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}
                    >
                      {!isUser && (
                        <div className={styles.messageAvatar}>
                          <Sparkles size={16} />
                        </div>
                      )}
                      <div className={isUser ? styles.userBubble : styles.assistantBubble}>
                        <div className="whitespace-pre-wrap">{cleanContent || (loading && msg.role === "assistant" ? "..." : "")}</div>
                        {hasNextAction && (
                          <div className={styles.nextActionBox}>
                            <strong>{t("Next action")}: </strong>
                            {cleanContent}
                          </div>
                        )}
                      </div>
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

            <footer className={styles.inputSection}>
              <div className={styles.inputWrap}>
                <form
                  className={styles.inputBox}
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    sendMessage(input);
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      adjustTextareaHeight();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t("Ask anything about admissions, roadmaps, or essays...")}
                    disabled={loading}
                    className={styles.textarea}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className={styles.sendBtn}
                    aria-label={t("Send")}
                  >
                    <Send size={16} />
                  </button>
                </form>
                <p className={styles.disclaimer}>
                  {t("AI admissions advice is tailored to your profile. Always verify with official university admissions.")}
                </p>
              </div>
            </footer>
          </main>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <VoiceMentorModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />
    </>
  );
}

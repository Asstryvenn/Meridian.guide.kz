"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { HeartHandshake, MessageSquare, Leaf } from "lucide-react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useApp } from "@/lib/store/app-store";
import { useRoadmap } from "@/lib/store/derived";
import styles from "./mentor-chat.module.css";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { msg } from "@/lib/i18n/catalog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "rules";
}

const suggestions = [
  msg("What are my real chances at my top matches?"),
  msg("What should I focus on this month?"),
  msg("Which scholarships should I apply for?"),
  msg("Which deadlines are coming up?"),
  msg("How can I strengthen my weakest area?"),
];

function MessageBody({ content }: { content: string }) {
  const t = useT();
  const blocks = content.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (/^(next action|следующий шаг|келесі қадам):/i.test(block.trim())) {
          return (
            <p key={i} className={styles.nextAction}>
              <span>{t("Next action")}</span>
              {block.trim().replace(/^(next action|следующий шаг|келесі қадам):\s*/i, "")}
            </p>
          );
        }
        if (lines.every((l) => /^\s*([•\-*]|\d+\.)\s+/.test(l) || !l.trim())) {
          return (
            <ul key={i} className={styles.list}>
              {lines.filter((l) => l.trim()).map((l, j) => (
                <li key={j}>{l.replace(/^\s*([•\-*]|\d+\.)\s+/, "").replace(/\*\*/g, "")}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className={styles.paragraph}>
            {block.replace(/\*\*/g, "").replace(/^#+\s*/gm, "")}
          </p>
        );
      })}
    </>
  );
}

export function MentorChat() {
  const t = useT();
  const locale = useLocale();
  const { profile, applications, completedTasks } = useApp();
  const { next } = useRoadmap();
  const params = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [supportMode, setSupportMode] = useState(false);
  const [showStressBanner, setShowStressBanner] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const checkStressKeywords = (text: string) => {
    const keywords = ["tired", t("burned out"), "scared", "overwhelmed", "anxious", "stressed", "exhausted", "panic", "depressed"];
    const lower = text.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (!supportMode && checkStressKeywords(val)) {
      setShowStressBanner(true);
    }
  };

  const send = useCallback(
    async (text: string, overrideSupport?: boolean) => {
      const question = text.trim();
      if (!question || streaming) return;

      const activeSupport = overrideSupport !== undefined ? overrideSupport : supportMode;
      const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: question };
      const assistantId = crypto.randomUUID();
      const history = [...messages, userMessage];
      setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
      setInput("");
      setStreaming(true);
      setNotice(null);

      try {
        const response = await fetch("/api/ai/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            profile,
            applications,
            completedTasks,
            supportMode: activeSupport,
            messages: history.slice(-20).map(({ role, content }) => ({ role, content })),
          }),
        });
        if (!response.ok || !response.body) throw new Error("Mentor unavailable");
        const source = response.headers.get("X-Guidance-Source") === "ai" ? "ai" : "rules";
        const headerNotice = response.headers.get("X-Guidance-Notice");
        if (headerNotice) setNotice(decodeURIComponent(headerNotice));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let content = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content, source } : m)));
        }
      } catch {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: t("I couldn't reach the mentor service. Please try again in a moment."), source: "rules" } : m)));
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, profile, applications, completedTasks, supportMode, locale],
  );

  useEffect(() => {
    const ask = params.get("ask");
    if (ask && !asked.current) {
      asked.current = true;
      send(ask);
    }
  }, [params, send]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  const enableSupportMode = () => {
    setSupportMode(true);
    setShowStressBanner(false);
  };

  return (
    <Page>
      <PageHeader
        eyebrow={t("AI mentor")}
        title={supportMode ? t("AI Mental Health Counselor (Support / Vent Mode)") : t("Ask anything about your applications")}
        description={
          supportMode
            ? t("Empathetic, judgment-free psychological support mode focused on emotional grounding and stress validation.")
            : t("The mentor sees your profile, diagnostics, matches, deadlines and roadmap. It will not invent statistics.")
        }
        actions={
          <Button
            variant={supportMode ? "primary" : "secondary"}
            onClick={() => setSupportMode((prev) => !prev)}
            className="cursor-pointer"
          >
            {supportMode ? (
              <span className="inline-flex items-center gap-1.5">
                <HeartHandshake size={15} /> {t("Support Mode Active")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare size={15} /> {t("Switch to Support / Vent Mode")}
              </span>
            )}
          </Button>
        }
      />

      <div className={styles.layout}>
        <Reveal className={styles.chatWrap}>
          <section className={`glass ${styles.chat}`} aria-live="polite">
            <div className={styles.messages}>
              {messages.length === 0 && (
                <div className={styles.intro}>
                  <p className={styles.introTitle}>Hi{profile.fullName ? ` ${profile.fullName.split(" ")[0]}` : ""} — where should we start?</p>
                  <div className={styles.suggestions}>
                    {suggestions.map((s) => (
                      <button key={s} type="button" className={styles.suggestion} onClick={() => send(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    className={clsx(styles.message, m.role === "user" ? styles.user : styles.assistant)}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  >
                    {m.role === "assistant" && m.source && <DataTag kind={m.source} label={m.source === "ai" ? t("AI mentor") : t("Rule-based guidance")} />}
                    {m.content ? <MessageBody content={m.content} /> : <span className={styles.typing} aria-label={t("Mentor is typing")}><i /><i /><i /></span>}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={endRef} />
            </div>
            {showStressBanner && !supportMode && (
              <div className="p-3 mx-4 my-2 rounded-xl bg-[#589C80]/20 border border-[#589C80] flex items-center justify-between gap-3 text-xs text-ink">
                <span className="inline-flex items-center gap-2">
                  <Leaf size={14} className="text-green-ink shrink-0" />
                  {t("You sound a bit overwhelmed. Would you like to switch to Support / Vent Mode for empathetic CBT guidance?")}
                </span>
                <button
                  type="button"
                  onClick={enableSupportMode}
                  className="px-3 py-1 rounded-lg bg-[#589C80] text-on-accent font-bold hover:bg-[#589C80]/90 transition-all cursor-pointer flex-shrink-0"
                >
                  
                  {t("Switch to Support Mode")}
                </button>
              </div>
            )}
            {notice && <p className={styles.notice}>{notice}</p>}
            <form className={styles.composer} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={input}
                onChange={handleInputChange}
                placeholder={supportMode ? t("Express what's on your mind... we're here to listen.") : t("Ask about chances, essays, scholarships, deadlines…")}
                aria-label={t("Message the mentor")}
                disabled={streaming}
              />
              <Button type="submit" size="md" disabled={streaming || !input.trim()} aria-label={t("Send")}>
                <Icon name="send" size={16} />
              </Button>
            </form>
          </section>
        </Reveal>

        <Reveal>
          <Card className={styles.side}>
            <p className="eyebrow">{t("Your next action")}</p>
            {next ? (
              <>
                <p className={styles.sideTitle}>{next.task.title}</p>
                <p className="muted">{next.reason}</p>
                <Button variant="secondary" size="sm" onClick={() => send(t("Help me with my next action: {title}", { title: next.task.title }))} disabled={streaming}>
                  
                  {t("Get help with this")}
                </Button>
              </>
            ) : (
              <p className="muted">{t("You're up to date. Add universities to generate new steps.")}</p>
            )}
          </Card>
        </Reveal>
      </div>
    </Page>
  );
}

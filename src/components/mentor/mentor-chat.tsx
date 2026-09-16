"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useApp } from "@/lib/store/app-store";
import { useRoadmap } from "@/lib/store/derived";
import styles from "./mentor-chat.module.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "rules";
}

const suggestions = ["What are my real chances at my top matches?", "What should I focus on this month?", "Which scholarships should I apply for?", "Which deadlines are coming up?", "How can I strengthen my weakest area?"];

function MessageBody({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (/^next action:/i.test(block.trim())) {
          return (
            <p key={i} className={styles.nextAction}>
              <span>Next action</span>
              {block.trim().replace(/^next action:\s*/i, "")}
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
  const { profile, applications, completedTasks } = useApp();
  const { next } = useRoadmap();
  const params = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || streaming) return;
      const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: question };
      const assistantId = crypto.randomUUID();
      const history = [...messages, userMessage];
      setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
      setInput("");
      setStreaming(true);
      setNotice(null);

      try {
        const response = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile,
            applications,
            completedTasks,
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
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: "I couldn't reach the mentor service. Please try again in a moment.", source: "rules" } : m)));
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, profile, applications, completedTasks],
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

  return (
    <Page>
      <PageHeader eyebrow="AI mentor" title="Ask anything about your applications" description="The mentor sees your profile, diagnostics, matches, deadlines and roadmap. It will not invent statistics." />

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
                    {m.role === "assistant" && m.source && <DataTag kind={m.source} label={m.source === "ai" ? "AI mentor · Claude" : "Rule-based guidance"} />}
                    {m.content ? <MessageBody content={m.content} /> : <span className={styles.typing} aria-label="Mentor is typing"><i /><i /><i /></span>}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={endRef} />
            </div>
            {notice && <p className={styles.notice}>{notice}</p>}
            <form className={styles.composer} onSubmit={onSubmit}>
              <input className={styles.input} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about chances, essays, scholarships, deadlines…" aria-label="Message the mentor" disabled={streaming} />
              <Button type="submit" size="md" disabled={streaming || !input.trim()} aria-label="Send">
                <Icon name="send" size={16} />
              </Button>
            </form>
          </section>
        </Reveal>

        <Reveal>
          <Card className={styles.side}>
            <p className="eyebrow">Your next action</p>
            {next ? (
              <>
                <p className={styles.sideTitle}>{next.task.title}</p>
                <p className="muted">{next.reason}</p>
                <Button variant="secondary" size="sm" onClick={() => send(`Help me with my next action: ${next.task.title}`)} disabled={streaming}>
                  Get help with this
                </Button>
              </>
            ) : (
              <p className="muted">You&apos;re up to date. Add universities to generate new steps.</p>
            )}
          </Card>
        </Reveal>
      </div>
    </Page>
  );
}

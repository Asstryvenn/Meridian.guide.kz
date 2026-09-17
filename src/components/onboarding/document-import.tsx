"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { ACCEPTED_IMPORT_TYPES, MAX_IMPORT_BYTES, type ImportResult } from "@/lib/ai/import-schema";
import { applyImport, type ImportChange } from "@/lib/engine/import";
import type { StudentProfile } from "@/lib/types";
import styles from "./document-import.module.css";
import { useT } from "@/lib/i18n/use-t";

type Phase = { kind: "idle" } | { kind: "reading"; name: string } | { kind: "review"; result: ImportResult; changes: ImportChange[]; next: StudentProfile } | { kind: "error"; message: string };

export function DocumentImport({ profile, onApply }: { profile: StudentProfile; onApply: (profile: StudentProfile) => void }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const { notify } = useToast();

  async function upload(file: File) {
    if (!ACCEPTED_IMPORT_TYPES.includes(file.type)) return setPhase({ kind: "error", message: t("Use a PDF, photo (PNG, JPG, WEBP) or TXT file.") });
    if (file.size > MAX_IMPORT_BYTES) return setPhase({ kind: "error", message: t("That file is larger than 8 MB.") });
    setPhase({ kind: "reading", name: file.name });
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/ai/import", { method: "POST", body });
      const data = (await response.json()) as { result?: ImportResult; error?: string };
      if (!response.ok || !data.result) return setPhase({ kind: "error", message: data.error ?? t("The document could not be read.") });
      const { profile: next, changes } = applyImport(profile, data.result);
      if (!changes.length) return setPhase({ kind: "error", message: t("We couldn't find grades, scores or activities in this document.") });
      setPhase({ kind: "review", result: data.result, changes, next });
    } catch {
      setPhase({ kind: "error", message: t("Upload failed. Check your connection and try again.") });
    }
  }

  return (
    <section className={styles.wrap}>
      <AnimatePresence mode="wait" initial={false}>
        {phase.kind === "review" ? (
          <motion.div key="review" className={styles.review} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <p className={styles.title}>{t("Found in your document")}</p>
            <p className={styles.summary}>{phase.result.summary}</p>
            <ul className={styles.changes}>
              {phase.changes.map((c) => (
                <li key={c.label}>
                  <span>{c.label}</span>
                  <strong>{c.value}</strong>
                </li>
              ))}
            </ul>
            {phase.result.warnings.length > 0 && (
              <ul className={styles.warnings}>
                {phase.result.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
            <div className={styles.actions}>
              <Button
                size="sm"
                onClick={() => {
                  onApply(phase.next);
                  notify({ tone: "success", title: t("Profile updated"), body: t("{count} fields filled from your document", { count: phase.changes.length }) });
                  setPhase({ kind: "idle" });
                }}
              >
                
                {t("Apply to profile")}
              </Button>
              <Button size="sm" variant="quiet" onClick={() => setPhase({ kind: "idle" })}>
                
                {t("Discard")}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="drop"
            type="button"
            className={clsx(styles.drop, dragging && styles.dragging)}
            disabled={phase.kind === "reading"}
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) upload(file);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className={styles.icon}>{phase.kind === "reading" ? <span className={styles.spinner} /> : <Icon name="plus" size={18} />}</span>
            <span className={styles.text}>
              <span className={styles.title}>{phase.kind === "reading" ? t("Reading {name}…", { name: phase.name }) : t("Import from a document")}</span>
              <span className={phase.kind === "error" ? styles.error : styles.hint}>{phase.kind === "error" ? phase.message : t("Transcript, test report, certificate or CV — AI fills the fields for you to review.")}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMPORT_TYPES.join(",")}
        className="visually-hidden"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </section>
  );
}

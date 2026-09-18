"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useI18n } from "./i18n-context";
import { useT } from "@/lib/i18n/use-t";
import type { Locale } from "@/lib/types";

const languages: { code: Locale; label: string; badge: string }[] = [
  { code: "en", label: "English", badge: "EN" },
  { code: "kk", label: "Қазақша", badge: "KZ" },
  { code: "ru", label: "Русский", badge: "RU" },
];

export function LanguageSelector() {
  const t = useT();
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = languages.find((l) => l.code === locale) || languages[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold border border-[#589C80]/30 bg-panel/50 text-ink hover:border-[#EBAE29] transition-all cursor-pointer"
        aria-label={t("Select language")}
      >
        <Globe size={13} className="text-green-ink" />
        <span className="uppercase">{current.badge}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-panel/95 border border-[#589C80]/30 shadow-2xl backdrop-blur-xl p-1.5 z-50">
          {languages.map((lang) => {
            const active = lang.code === locale;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLocale(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                  active
                    ? "bg-[#589C80] text-on-accent font-bold shadow-md"
                    : "text-ink/80 hover:bg-[#589C80]/15 hover:text-ink"
                }`}
              >
                <span>{lang.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink/10">{lang.badge}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

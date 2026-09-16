"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "./i18n-context";
import type { Locale } from "@/lib/types";

const languages: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "kk", label: "Қазақша", flag: "🇰🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

export function LanguageSelector() {
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold border border-[#589C80]/30 bg-[#132228]/50 text-[#F5EED2] hover:border-[#EBAE29] transition-all cursor-pointer"
        aria-label="Select language"
      >
        <span>{current.flag}</span>
        <span className="uppercase">{current.code}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-[#132228]/95 border border-[#589C80]/30 shadow-2xl backdrop-blur-xl p-1.5 z-50">
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
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                  active
                    ? "bg-[#589C80] text-[#132228] font-bold shadow-md"
                    : "text-[#F5EED2]/80 hover:bg-[#589C80]/15 hover:text-[#F5EED2]"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

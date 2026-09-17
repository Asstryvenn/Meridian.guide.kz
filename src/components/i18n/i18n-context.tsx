"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { setActiveLocale } from "@/lib/i18n/catalog";
import type { Locale } from "@/lib/types";
import { translations, type Translations } from "./translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "meridian:locale";
const EVENT = "meridian:locale-change";

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "kk" || value === "ru";
}

function readLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(saved) ? saved : "en";
  } catch {
    return "en";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => "en" as Locale);
  setActiveLocale(locale);

  useEffect(() => {
    document.documentElement.lang = locale === "kk" ? "kk" : locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setActiveLocale(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const value = useMemo(() => ({ locale, setLocale, t: translations[locale] }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return { locale: "en" as Locale, setLocale: () => {}, t: translations.en };
  }
  return ctx;
}

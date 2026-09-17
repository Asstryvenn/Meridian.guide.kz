import type { Locale } from "@/lib/types";
import kk from "./kk.json";
import ru from "./ru.json";

export type Params = Record<string, string | number>;

const dictionaries: Record<Exclude<Locale, "en">, Record<string, string>> = { ru, kk };

let activeLocale: Locale = "en";

export function setActiveLocale(locale: Locale) {
  activeLocale = locale;
}

export function getActiveLocale(): Locale {
  return activeLocale;
}

function interpolate(text: string, params?: Params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match));
}

export function translate(source: string, params: Params | undefined, locale: Locale): string {
  const template = locale === "en" ? source : (dictionaries[locale][source] ?? source);
  return interpolate(template, params);
}

export function tr(source: string, params?: Params): string {
  return translate(source, params, activeLocale);
}

export function msg<T extends string>(source: T): T {
  return source;
}

export const intlLocale: Record<Locale, string> = { en: "en-GB", ru: "ru-RU", kk: "kk-KZ" };

export function inLocale<T>(locale: Locale, compute: () => T): T {
  const previous = activeLocale;
  activeLocale = locale;
  try {
    return compute();
  } finally {
    activeLocale = previous;
  }
}

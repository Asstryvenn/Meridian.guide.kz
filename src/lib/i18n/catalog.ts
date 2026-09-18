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
  if (!text || typeof text !== "string") return "";
  if (!params || typeof params !== "object") return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in params && params[key] !== undefined && params[key] !== null ? String(params[key]) : match));
}

export function translate(source: string, params: Params | undefined, locale: Locale): string {
  if (!source || typeof source !== "string") return "";
  const dict = dictionaries[locale as Exclude<Locale, "en">];
  const template = locale === "en" || !dict ? source : (dict[source] ?? source);
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

"use client";

import { useCallback } from "react";
import { useI18n } from "@/components/i18n/i18n-context";
import { translate, type Params } from "./catalog";

export function useT() {
  const { locale } = useI18n();
  return useCallback((source: string, params?: Params) => translate(source, params, locale), [locale]);
}

export function useLocale() {
  return useI18n().locale;
}

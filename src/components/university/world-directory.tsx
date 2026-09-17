"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { universities as curated } from "@/lib/data/universities";
import type { DirectoryPage, DirectoryUniversity } from "@/lib/directory/types";
import styles from "./world-directory.module.css";
import { useT } from "@/lib/i18n/use-t";

const PAGE_SIZE = 30;

type Status = "idle" | "loading" | "error" | "done";

const curatedByName = new Map(curated.map((u) => [u.name.toLowerCase(), u.slug]));

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function flag(code: string | null) {
  if (!code || code.length !== 2) return "🎓";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
}

function Row({ university }: { university: DirectoryUniversity }) {
  const t = useT();
  const website = university.webPages[0];
  const slug = curatedByName.get(university.name.toLowerCase());
  return (
    <li className={styles.row}>
      <span className={styles.flag} aria-hidden>
        {flag(university.countryCode)}
      </span>
      <div className={styles.main}>
        <span className={styles.name}>{university.name}</span>
        <span className={styles.meta}>
          {[university.stateProvince, university.country].filter(Boolean).join(", ")}
          {university.domains[0] ? ` · ${university.domains[0]}` : ""}
        </span>
      </div>
      <div className={styles.actions}>
        {slug && (
          <a href={`/universities/${slug}`} className={styles.profile}>
            
            {t("Full profile")}
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noreferrer" className={styles.visit} aria-label={t("Visit {name} website", { name: university.name })}>
            <Icon name="external" size={16} />
          </a>
        )}
      </div>
    </li>
  );
}

interface Loaded {
  key: string;
  items: DirectoryUniversity[];
  page: number;
  hasMore: boolean;
  meta: Pick<DirectoryPage, "total" | "source" | "sourceName" | "sourceUrl">;
}

async function fetchPage(q: string, country: string, page: number, signal?: AbortSignal): Promise<DirectoryPage> {
  const params = new URLSearchParams({ q, country, page: String(page), pageSize: String(PAGE_SIZE) });
  const response = await fetch(`/api/universities?${params}`, { signal });
  if (!response.ok) throw new Error("request failed");
  return response.json();
}

export function WorldDirectory() {
  const tx = useT();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounced(query.trim(), 250);
  const key = `${debouncedQuery}|${country}|${retryToken}`;

  useEffect(() => {
    fetch("/api/universities/countries")
      .then((r) => r.json())
      .then((data: { countries: string[] }) => setCountries(data.countries))
      .catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    fetchPage(debouncedQuery, country, 1, abort.signal)
      .then((data) => {
        setLoaded({ key, items: data.items, page: 1, hasMore: data.hasMore, meta: data });
        setFailedKey(null);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setFailedKey(key);
      });
    return () => abort.abort();
  }, [debouncedQuery, country, key]);

  const current = loaded?.key === key ? loaded : null;
  const items = current?.items ?? [];
  const resetting = !current && failedKey !== key;

  const loadMore = useCallback(() => {
    if (!current || !current.hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchPage(debouncedQuery, country, current.page + 1)
      .then((data) => {
        setLoaded((prev) => (prev && prev.key === current.key ? { ...prev, items: [...prev.items, ...data.items], page: current.page + 1, hasMore: data.hasMore } : prev));
      })
      .catch(() => setFailedKey(current.key))
      .finally(() => setLoadingMore(false));
  }, [current, loadingMore, debouncedQuery, country]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), { rootMargin: "600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  function retry() {
    setFailedKey(null);
    if (items.length) loadMore();
    else setRetryToken((t) => t + 1);
  }

  const status: Status = failedKey === key ? "error" : resetting || loadingMore ? "loading" : current && !current.hasMore ? "done" : "idle";
  const meta = current?.meta ?? loaded?.meta ?? null;

  return (
    <section className={styles.wrap}>
      <div className={styles.controls}>
        <label className={`glass ${styles.search}`}>
          <Icon name="search" size={18} className={styles.searchIcon} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("Search 10,000+ universities")} aria-label={tx("Search universities by name")} className={styles.input} enterKeyHint="search" />
          {query && (
            <button type="button" className={styles.clear} onClick={() => setQuery("")} aria-label={tx("Clear search")}>
              <Icon name="close" size={14} />
            </button>
          )}
        </label>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className={styles.select} aria-label={tx("Filter by country")}>
          <option value="">{tx("All countries")}</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className={styles.count} aria-live="polite">
        {meta ? `${meta.total.toLocaleString("en-US")} ${meta.total === 1 ? "university" : "universities"}` : tx("Loading directory…")}
        {meta && (
          <>
            {" · "}
            <a href={meta.sourceUrl} target="_blank" rel="noreferrer">
              {meta.sourceName}
            </a>
            {meta.source === "remote" ? tx(" (live source)") : ""}
          </>
        )}
      </p>

      <ul className={clsx("glass", styles.list)}>
        {items.map((u) => (
          <Row key={u.id} university={u} />
        ))}
        {status === "loading" &&
          Array.from({ length: items.length ? 3 : 10 }, (_, i) => (
            <li key={`skeleton-${i}`} className={styles.skeleton} aria-hidden>
              <span />
              <span />
            </li>
          ))}
      </ul>

      {status === "error" && (
        <button type="button" className={styles.retry} onClick={retry}>
          
          {tx("Couldn't load universities. Tap to retry.")}
        </button>
      )}
      {status === "done" && items.length === 0 && <p className={styles.empty}>{tx("No universities match your search.")}</p>}
      {status === "done" && items.length > 0 && <p className={styles.end}>{tx("You've reached the end of the list.")}</p>}
      <div ref={sentinel} className={styles.sentinel} aria-hidden />
    </section>
  );
}

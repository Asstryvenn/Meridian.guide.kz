"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState, useEffect, type FormEvent } from "react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icon";
import { SourcedValue } from "@/components/ui/source-note";
import { CompareTray } from "@/components/university/compare-tray";
import { PredictionRange } from "@/components/university/prediction-panel";
import { TierBadge } from "@/components/university/tier";
import { WorldDirectory } from "@/components/university/world-directory";
import { universities } from "@/lib/data/universities";
import { recommend } from "@/lib/engine/matching";
import { applyFilters, describeFilters, emptyFilters, parseQueryLocally, removeFilter, type FilterChip, type SearchFilters } from "@/lib/engine/search";
import { useApp } from "@/lib/store/app-store";
import styles from "./catalog.module.css";
import { useLocale, useT } from "@/lib/i18n/use-t";
import { inLocale, msg } from "@/lib/i18n/catalog";

const examples = [msg("Affordable computer science in Europe"), msg("Top AI programs in the US with full financial aid"), msg("Engineering in Asia under $10k"), msg("Accessible business schools with scholarships")];

const usdRange = ([min, max]: [number, number]) => (min === max ? `$${Math.round(min / 1000)}k` : `$${Math.round(min / 1000)}–${Math.round(max / 1000)}k`);

function MatchedCatalog() {
  const t = useT();
  const { profile, compare, toggleCompare } = useApp();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [source, setSource] = useState<"ai" | "rules" | null>(null);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const locale = useLocale();
  const recommendations = useMemo(() => inLocale(locale, () => new Map(recommend(profile, universities).map((r) => [r.university.slug, r]))), [profile, locale]);
  const results = useMemo(() => applyFilters(filters), [filters]);
  const chips = describeFilters(filters);

  useEffect(() => {
    setVisibleCount(10);
  }, [filters]);

  async function search(text: string) {
    setQuery(text);
    if (!text.trim()) {
      setFilters(emptyFilters);
      setSource(null);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: text }) });
      const data = (await response.json()) as { filters: SearchFilters; source: "ai" | "rules" };
      setFilters(data.filters);
      setSource(data.source);
    } catch {
      setFilters(parseQueryLocally(text));
      setSource("rules");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    search(query);
  }

  function removeChip(chip: FilterChip) {
    setFilters((f) => removeFilter(f, chip));
  }

  const visibleResults = results.slice(0, visibleCount);

  return (
    <>
      <Reveal>
        <form className={`glass ${styles.search}`} onSubmit={onSubmit} role="search">
          <Icon name="search" className={styles.searchIcon} />
          <input className={styles.searchInput} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("e.g. affordable AI programs in Europe with scholarships")} aria-label={t("Search universities")} />
          <Button type="submit" size="md" disabled={loading}>
            {loading ? t("Thinking…") : t("Search")}
          </Button>
        </form>
        <div className={styles.examples}>
          {examples.map((example) => (
            <button key={example} type="button" className={styles.example} onClick={() => search(example)}>
              {example}
            </button>
          ))}
        </div>
      </Reveal>

      {chips.length > 0 && (
        <Reveal className={styles.filterBar}>
          <DataTag kind={source === "ai" ? "ai" : "rules"} label={source === "ai" ? t("Parsed by AI") : t("Parsed by rules")} />
          <div className={styles.chips}>
            <AnimatePresence>
              {chips.map((chip) => (
                <motion.button key={`${chip.kind}-${chip.value ?? ""}`} type="button" layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={styles.chip} onClick={() => removeChip(chip)}>
                  {chip.label}
                  <Icon name="close" size={12} />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          <Button variant="quiet" size="sm" onClick={() => search("")}>
            {t("Clear")}
          </Button>
        </Reveal>
      )}

      <p className={styles.count}>
        {results.length} {results.length === 1 ? "university" : "universities"}
      </p>

      <ul className={styles.results}>
        <AnimatePresence mode="popLayout">
          {visibleResults.map((u) => {
            const rec = recommendations.get(u.slug);
            const comparing = compare.includes(u.slug);
            const globalRank = u.ranking?.global ?? u.globalRanking;
            const nationalRank = u.ranking?.national ?? u.nationalRanking;
            const rankLabel = globalRank ? `#${globalRank} Global` : nationalRank ? `#${nationalRank} National` : null;

            return (
              <motion.li key={u.slug} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className={`glass ${styles.row}`}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitleBlock}>
                    <Link href={`/universities/${u.slug}`} className={styles.rowName}>
                      {u.name}
                    </Link>
                    {rankLabel && <span className={styles.rankBadge}>{rankLabel}</span>}
                  </div>
                  <p className={styles.rowPlace}>
                    {t(u.city)} · {t(u.country)} · {t(u.type)}
                  </p>
                  <p className={styles.rowSummary}>{t(u.summary)}</p>
                  {u.popularMajors && u.popularMajors.length > 0 && (
                    <div className={styles.majorsList}>
                      {u.popularMajors.slice(0, 3).map((major) => (
                        <span key={major} className={styles.majorChip}>
                          {major}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <dl className={styles.facts}>
                  <div>
                    <dt>{t("International tuition")}</dt>
                    <dd>
                      <SourcedValue data={u.intlTuitionUsd} format={usdRange} />
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Acceptance rate")}</dt>
                    <dd>
                      <SourcedValue data={u.acceptanceRate} format={(v) => `${Math.round(v * 1000) / 10}%`} />
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Your estimate")}</dt>
                    <dd>{rec ? <PredictionRange prediction={rec.prediction} /> : <span className="faint">{t("Outside your fields")}</span>}</dd>
                  </div>
                  <div>
                    <dt>{t("Tier")}</dt>
                    <dd>{rec ? <TierBadge tier={rec.tier} /> : <span className="faint">—</span>}</dd>
                  </div>
                </dl>
                <div className={styles.rowActions}>
                  <Button size="sm" variant="ghost" onClick={() => toggleCompare(u.slug)} aria-pressed={comparing}>
                    {comparing ? t("Comparing") : t("Compare")}
                  </Button>
                  <Button size="sm" variant="secondary" href={`/universities/${u.slug}`}>
                    {t("View profile")}
                  </Button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {visibleCount < results.length && (
        <div className={styles.paginationWrap}>
          <Button variant="secondary" size="md" onClick={() => setVisibleCount((prev) => prev + 10)}>
            {t("Load more")} ({results.length - visibleCount} {t("remaining")})
          </Button>
        </div>
      )}

      {results.length === 0 && <p className="muted">{t("No universities in the catalog match every filter. Remove a filter to widen the search.")}</p>}
      <CompareTray />
    </>
  );
}

export default function CatalogPage() {
  const t = useT();
  const [view, setView] = useState<"world" | "matched">("world");

  return (
    <Page>
      <PageHeader
        eyebrow={t("Universities")}
        title={t("Explore universities")}
        description={view === "world" ? t("Search more than 10,000 universities worldwide.") : t("Profiles with admission estimates, costs and sources. Describe what you want in plain language.")}
      />
      <Reveal>
        <Segmented
          label={t("Browse")}
          value={view}
          onChange={setView}
          options={[
            { value: "world", label: t("All universities") },
            { value: "matched", label: t("Detailed profiles · {count}", { count: universities.length }) },
          ]}
        />
      </Reveal>
      {view === "world" ? <WorldDirectory /> : <MatchedCatalog />}
    </Page>
  );
}

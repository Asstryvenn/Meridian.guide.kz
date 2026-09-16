"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Page, PageHeader, Reveal } from "@/components/layout/page";
import { DataTag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SourcedValue } from "@/components/ui/source-note";
import { CompareTray } from "@/components/university/compare-tray";
import { PredictionRange } from "@/components/university/prediction-panel";
import { TierBadge } from "@/components/university/tier";
import { universities } from "@/lib/data/universities";
import { recommend } from "@/lib/engine/matching";
import { applyFilters, describeFilters, emptyFilters, parseQueryLocally, type SearchFilters } from "@/lib/engine/search";
import { useApp } from "@/lib/store/app-store";
import styles from "./catalog.module.css";

const examples = ["Affordable computer science in Europe", "Top AI programs in the US with full financial aid", "Engineering in Asia under $10k", "Accessible business schools with scholarships"];

const usdRange = ([min, max]: [number, number]) => (min === max ? `$${Math.round(min / 1000)}k` : `$${Math.round(min / 1000)}–${Math.round(max / 1000)}k`);

export default function CatalogPage() {
  const { profile, compare, toggleCompare } = useApp();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [source, setSource] = useState<"ai" | "rules" | null>(null);
  const [loading, setLoading] = useState(false);

  const recommendations = useMemo(() => new Map(recommend(profile, universities).map((r) => [r.university.slug, r])), [profile]);
  const results = useMemo(() => applyFilters(filters), [filters]);
  const chips = describeFilters(filters);

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

  function removeChip(chip: string) {
    setFilters((f) => ({
      fields: f.fields.filter((x) => x !== chip),
      countries: f.countries.filter((x) => x !== chip),
      regions: f.regions.filter((x) => x !== chip),
      maxTuitionUsd: chip.startsWith("Tuition") ? null : f.maxTuitionUsd,
      scholarshipsOnly: chip.startsWith("Scholarships") ? false : f.scholarshipsOnly,
      difficulty: ["Accessible admission", "Moderately selective", "Highly selective"].includes(chip) ? "any" : f.difficulty,
      keywords: f.keywords.filter((k) => `“${k}”` !== chip),
    }));
  }

  return (
    <Page>
      <PageHeader eyebrow="University catalog" title="Search the way you think" description="Describe what you want in plain language. We translate it into filters you can see and edit." />

      <Reveal>
        <form className={`glass ${styles.search}`} onSubmit={onSubmit} role="search">
          <Icon name="search" className={styles.searchIcon} />
          <input className={styles.searchInput} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. affordable AI programs in Europe with scholarships" aria-label="Search universities" />
          <Button type="submit" size="md" disabled={loading}>
            {loading ? "Thinking…" : "Search"}
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
          <DataTag kind={source === "ai" ? "ai" : "rules"} label={source === "ai" ? "Parsed by Claude" : "Parsed by rules"} />
          <div className={styles.chips}>
            <AnimatePresence>
              {chips.map((chip) => (
                <motion.button key={chip} type="button" layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={styles.chip} onClick={() => removeChip(chip)}>
                  {chip}
                  <Icon name="close" size={12} />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          <Button variant="quiet" size="sm" onClick={() => search("")}>
            Clear
          </Button>
        </Reveal>
      )}

      <p className={styles.count}>
        {results.length} {results.length === 1 ? "university" : "universities"}
      </p>

      <motion.ul layout className={styles.results}>
        <AnimatePresence mode="popLayout">
          {results.map((u) => {
            const rec = recommendations.get(u.slug);
            const comparing = compare.includes(u.slug);
            return (
              <motion.li key={u.slug} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className={`glass ${styles.row}`}>
                <div className={styles.rowMain}>
                  <Link href={`/universities/${u.slug}`} className={styles.rowName}>
                    {u.name}
                  </Link>
                  <p className={styles.rowPlace}>
                    {u.city} · {u.country} · {u.type}
                  </p>
                  <p className={styles.rowSummary}>{u.summary}</p>
                </div>
                <dl className={styles.facts}>
                  <div>
                    <dt>International tuition</dt>
                    <dd>
                      <SourcedValue data={u.intlTuitionUsd} format={usdRange} />
                    </dd>
                  </div>
                  <div>
                    <dt>Acceptance rate</dt>
                    <dd>
                      <SourcedValue data={u.acceptanceRate} format={(v) => `${Math.round(v * 1000) / 10}%`} />
                    </dd>
                  </div>
                  <div>
                    <dt>Your estimate</dt>
                    <dd>{rec ? <PredictionRange prediction={rec.prediction} /> : <span className="faint">Outside your fields</span>}</dd>
                  </div>
                  <div>
                    <dt>Tier</dt>
                    <dd>{rec ? <TierBadge tier={rec.tier} /> : <span className="faint">—</span>}</dd>
                  </div>
                </dl>
                <div className={styles.rowActions}>
                  <Button size="sm" variant="ghost" onClick={() => toggleCompare(u.slug)} aria-pressed={comparing}>
                    {comparing ? "Comparing" : "Compare"}
                  </Button>
                  <Button size="sm" variant="secondary" href={`/universities/${u.slug}`}>
                    View profile
                  </Button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>

      {results.length === 0 && <p className="muted">No universities in the catalog match every filter. Remove a filter to widen the search.</p>}
      <CompareTray />
    </Page>
  );
}

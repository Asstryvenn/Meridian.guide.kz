import { createClient } from "@supabase/supabase-js";
import { dedupe, extractRecords, normalizeRecord } from "../src/lib/directory/normalize.ts";
import type { DirectoryUniversity } from "../src/lib/directory/types.ts";

const DEFAULT_SOURCE_URL = "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";
const BATCH_SIZE = 500;
const MAX_PAGES = 500;

const sourceUrl = process.env.UNIVERSITIES_SOURCE_URL || DEFAULT_SOURCE_URL;
const sourceName = process.env.UNIVERSITIES_SOURCE_NAME || "Hipo university-domains-list";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function nextPageUrl(payload: unknown, current: string): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const meta = (record.meta ?? record.pagination ?? {}) as Record<string, unknown>;
  const next = record.next ?? meta.next ?? (record.links as Record<string, unknown> | undefined)?.next;
  return typeof next === "string" && next ? new URL(next, current).toString() : null;
}

async function fetchAll(): Promise<DirectoryUniversity[]> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.UNIVERSITIES_API_KEY) headers.Authorization = `Bearer ${process.env.UNIVERSITIES_API_KEY}`;

  const collected: DirectoryUniversity[] = [];
  let url: string | null = sourceUrl;
  let page = 0;
  while (url && page < MAX_PAGES) {
    page += 1;
    const response = await fetch(url, { headers });
    if (!response.ok) fail(`Source responded with ${response.status} for ${url}`);
    const payload: unknown = await response.json();
    const records = extractRecords(payload);
    records.forEach((record, index) => {
      const university = normalizeRecord(record, collected.length + index);
      if (university) collected.push(university);
    });
    console.log(`  page ${page}: ${records.length} records (total ${collected.length})`);
    url = nextPageUrl(payload, url);
  }
  return dedupe(collected);
}

async function main() {
  if (!supabaseUrl) fail("NEXT_PUBLIC_SUPABASE_URL is missing.");
  if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local (never expose it to the browser).");

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  console.log(`→ Fetching universities from ${sourceUrl}`);
  const universities = await fetchAll();
  if (!universities.length) fail("The source returned no universities.");
  console.log(`→ Upserting ${universities.length} universities in batches of ${BATCH_SIZE}`);

  const syncedAt = new Date().toISOString();
  for (let start = 0; start < universities.length; start += BATCH_SIZE) {
    const batch = universities.slice(start, start + BATCH_SIZE).map((u) => ({
      name: u.name,
      country: u.country,
      country_code: u.countryCode,
      state_province: u.stateProvince,
      domains: u.domains,
      web_pages: u.webPages,
      source_name: sourceName,
      source_url: sourceUrl,
      last_synced: syncedAt,
    }));
    const { error } = await supabase.from("university_directory").upsert(batch, { onConflict: "name,country" });
    if (error) fail(`Batch starting at ${start} failed: ${error.message}`);
    process.stdout.write(`  ${Math.min(start + BATCH_SIZE, universities.length)}/${universities.length}\r`);
  }

  const { count } = await supabase.from("university_directory").select("id", { count: "exact", head: true });
  console.log(`\n✓ Done. university_directory now holds ${count ?? "unknown"} rows.`);
}

main().catch((error: Error) => fail(error.message));

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { dedupe, extractRecords, normalizeRecord } from "./normalize";
import type { DirectoryPage, DirectoryQuery, DirectoryUniversity } from "./types";

const DEFAULT_SOURCE_URL = "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";
const SOURCE_URL = process.env.UNIVERSITIES_SOURCE_URL || DEFAULT_SOURCE_URL;
const SOURCE_NAME = process.env.UNIVERSITIES_SOURCE_NAME || "Hipo university-domains-list";
const DB_CHECK_TTL_MS = 5 * 60 * 1000;
const REMOTE_TTL_MS = 24 * 60 * 60 * 1000;

let server: SupabaseClient | null = null;
let dbState: { hasRows: boolean; checkedAt: number } | null = null;
interface RemoteCache {
  items: DirectoryUniversity[];
  countries: string[];
  loadedAt: number;
}

let remoteCache: RemoteCache | null = null;
let remoteLoading: Promise<RemoteCache> | null = null;

function supabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!server) server = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return server;
}

async function databaseHasRows(): Promise<boolean> {
  if (dbState && Date.now() - dbState.checkedAt < DB_CHECK_TTL_MS) return dbState.hasRows;
  const client = supabase();
  if (!client) return false;
  const { data, error } = await client.from("university_directory").select("id").limit(1);
  const hasRows = !error && Boolean(data?.length);
  dbState = { hasRows, checkedAt: Date.now() };
  return hasRows;
}

async function loadRemote(): Promise<RemoteCache> {
  if (remoteCache && Date.now() - remoteCache.loadedAt < REMOTE_TTL_MS) return remoteCache;
  if (remoteLoading) return remoteLoading;
  remoteLoading = (async (): Promise<RemoteCache> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (process.env.UNIVERSITIES_API_KEY) headers.Authorization = `Bearer ${process.env.UNIVERSITIES_API_KEY}`;
    const response = await fetch(SOURCE_URL, { headers, cache: "no-store" });
    if (!response.ok) throw new Error(`University source responded with ${response.status}`);
    const items = dedupe(
      extractRecords(await response.json())
        .map(normalizeRecord)
        .filter((u): u is DirectoryUniversity => u !== null),
    ).sort((a, b) => a.name.localeCompare(b.name));
    const countries = Array.from(new Set(items.map((u) => u.country))).sort();
    const loaded: RemoteCache = { items, countries, loadedAt: Date.now() };
    remoteCache = loaded;
    return loaded;
  })().finally(() => {
    remoteLoading = null;
  });
  return remoteLoading;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

async function searchDatabase(query: DirectoryQuery): Promise<DirectoryPage> {
  const client = supabase() as SupabaseClient;
  const from = (query.page - 1) * query.pageSize;
  let request = client
    .from("university_directory")
    .select("id, name, country, country_code, state_province, domains, web_pages", { count: "exact" })
    .order("name")
    .range(from, from + query.pageSize - 1);
  if (query.q) request = request.ilike("name", `%${escapeLike(query.q)}%`);
  if (query.country) request = request.eq("country", query.country);
  const { data, count, error } = await request;
  if (error) throw new Error(error.message);
  const total = count ?? 0;
  return {
    items: (data ?? []).map((row) => ({
      id: String(row.id),
      name: row.name,
      country: row.country,
      countryCode: row.country_code,
      stateProvince: row.state_province,
      domains: row.domains ?? [],
      webPages: row.web_pages ?? [],
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    hasMore: from + query.pageSize < total,
    source: "database",
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
  };
}

async function searchRemote(query: DirectoryQuery): Promise<DirectoryPage> {
  const { items } = await loadRemote();
  const q = query.q.toLowerCase();
  const filtered = items.filter(
    (u) => (!query.country || u.country === query.country) && (!q || u.name.toLowerCase().includes(q) || u.domains.some((d) => d.includes(q)) || (u.stateProvince?.toLowerCase().includes(q) ?? false)),
  );
  const from = (query.page - 1) * query.pageSize;
  return {
    items: filtered.slice(from, from + query.pageSize),
    total: filtered.length,
    page: query.page,
    pageSize: query.pageSize,
    hasMore: from + query.pageSize < filtered.length,
    source: "remote",
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
  };
}

export async function searchDirectory(query: DirectoryQuery): Promise<DirectoryPage> {
  if (await databaseHasRows().catch(() => false)) {
    try {
      return await searchDatabase(query);
    } catch {
      dbState = { hasRows: false, checkedAt: Date.now() };
    }
  }
  return searchRemote(query);
}

export async function directoryCountries(): Promise<string[]> {
  if (await databaseHasRows().catch(() => false)) {
    const client = supabase() as SupabaseClient;
    const { data, error } = await client.rpc("university_directory_countries");
    if (!error && Array.isArray(data)) return data.map((row: { country: string }) => row.country);
  }
  return (await loadRemote()).countries;
}

import type { DirectoryUniversity } from "./types";

type RawRecord = Record<string, unknown>;

function text(record: RawRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function list(record: RawRecord, keys: string[]): string[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && Boolean(v.trim()));
    if (typeof value === "string" && value.trim()) return [value.trim()];
  }
  return [];
}

export function normalizeRecord(record: RawRecord, index: number): DirectoryUniversity | null {
  const name = text(record, ["name", "university_name", "institution", "title"]);
  const country = text(record, ["country", "country_name", "countryName", "nation"]);
  if (!name || !country) return null;
  return {
    id: String(record.id ?? `${country}:${name}:${index}`),
    name,
    country,
    countryCode: text(record, ["alpha_two_code", "country_code", "countryCode", "iso2"]),
    stateProvince: text(record, ["state-province", "state_province", "state", "province", "region"]),
    domains: list(record, ["domains", "domain"]),
    webPages: list(record, ["web_pages", "webPages", "website", "url", "web_page"]),
  };
}

export function extractRecords(payload: unknown): RawRecord[] {
  if (Array.isArray(payload)) return payload as RawRecord[];
  if (payload && typeof payload === "object") {
    for (const key of ["data", "results", "items", "universities", "records"]) {
      const value = (payload as RawRecord)[key];
      if (Array.isArray(value)) return value as RawRecord[];
    }
  }
  return [];
}

export function dedupe(items: DirectoryUniversity[]): DirectoryUniversity[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.country.toLowerCase()}|${item.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

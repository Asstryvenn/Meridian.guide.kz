import { z } from "zod";
import { countries, regions, universities } from "@/lib/data/universities";
import type { FieldOfStudy, University } from "@/lib/types";

export const fieldOptions: FieldOfStudy[] = [
  "Computer Science",
  "Artificial Intelligence",
  "Data Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Business",
  "Economics",
  "Medicine",
  "Biology",
  "Physics",
  "Mathematics",
  "Design",
];

export const searchFiltersSchema = z.object({
  fields: z.array(z.enum(fieldOptions as [FieldOfStudy, ...FieldOfStudy[]])),
  countries: z.array(z.string()),
  regions: z.array(z.string()),
  maxTuitionUsd: z.number().nullable(),
  scholarshipsOnly: z.boolean(),
  difficulty: z.enum(["any", "accessible", "moderate", "highly_selective"]),
  keywords: z.array(z.string()),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export const emptyFilters: SearchFilters = {
  fields: [],
  countries: [],
  regions: [],
  maxTuitionUsd: null,
  scholarshipsOnly: false,
  difficulty: "any",
  keywords: [],
};

const fieldAliases: [RegExp, FieldOfStudy][] = [
  [/\b(computer science|cs|software|programming|coding)\b/i, "Computer Science"],
  [/\b(ai|artificial intelligence|machine learning|ml|deep learning)\b/i, "Artificial Intelligence"],
  [/\b(data science|analytics|statistics)\b/i, "Data Science"],
  [/\b(electrical|electronics|computer engineering)\b/i, "Electrical Engineering"],
  [/\b(mechanical|aerospace|mechatronics|robotics)\b/i, "Mechanical Engineering"],
  [/\b(business|management|commerce|entrepreneurship)\b/i, "Business"],
  [/\b(economics|finance)\b/i, "Economics"],
  [/\b(medicine|medical|pre-?med|doctor)\b/i, "Medicine"],
  [/\b(biology|life sciences|biomedical)\b/i, "Biology"],
  [/\b(physics)\b/i, "Physics"],
  [/\b(math|mathematics)\b/i, "Mathematics"],
  [/\b(design)\b/i, "Design"],
];

const countryAliases: [RegExp, string][] = [
  [/\b(usa|united states|america|american)\b/i, "United States"],
  [/\bUS\b/, "United States"],
  [/\b(uk|united kingdom|britain|england|scotland)\b/i, "United Kingdom"],
  [/\bcanada\b/i, "Canada"],
  [/\bgermany\b/i, "Germany"],
  [/\bswitzerland\b/i, "Switzerland"],
  [/\b(netherlands|holland)\b/i, "Netherlands"],
  [/\bsingapore\b/i, "Singapore"],
  [/\b(korea|south korea)\b/i, "South Korea"],
  [/\bkazakhstan\b/i, "Kazakhstan"],
];

const regionAliases: [RegExp, string][] = [
  [/\beurope\b/i, "Europe"],
  [/\basia\b/i, "Asia"],
  [/\bnorth america\b/i, "North America"],
  [/\bcentral asia\b/i, "Central Asia"],
];

export function parseQueryLocally(query: string): SearchFilters {
  const filters: SearchFilters = { ...emptyFilters, fields: [], countries: [], regions: [], keywords: [] };
  for (const [pattern, field] of fieldAliases) if (pattern.test(query)) filters.fields.push(field);
  for (const [pattern, country] of countryAliases) if (pattern.test(query)) filters.countries.push(country);
  for (const [pattern, region] of regionAliases) if (pattern.test(query)) filters.regions.push(region);
  if (filters.regions.includes("Central Asia")) filters.regions = filters.regions.filter((r) => r !== "Asia");

  const money = query.match(/(?:under|below|less than|max|up to|<)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(k|000)?/i);
  if (money) {
    const amount = parseFloat(money[1].replace(",", "."));
    filters.maxTuitionUsd = money[2] || amount < 1000 ? amount * 1000 : amount;
  } else if (/\b(cheap|affordable|low[- ]cost|low tuition|budget)\b/i.test(query)) {
    filters.maxTuitionUsd = 25000;
  }

  if (/\b(scholarship|funding|funded|financial aid|grant)s?\b/i.test(query)) filters.scholarshipsOnly = true;

  if (/\b(easy|safety|safe|less competitive|high acceptance|accessible)\b/i.test(query)) filters.difficulty = "accessible";
  else if (/\b(top|elite|ivy|best|most selective|prestigious|world[- ]class)\b/i.test(query)) filters.difficulty = "highly_selective";
  else if (/\b(moderate|mid|target)\b/i.test(query)) filters.difficulty = "moderate";

  return filters;
}

export function sanitizeFilters(filters: SearchFilters): SearchFilters {
  return {
    ...filters,
    countries: filters.countries.filter((c) => countries.includes(c)),
    regions: filters.regions.filter((r) => regions.includes(r)),
  };
}

export function applyFilters(filters: SearchFilters, pool: University[] = universities): University[] {
  return pool.filter((u) => {
    if (filters.fields.length && !u.programs.some((p) => filters.fields.includes(p.field))) return false;
    if (filters.countries.length && !filters.countries.includes(u.country)) return false;
    if (filters.regions.length && !filters.regions.includes(u.region)) return false;
    if (filters.maxTuitionUsd !== null) {
      const tuition = u.intlTuitionUsd.value;
      if (!tuition || tuition[0] > filters.maxTuitionUsd) return false;
    }
    if (filters.scholarshipsOnly && u.scholarshipIds.length === 0 && u.needBasedAidIntl.value !== "full_need") return false;
    if (filters.difficulty === "accessible" && u.selectivityTier > 2) return false;
    if (filters.difficulty === "moderate" && (u.selectivityTier < 3 || u.selectivityTier > 4)) return false;
    if (filters.difficulty === "highly_selective" && u.selectivityTier < 5) return false;
    if (filters.keywords.length) {
      const haystack = `${u.name} ${u.shortName} ${u.city} ${u.summary}`.toLowerCase();
      if (!filters.keywords.some((k) => haystack.includes(k.toLowerCase()))) return false;
    }
    return true;
  });
}

export function describeFilters(filters: SearchFilters): string[] {
  const chips: string[] = [];
  chips.push(...filters.fields);
  chips.push(...filters.countries);
  chips.push(...filters.regions);
  if (filters.maxTuitionUsd !== null) chips.push(`Tuition ≤ $${Math.round(filters.maxTuitionUsd / 1000)}k`);
  if (filters.scholarshipsOnly) chips.push("Scholarships or full-need aid");
  if (filters.difficulty === "accessible") chips.push("Accessible admission");
  if (filters.difficulty === "moderate") chips.push("Moderately selective");
  if (filters.difficulty === "highly_selective") chips.push("Highly selective");
  chips.push(...filters.keywords.map((k) => `“${k}”`));
  return chips;
}

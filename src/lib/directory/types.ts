export interface DirectoryUniversity {
  id: string;
  name: string;
  country: string;
  countryCode: string | null;
  stateProvince: string | null;
  domains: string[];
  webPages: string[];
}

export interface DirectoryQuery {
  q: string;
  country: string;
  page: number;
  pageSize: number;
}

export interface DirectoryPage {
  items: DirectoryUniversity[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  source: "database" | "remote";
  sourceName: string;
  sourceUrl: string;
}

// API Client Functions for GIMS

export interface IndexData {
  key: string;
  name: string;
  score: number;
  threshold: {
    min: number;
    max: number;
    color: string;
    label: string;
  };
  trend: number;
  calculatedAt: string | null;
}

export interface IndexHistoryPoint {
  date: string;
  score: number;
  decayedScore: number;
  signals: Record<string, number>;
}

export interface ArticleData {
  id: string;
  source: string;
  url: string;
  title: string;
  summary: string;
  whyMatters: string;
  publishedAt: string;
  tags: string[];
  indexImpact: Record<string, number>;
}

export interface ForecastData {
  id: string;
  indexName: string;
  indexDisplayName: string;
  region: string | null;
  forecastValue: number;
  method: string;
  horizonDays: number;
  confidence: number;
  scenario: string | null;
  triggeredAt: string;
}

export interface RegionData {
  id: string;
  name: string;
  riskScore: number;
  conflictCount: number;
  threshold: {
    min: number;
    max: number;
    color: string;
    label: string;
  };
  updatedAt: string;
}

export interface BriefData {
  date: string;
  priorityItems: {
    title: string;
    summary: string;
    tags: string[];
    indexImpact: Record<string, number>;
  }[];
  indexSummaries: {
    name: string;
    score: number;
    threshold: {
      min: number;
      max: number;
      color: string;
      label: string;
    };
    change: number;
    direction: string;
  }[];
  keyDevelopments: {
    title: string;
    source: string;
    publishedAt: string;
  }[];
  activeForecasts: {
    indexName: string;
    forecastValue: number;
    method: string;
    confidence: number;
    scenario: string | null;
  }[];
  regionalRiskSummary: {
    name: string;
    riskScore: number;
    threshold: {
      min: number;
      max: number;
      color: string;
      label: string;
    };
    conflictCount: number;
  }[];
}

export async function fetchIndices(): Promise<IndexData[]> {
  const res = await fetch('/api/indices');
  if (!res.ok) throw new Error('Failed to fetch indices');
  return res.json();
}

export async function fetchIndexHistory(name: string): Promise<IndexHistoryPoint[]> {
  const res = await fetch(`/api/indices/${encodeURIComponent(name)}/history`);
  if (!res.ok) throw new Error('Failed to fetch index history');
  return res.json();
}

export async function fetchArticles(params?: {
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ articles: ArticleData[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.tag) sp.set('tag', params.tag);
  if (params?.search) sp.set('search', params.search);
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.offset) sp.set('offset', String(params.offset));
  const qs = sp.toString();
  const res = await fetch(`/api/articles${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch articles');
  return res.json();
}

export async function fetchForecasts(): Promise<ForecastData[]> {
  const res = await fetch('/api/forecasts');
  if (!res.ok) throw new Error('Failed to fetch forecasts');
  return res.json();
}

export async function fetchRegions(): Promise<RegionData[]> {
  const res = await fetch('/api/regions');
  if (!res.ok) throw new Error('Failed to fetch regions');
  return res.json();
}

export async function fetchBrief(): Promise<BriefData> {
  const res = await fetch('/api/brief');
  if (!res.ok) throw new Error('Failed to fetch brief');
  return res.json();
}

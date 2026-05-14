'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchArticles, fetchRegions, fetchIndices, fetchForecasts, type ArticleData, type RegionData, type IndexData, type ForecastData } from '@/lib/api';
import {
  Radio,
  Flame,
  Zap,
  Globe,
  ChevronRight,
  Clock,
  ShieldAlert,
  TrendingUp,
  Crosshair,
} from 'lucide-react';

// ── Worldwide Alert Item ──────────────────────────────────────────────────
interface WorldwideAlert {
  id: string;
  type: 'critical' | 'escalation' | 'threat' | 'watch';
  title: string;
  region: string;
  time: string;
  severity: number;
  description: string;
  icon: 'critical' | 'escalation' | 'threat' | 'watch';
}

const ALERT_STYLES: Record<string, { bg: string; border: string; text: string; iconBg: string; pulse: string }> = {
  critical: {
    bg: 'bg-[#1a0f10]',
    border: 'border-[#3b1a1a]',
    text: 'text-[#f44336]',
    iconBg: 'bg-[#f44336]/15',
    pulse: 'bg-[#f44336]',
  },
  escalation: {
    bg: 'bg-[#1a150d]',
    border: 'border-[#3b2a15]',
    text: 'text-[#ff9800]',
    iconBg: 'bg-[#ff9800]/15',
    pulse: 'bg-[#ff9800]',
  },
  threat: {
    bg: 'bg-[#1a1610]',
    border: 'border-[#2a2518]',
    text: 'text-[#eab308]',
    iconBg: 'bg-[#eab308]/15',
    pulse: 'bg-[#eab308]',
  },
  watch: {
    bg: 'bg-[#0f1520]',
    border: 'border-[#1a2535]',
    text: 'text-[#00bcd4]',
    iconBg: 'bg-[#00bcd4]/15',
    pulse: 'bg-[#00bcd4]',
  },
};

const ALERT_ICONS = {
  critical: ShieldAlert,
  escalation: Flame,
  threat: Crosshair,
  watch: TrendingUp,
};

// ── Build worldwide alerts from data ─────────────────────────────────────
function buildWorldwideAlerts(
  articles: ArticleData[],
  regions: RegionData[],
  indices: IndexData[],
  forecasts: ForecastData[]
): WorldwideAlert[] {
  const alerts: WorldwideAlert[] = [];

  // 1. High-severity articles (scored by indexImpact)
  const highImpactArticles = articles
    .filter((a) => {
      const impacts = Object.values(a.indexImpact ?? {});
      return impacts.some((v) => v >= 0.7);
    })
    .sort((a, b) => {
      const aMax = Math.max(...Object.values(a.indexImpact ?? {}));
      const bMax = Math.max(...Object.values(b.indexImpact ?? {}));
      return bMax - aMax;
    });

  for (const article of highImpactArticles.slice(0, 4)) {
    const maxImpact = Math.max(...Object.values(article.indexImpact ?? {}));
    const tags = article.tags ?? [];
    let region = 'Global';
    if (tags.some((t) => ['iran', 'middle-east', 'houthi', 'nuclear'].includes(t))) region = 'Middle East';
    else if (tags.some((t) => ['ukraine', 'russia', 'eastern-europe', 'nato'].includes(t))) region = 'Eastern Europe';
    else if (tags.some((t) => ['china', 'south-china-sea', 'indo-pacific', 'philippines'].includes(t))) region = 'Indo-Pacific';
    else if (tags.some((t) => ['india', 'pakistan', 'kashmir', 'south-asia'].includes(t))) region = 'South Asia';
    else if (tags.some((t) => ['cyber', 'ai', 'autonomous'].includes(t))) region = 'Global';

    alerts.push({
      id: `article-${article.id}`,
      type: maxImpact >= 0.85 ? 'critical' : maxImpact >= 0.7 ? 'escalation' : 'threat',
      title: article.title,
      region,
      time: article.publishedAt,
      severity: maxImpact * 100,
      description: article.summary.slice(0, 120) + '...',
      icon: maxImpact >= 0.85 ? 'critical' : maxImpact >= 0.7 ? 'escalation' : 'threat',
    });
  }

  // 2. High-risk regions
  const criticalRegions = regions.filter((r) => r.riskScore >= 55);
  for (const region of criticalRegions) {
    alerts.push({
      id: `region-${region.id}`,
      type: region.riskScore >= 70 ? 'critical' : region.riskScore >= 60 ? 'escalation' : 'threat',
      title: `${region.name} - Elevated Regional Risk`,
      region: region.name,
      time: region.updatedAt,
      severity: region.riskScore,
      description: `Risk score at ${region.riskScore.toFixed(0)} with ${region.conflictCount} active conflict indicators. Threshold: ${region.threshold.label}.`,
      icon: region.riskScore >= 70 ? 'critical' : region.riskScore >= 60 ? 'escalation' : 'threat',
    });
  }

  // 3. High-value forecasts
  const concerningForecasts = forecasts.filter((f) => f.forecastValue >= 70 && f.confidence >= 0.5);
  for (const forecast of concerningForecasts.slice(0, 3)) {
    alerts.push({
      id: `forecast-${forecast.id}`,
      type: forecast.forecastValue >= 80 ? 'critical' : 'escalation',
      title: `${forecast.indexDisplayName} forecast: ${forecast.forecastValue.toFixed(0)}`,
      region: forecast.region ?? 'Global',
      time: forecast.triggeredAt,
      severity: forecast.forecastValue,
      description: `${forecast.method} projects ${forecast.forecastValue.toFixed(1)} within ${forecast.horizonDays} days (${(forecast.confidence * 100).toFixed(0)}% confidence).`,
      icon: forecast.forecastValue >= 80 ? 'critical' : 'escalation',
    });
  }

  // Sort by severity desc, then time desc
  alerts.sort((a, b) => {
    const sevDiff = b.severity - a.severity;
    if (Math.abs(sevDiff) > 5) return sevDiff;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  return alerts;
}

// ── Main Component ────────────────────────────────────────────────────────
export function WorldwideAlerts() {
  const [filter, setFilter] = useState<'all' | 'critical' | 'escalation' | 'threat' | 'watch'>('all');

  const { data: articles } = useQuery({
    queryKey: ['articles', 'all'],
    queryFn: () => fetchArticles({ limit: 20 }),
  });

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  });

  const { data: indices } = useQuery({
    queryKey: ['indices'],
    queryFn: fetchIndices,
  });

  const { data: forecasts } = useQuery({
    queryKey: ['forecasts'],
    queryFn: fetchForecasts,
  });

  const alerts = buildWorldwideAlerts(
    articles?.articles ?? [],
    regions ?? [],
    indices ?? [],
    forecasts ?? []
  );

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.type === filter);

  // Summary stats
  const criticalCount = alerts.filter((a) => a.type === 'critical').length;
  const escalationCount = alerts.filter((a) => a.type === 'escalation').length;
  const totalHigh = criticalCount + escalationCount;

  function formatTimeAgo(timeStr: string): string {
    const now = Date.now();
    const then = new Date(timeStr).getTime();
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  }

  return (
    <div className="gims-panel h-full flex flex-col">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#f44336]" />
            <h3 className="gims-panel-header">Active Incidents</h3>
            <span className="ml-1 text-[10px] font-bold text-[#f44336] bg-[#f44336]/15 px-1.5 py-0.5 rounded">
              {alerts.length}
            </span>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1">
          {(['all', 'critical', 'escalation', 'threat', 'watch'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                filter === f
                  ? 'bg-[#1e2633] text-[#00bcd4]'
                  : 'text-[#4a5568] hover:text-[#7b8ca8]'
              }`}
            >
              {f === 'all' ? 'ALL' : f.toUpperCase()}
              {f !== 'all' && (
                <span className="ml-1 text-[9px] opacity-60">
                  {alerts.filter((a) => a.type === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="mx-4 mb-2 p-2 rounded bg-[#0a0e17] border border-[#1e2633]">
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3 text-[#ff9800]" />
          <span className="text-[10px] text-[#7b8ca8]">
            <span className="text-white font-semibold">{alerts.length}</span> tracked
          </span>
          <span className="text-[#1e2633]">|</span>
          <span className="text-[10px] text-[#7b8ca8]">
            <span className="text-[#f44336] font-semibold">{totalHigh}</span> priority
          </span>
        </div>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-[#4a5568] text-sm">No alerts matching filter</div>
        )}

        {filtered.map((alert) => {
          const style = ALERT_STYLES[alert.type];
          const Icon = ALERT_ICONS[alert.icon];
          const timeAgo = formatTimeAgo(alert.time);

          return (
            <div
              key={alert.id}
              className={`${style.bg} ${style.border} border rounded p-2.5 mb-2 transition-all hover:border-[#2a3548] cursor-pointer group`}
            >
              <div className="flex items-start gap-2">
                {/* Icon */}
                <div className={`shrink-0 p-1 rounded ${style.iconBg} mt-0.5`}>
                  <Icon className={`h-3 w-3 ${style.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h4 className={`text-[11px] font-semibold ${style.text} line-clamp-2 leading-snug`}>
                      {alert.title}
                    </h4>
                    {alert.type === 'critical' && (
                      <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${style.pulse} animate-pulse mt-1.5`} />
                    )}
                  </div>

                  <p className="text-[10px] text-[#4a5568] line-clamp-1 leading-relaxed mb-1.5">
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#4a5568] flex items-center gap-1">
                      <Globe className="h-2.5 w-2.5" />
                      {alert.region}
                    </span>
                    <span className="text-[9px] text-[#4a5568] flex items-center gap-1 font-tactical">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo}
                    </span>
                    {alert.severity >= 80 && (
                      <span className="text-[9px] text-[#f44336] font-bold font-tactical">
                        {alert.severity.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-3 w-3 text-[#1e2633] shrink-0 mt-1 group-hover:text-[#4a5568] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

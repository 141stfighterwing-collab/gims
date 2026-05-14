'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchArticles, fetchRegions, fetchIndices, fetchForecasts, type ArticleData, type RegionData, type IndexData, type ForecastData } from '@/lib/api';
import {
  AlertTriangle,
  Radio,
  Flame,
  Zap,
  Globe,
  ChevronRight,
  Clock,
  ShieldAlert,
  TrendingUp,
  ArrowUpRight,
  Crosshair,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
    bg: 'bg-red-950/40',
    border: 'border-red-800/50',
    text: 'text-red-300',
    iconBg: 'bg-red-600/20',
    pulse: 'bg-red-500',
  },
  escalation: {
    bg: 'bg-orange-950/30',
    border: 'border-orange-800/40',
    text: 'text-orange-300',
    iconBg: 'bg-orange-600/20',
    pulse: 'bg-orange-500',
  },
  threat: {
    bg: 'bg-amber-950/30',
    border: 'border-amber-800/30',
    text: 'text-amber-300',
    iconBg: 'bg-amber-600/20',
    pulse: 'bg-amber-500',
  },
  watch: {
    bg: 'bg-blue-950/30',
    border: 'border-blue-800/30',
    text: 'text-blue-300',
    iconBg: 'bg-blue-600/20',
    pulse: 'bg-blue-500',
  },
};

const ALERT_ICONS = {
  critical: ShieldAlert,
  escalation: Flame,
  threat: AlertTriangle,
  watch: Crosshair,
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-400" />
            Worldwide Alerts
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-red-600/20 text-red-400 border-red-800/40 text-[10px] px-1.5 py-0">
              {criticalCount} CRITICAL
            </Badge>
            <Badge className="bg-orange-600/20 text-orange-400 border-orange-800/40 text-[10px] px-1.5 py-0">
              {escalationCount} ESCALATION
            </Badge>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 mt-2">
          {(['all', 'critical', 'escalation', 'threat', 'watch'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-0.5 rounded-md transition-all ${
                filter === f
                  ? 'bg-slate-600/80 text-white'
                  : 'bg-slate-700/30 text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-1 text-[9px] opacity-60">
                  ({alerts.filter((a) => a.type === f).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {/* Status bar */}
        <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-slate-900/50 border border-slate-700/30">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[11px] text-slate-400">
            <span className="text-white font-semibold">{alerts.length}</span> active alerts tracked
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] text-slate-400">
            <span className="text-red-400 font-semibold">{totalHigh}</span> require immediate attention
          </span>
        </div>

        {/* Alert list */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">No alerts matching filter</div>
          )}

          {filtered.map((alert, idx) => {
            const style = ALERT_STYLES[alert.type];
            const Icon = ALERT_ICONS[alert.icon];
            const timeAgo = formatDistanceToNow(new Date(alert.time), { addSuffix: true });

            return (
              <div
                key={alert.id}
                className={`${style.bg} ${style.border} border rounded-lg p-3 transition-all hover:scale-[1.01] cursor-pointer group`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start gap-2.5">
                  {/* Icon */}
                  <div className={`shrink-0 p-1.5 rounded-md ${style.iconBg} mt-0.5`}>
                    <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`text-xs font-semibold ${style.text} line-clamp-2 leading-snug`}>
                        {alert.title}
                      </h4>
                      {alert.type === 'critical' && (
                        <span className={`shrink-0 w-2 h-2 rounded-full ${style.pulse} animate-pulse mt-1`} />
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {alert.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 border-slate-700/50 text-slate-400 bg-slate-800/50"
                      >
                        <Globe className="h-2.5 w-2.5 mr-1" />
                        {alert.region}
                      </Badge>
                      <span className="text-[9px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo}
                      </span>
                      {alert.severity >= 80 && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 border-red-800/40 text-red-400 bg-red-950/30"
                        >
                          <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                          {alert.severity.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-1 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

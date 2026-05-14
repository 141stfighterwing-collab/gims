'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchBrief, type BriefData } from '@/lib/api';
import { Shield, AlertTriangle, TrendingUp, Globe, Target, Zap } from 'lucide-react';
import { format } from 'date-fns';

export function DailyBrief() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrief().then((data) => {
      setBrief(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 bg-slate-700" />
        <Skeleton className="h-64 bg-slate-700" />
        <Skeleton className="h-48 bg-slate-700" />
      </div>
    );
  }

  if (!brief) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/20 rounded-lg">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Daily Intelligence Brief</h2>
            <p className="text-xs text-slate-400">
              {format(new Date(brief.date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <Badge className="bg-red-600/20 text-red-300 border-red-700/50 text-xs">
          <Zap className="h-3 w-3 mr-1" />
          CLASSIFIED // GIMS-DAILY
        </Badge>
      </div>

      {/* Priority Items */}
      <Card className="bg-slate-800/60 border-red-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Top Priority Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {brief.priorityItems.map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-red-950/20 border border-red-900/20"
            >
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded bg-red-600/30 text-red-300 text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">{item.summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {(item.tags ?? []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 bg-slate-700/50 text-slate-400 border-slate-600/50"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Index Summary Table + Regional Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Index Summary */}
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Index Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {brief.indexSummaries.map((idx, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-700/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: idx.threshold.color }}
                    />
                    <span className="text-xs text-slate-300 truncate">{idx.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold" style={{ color: idx.threshold.color }}>
                      {idx.score.toFixed(0)}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        idx.direction === 'rising'
                          ? 'text-red-400'
                          : idx.direction === 'falling'
                          ? 'text-green-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {idx.direction === 'rising' ? '↑' : idx.direction === 'falling' ? '↓' : '→'}{' '}
                      {idx.change > 0 ? '+' : ''}{idx.change.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regional Risk Summary */}
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Regional Risk Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {brief.regionalRiskSummary.map((region, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{region.name}</span>
                      <span className="text-xs font-bold" style={{ color: region.threshold.color }}>
                        {region.riskScore.toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${region.riskScore}%`,
                          backgroundColor: region.threshold.color,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 shrink-0 w-14 text-right">
                    {region.conflictCount} conflicts
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Developments */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Target className="h-4 w-4" />
            Key Developments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {brief.keyDevelopments.map((dev, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded bg-slate-700/20">
                <div className="w-1 h-1 rounded-full bg-slate-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-slate-200 font-medium leading-snug">{dev.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500">{dev.source}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">
                      {format(new Date(dev.publishedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Forecasts */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Active Forecasts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {brief.activeForecasts.map((forecast, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-200">{forecast.indexName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{forecast.method}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      forecast.confidence > 0.7
                        ? 'bg-green-900/30 text-green-300 border-green-700/50'
                        : forecast.confidence > 0.5
                        ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50'
                        : 'bg-orange-900/30 text-orange-300 border-orange-700/50'
                    }`}
                  >
                    {(forecast.confidence * 100).toFixed(0)}% conf
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{forecast.scenario}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

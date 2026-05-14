'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { fetchForecasts, type ForecastData } from '@/lib/api';
import { format } from 'date-fns';
import { BarChart3, TrendingUp, AlertTriangle, Brain } from 'lucide-react';

const methodColors: Record<string, string> = {
  'Linear Extrapolation': '#3b82f6',
  'Exponential Smoothing': '#8b5cf6',
  'ARIMA Forecast': '#06b6d4',
  'Scenario Analysis': '#f59e0b',
  'Anomaly Detection': '#ef4444',
  'Monte Carlo Simulation': '#22c55e',
};

const METHOD_DESCRIPTIONS: Record<string, { icon: typeof BarChart3; description: string }> = {
  'Linear Extrapolation': {
    icon: TrendingUp,
    description: 'Projects future values by extending the linear trend observed in recent data points. Most reliable for short-term forecasts with steady trends.',
  },
  'Exponential Smoothing': {
    icon: TrendingUp,
    description: 'Applies weighted averages that give exponentially decreasing importance to older observations. More responsive to recent changes than simple moving averages.',
  },
  'ARIMA Forecast': {
    icon: BarChart3,
    description: 'Autoregressive Integrated Moving Average model that captures temporal dependencies and autocorrelations in the time series data.',
  },
  'Scenario Analysis': {
    icon: AlertTriangle,
    description: 'Generates multiple plausible future scenarios (best/base/worst case) and produces probability-weighted forecasts across all scenarios.',
  },
  'Anomaly Detection': {
    icon: AlertTriangle,
    description: 'Identifies statistical anomalies in recent data that deviate significantly from established patterns, suggesting potential surprise developments.',
  },
  'Monte Carlo Simulation': {
    icon: Brain,
    description: 'Runs thousands of randomized simulations based on historical volatility and drift to produce probabilistic forecasts with confidence intervals.',
  },
};

export function ForecastCenter() {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecasts().then((data) => {
      setForecasts(data);
      setLoading(false);
    });
  }, []);

  // Chart data: confidence by method
  const methodChartData = forecasts.reduce<Record<string, { method: string; confidence: number; count: number; color: string }[]>>(
    (acc, f) => {
      const existing = acc[f.method] ?? [];
      const idx = existing.findIndex((e) => e.method === f.method);
      if (idx >= 0) {
        existing[idx].count += 1;
      } else {
        existing.push({
          method: f.method,
          confidence: f.confidence,
          count: 1,
          color: methodColors[f.method] ?? '#64748b',
        });
      }
      acc[f.method] = existing;
      return acc;
    },
    {}
  );
  const chartData = Object.values(methodChartData).map((d) => ({
    method: d.method.replace(/ /g, '\n'),
    confidence: d.confidence * 100,
    color: d.color,
  }));

  return (
    <div className="space-y-4">
      {/* Forecast Summary Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-800/60 border-slate-700/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Forecast Confidence by Method
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading ? (
              <Skeleton className="w-full h-[250px] bg-slate-700" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: '#475569' }}
                    unit="%"
                  />
                  <YAxis
                    type="category"
                    dataKey="method"
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                    axisLine={{ stroke: '#475569' }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="confidence" radius={[0, 4, 4, 0]} name="Confidence">
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 bg-slate-700" />
                <Skeleton className="h-16 bg-slate-700" />
                <Skeleton className="h-16 bg-slate-700" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="text-2xl font-bold text-slate-100">{forecasts.length}</div>
                  <div className="text-xs text-slate-400">Active Forecasts</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="text-2xl font-bold text-slate-100">
                    {new Set(forecasts.map((f) => f.method)).size}
                  </div>
                  <div className="text-xs text-slate-400">Methods Used</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="text-2xl font-bold text-amber-400">
                    {forecasts.length > 0
                      ? Math.max(...forecasts.map((f) => f.forecastValue)).toFixed(0)
                      : '—'}
                  </div>
                  <div className="text-xs text-slate-400">Highest Forecast Value</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forecasts Table */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Active Forecasts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <Skeleton className="w-full h-[200px] bg-slate-700" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400 text-xs">Index</TableHead>
                    <TableHead className="text-slate-400 text-xs">Method</TableHead>
                    <TableHead className="text-slate-400 text-xs">Region</TableHead>
                    <TableHead className="text-slate-400 text-xs text-right">Forecast</TableHead>
                    <TableHead className="text-slate-400 text-xs text-right">Horizon</TableHead>
                    <TableHead className="text-slate-400 text-xs text-right">Confidence</TableHead>
                    <TableHead className="text-slate-400 text-xs">Triggered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecasts.map((f) => (
                    <TableRow key={f.id} className="border-slate-700/50 hover:bg-slate-700/30">
                      <TableCell className="text-slate-200 text-xs font-medium">
                        {f.indexDisplayName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          style={{
                            borderColor: methodColors[f.method] ?? '#64748b',
                            color: methodColors[f.method] ?? '#64748b',
                          }}
                        >
                          {f.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {f.region ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-bold text-slate-200">
                          {f.forecastValue.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs text-right">
                        {f.horizonDays}d
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${f.confidence * 100}%`,
                                backgroundColor: f.confidence > 0.7 ? '#22c55e' : f.confidence > 0.5 ? '#eab308' : '#f97316',
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-300 w-8 text-right">
                            {(f.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {format(new Date(f.triggeredAt), 'MMM d')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Methodology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(METHOD_DESCRIPTIONS).map(([method, { icon: Icon, description }]) => (
          <Card key={method} className="bg-slate-800/60 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="p-1.5 rounded"
                  style={{ backgroundColor: `${methodColors[method]}15` }}
                >
                  <Icon className="h-4 w-4" style={{ color: methodColors[method] }} />
                </div>
                <span className="text-sm font-medium text-slate-200">{method}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scenario Details */}
      {forecasts.filter((f) => f.scenario).length > 0 && (
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Scenario Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {forecasts
              .filter((f) => f.scenario)
              .map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg bg-slate-700/30 border-l-2"
                  style={{ borderLeftColor: methodColors[f.method] ?? '#64748b' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-200">{f.indexDisplayName}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{
                        borderColor: methodColors[f.method] ?? '#64748b',
                        color: methodColors[f.method] ?? '#64748b',
                      }}
                    >
                      {f.method}
                    </Badge>
                    {f.region && (
                      <span className="text-[10px] text-slate-500">• {f.region}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.scenario}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

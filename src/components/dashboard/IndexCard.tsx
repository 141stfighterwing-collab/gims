'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { IndexData, IndexHistoryPoint } from '@/lib/api';

interface IndexCardProps {
  index: IndexData;
  history?: IndexHistoryPoint[];
}

export function IndexCard({ index, history }: IndexCardProps) {
  const trendIcon = index.trend > 2
    ? <TrendingUp className="h-4 w-4 text-red-400" />
    : index.trend < -2
    ? <TrendingDown className="h-4 w-4 text-green-400" />
    : <Minus className="h-4 w-4 text-gray-400" />;

  const sparkData = (history ?? []).slice(-7).map((h) => ({
    value: h.score,
  }));

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider truncate max-w-[70%]">
            {index.name}
          </h3>
          <div className="flex items-center gap-1.5">
            {trendIcon}
            <span className={`text-xs font-semibold ${
              index.trend > 2 ? 'text-red-400' : index.trend < -2 ? 'text-green-400' : 'text-slate-400'
            }`}>
              {index.trend > 0 ? '+' : ''}{index.trend}%
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div
              className="text-3xl font-bold tracking-tight"
              style={{ color: index.threshold.color }}
            >
              {index.score.toFixed(0)}
            </div>
            <span
              className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${index.threshold.color}20`,
                color: index.threshold.color,
              }}
            >
              {index.threshold.label}
            </span>
          </div>
          <div className="w-24 h-10">
            {sparkData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData}>
                  <defs>
                    <linearGradient id={`grad-${index.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={index.threshold.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={index.threshold.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={index.threshold.color}
                    strokeWidth={1.5}
                    fill={`url(#grad-${index.key})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { IndexData, IndexHistoryPoint } from '@/lib/api';

interface IndexCardProps {
  index: IndexData;
  history?: IndexHistoryPoint[];
}

export function IndexCard({ index, history }: IndexCardProps) {
  const trendIcon = index.trend > 2
    ? <TrendingUp className="h-3.5 w-3.5 text-[#f44336]" />
    : index.trend < -2
    ? <TrendingDown className="h-3.5 w-3.5 text-[#00e676]" />
    : <Minus className="h-3.5 w-3.5 text-[#4a5568]" />;

  const sparkData = (history ?? []).slice(-7).map((h) => ({
    value: h.score,
  }));

  return (
    <div className="gims-panel flex overflow-hidden group hover:border-[#2a3548] transition-all duration-300">
      {/* Left severity bar */}
      <div
        className="w-1 shrink-0"
        style={{ backgroundColor: index.threshold.color }}
      />

      {/* Content */}
      <div className="flex-1 flex items-center justify-between p-3 min-w-0 gap-3">
        {/* Left: Name + Score */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Status dot */}
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: index.threshold.color,
              boxShadow: `0 0 6px ${index.threshold.color}`,
            }}
          />
          <div className="min-w-0">
            <h3 className="text-[11px] font-semibold text-[#7b8ca8] uppercase tracking-wider truncate">
              {index.name}
            </h3>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className="text-xl font-bold tracking-tight"
                style={{ color: index.threshold.color }}
              >
                {index.score.toFixed(0)}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded"
                style={{
                  backgroundColor: `${index.threshold.color}15`,
                  color: index.threshold.color,
                }}
              >
                {index.threshold.label}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Trend + Sparkline */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Sparkline */}
          {sparkData.length > 0 && (
            <div className="w-16 h-8">
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
            </div>
          )}

          {/* Trend */}
          <div className="flex flex-col items-end">
            {trendIcon}
            <span
              className={`text-[10px] font-bold font-tactical ${
                index.trend > 2 ? 'text-[#f44336]' : index.trend < -2 ? 'text-[#00e676]' : 'text-[#4a5568]'
              }`}
            >
              {index.trend > 0 ? '+' : ''}{index.trend}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

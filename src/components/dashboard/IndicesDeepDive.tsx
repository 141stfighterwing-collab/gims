'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import { fetchIndices, fetchIndexHistory, type IndexData, type IndexHistoryPoint } from '@/lib/api';
import { getThreshold } from '@/lib/scoring-engine';
import { useQuery } from '@tanstack/react-query';

export function IndicesDeepDive() {
  const [selectedIndex, setSelectedIndex] = useState<string>('');

  const { data: indices, isLoading: indicesLoading } = useQuery({
    queryKey: ['indices'],
    queryFn: fetchIndices,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['indexHistory', selectedIndex],
    queryFn: () => fetchIndexHistory(selectedIndex),
    enabled: !!selectedIndex,
  });

  // Auto-select first index
  const effectiveIndex = selectedIndex || indices?.[0]?.key || '';
  const currentIndex = indices?.find((i) => i.key === effectiveIndex);
  const threshold = currentIndex ? getThreshold(currentIndex.score) : null;
  const isLoading = indicesLoading || (effectiveIndex ? historyLoading : false);

  const latestSignals = history && history.length > 0 ? history[history.length - 1].signals : {};

  const handleSelectChange = (value: string) => {
    setSelectedIndex(value);
  };

  return (
    <div className="space-y-4">
      {/* Index Selector */}
      <div className="flex items-center gap-4">
        <Select value={effectiveIndex} onValueChange={handleSelectChange}>
          <SelectTrigger className="w-[300px] bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Select an index" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {indices?.map((idx) => (
              <SelectItem key={idx.key} value={idx.key} className="text-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: idx.threshold.color }} />
                  {idx.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentIndex && threshold && (
          <motion.div
            key={currentIndex.key}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <span className="text-2xl font-bold" style={{ color: threshold.color }}>
              {currentIndex.score.toFixed(1)}
            </span>
            <Badge
              className="text-xs"
              style={{
                backgroundColor: `${threshold.color}20`,
                color: threshold.color,
                borderColor: `${threshold.color}40`,
              }}
            >
              {threshold.label}
            </Badge>
            <span className={`text-sm font-medium ${currentIndex.trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {currentIndex.trend > 0 ? '↑' : '↓'} {Math.abs(currentIndex.trend)}%
            </span>
          </motion.div>
        )}
      </div>

      {/* Time Series Chart */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            30-Day Score History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {isLoading ? (
            <Skeleton className="w-full h-[300px] bg-slate-700" />
          ) : history && history.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={threshold?.color ?? '#eab308'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={threshold?.color ?? '#eab308'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(v: string) => v.split('-').slice(1).join('/')}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: '#475569' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={threshold?.color ?? '#eab308'}
                  strokeWidth={2}
                  fill="url(#scoreGrad)"
                  name="Score"
                />
                <Line
                  type="monotone"
                  dataKey="decayedScore"
                  stroke="#64748b"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Decayed Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              No history data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signal Breakdown + Decay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signal Breakdown */}
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Signal Breakdown (Latest)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="w-full h-[200px] bg-slate-700" />
            ) : Object.keys(latestSignals).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400 text-xs">Signal</TableHead>
                    <TableHead className="text-slate-400 text-xs text-right">Contribution</TableHead>
                    <TableHead className="text-slate-400 text-xs text-right">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(latestSignals)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([name, value]) => (
                      <TableRow key={name} className="border-slate-700/50 hover:bg-slate-700/30">
                        <TableCell className="text-slate-300 text-xs capitalize">
                          {name.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${(value as number) * 100}%`,
                                  backgroundColor: threshold?.color ?? '#eab308',
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-300 w-8 text-right">
                              {((value as number) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs text-right">
                          {(value as number).toFixed(3)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-slate-500">
                No signal data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decay Visualization */}
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Score vs Decayed Score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="w-full h-[200px] bg-slate-700" />
            ) : history && history.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={history.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(v: string) => v.split('-').slice(1).join('/')}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: '#475569' }}
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
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={threshold?.color ?? '#eab308'}
                    strokeWidth={2}
                    dot={false}
                    name="Raw Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="decayedScore"
                    stroke="#64748b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Decayed Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-slate-500">
                No decay data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

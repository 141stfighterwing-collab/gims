'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RegionData } from '@/lib/api';
import { getThreshold } from '@/lib/scoring-engine';

interface WorldMapProps {
  regions: RegionData[];
}

const REGION_PATHS: Record<string, { d: string; cx: number; cy: number; labelCx: number; labelCy: number }> = {
  'Middle East': {
    d: 'M180 180 Q200 160 220 170 Q240 175 250 190 Q255 210 240 220 Q220 230 200 225 Q185 215 180 200 Z',
    cx: 215, cy: 200, labelCx: 215, labelCy: 235,
  },
  'Eastern Europe': {
    d: 'M260 120 Q280 110 300 120 Q310 135 305 155 Q290 165 270 160 Q255 150 255 135 Z',
    cx: 280, cy: 140, labelCx: 280, labelCy: 175,
  },
  'Indo-Pacific': {
    d: 'M380 140 Q400 130 420 140 Q440 155 435 175 Q420 190 400 185 Q380 175 375 160 Z',
    cx: 405, cy: 160, labelCx: 405, labelCy: 200,
  },
  'East Africa': {
    d: 'M270 210 Q290 200 310 210 Q320 230 310 250 Q295 260 275 255 Q260 240 260 225 Z',
    cx: 290, cy: 230, labelCx: 290, labelCy: 270,
  },
  'South Asia': {
    d: 'M340 170 Q355 160 370 170 Q380 185 375 205 Q360 215 345 210 Q335 195 335 180 Z',
    cx: 357, cy: 188, labelCx: 357, labelCy: 225,
  },
  'Arctic': {
    d: 'M120 50 Q200 30 300 40 Q350 45 370 55 Q300 65 200 60 Q140 58 120 50 Z',
    cx: 245, cy: 48, labelCx: 245, labelCy: 25,
  },
};

function getRegionColor(riskScore: number): string {
  if (riskScore >= 76) return '#ce2d48';
  if (riskScore >= 51) return '#f97316';
  if (riskScore >= 26) return '#eab308';
  return '#22c55e';
}

export function WorldMap({ regions }: WorldMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const regionMap = new Map(regions.map((r) => [r.name, r]));

  return (
    <Card className="bg-slate-800/60 border-slate-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Global Threat Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="relative w-full" style={{ paddingBottom: '50%' }}>
          <svg
            viewBox="0 0 500 300"
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" strokeWidth="0.3" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="500" height="300" fill="url(#grid)" />

            {/* Simplified world outline */}
            <path
              d="M50 100 Q80 80 120 85 Q160 75 200 80 Q240 70 280 75 Q320 70 360 80 Q400 85 440 90 Q460 100 450 120 Q440 140 420 150 Q400 160 380 170 Q360 180 340 190 Q320 200 300 210 Q280 220 260 215 Q240 210 220 215 Q200 220 180 215 Q160 210 140 215 Q120 210 100 205 Q80 195 70 180 Q60 165 55 150 Q50 135 50 120 Z"
              fill="none"
              stroke="#475569"
              strokeWidth="0.5"
              opacity="0.4"
            />

            {/* Region shapes */}
            {Object.entries(REGION_PATHS).map(([name, { d, cx, cy, labelCx, labelCy }]) => {
              const region = regionMap.get(name);
              const isHovered = hoveredRegion === name;
              const color = region ? getRegionColor(region.riskScore) : '#475569';
              const opacity = isHovered ? 0.9 : region ? 0.6 : 0.2;

              return (
                <g
                  key={name}
                  onMouseEnter={() => setHoveredRegion(name)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className="cursor-pointer"
                >
                  <path
                    d={d}
                    fill={color}
                    opacity={opacity}
                    stroke={color}
                    strokeWidth={isHovered ? 2 : 1}
                    className="transition-all duration-200"
                  />
                  {/* Pulse dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : 3}
                    fill={color}
                    opacity={0.9}
                    className="transition-all duration-200"
                  />
                  {isHovered && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={8}
                      fill="none"
                      stroke={color}
                      strokeWidth={1}
                      opacity={0.5}
                    >
                      <animate attributeName="r" from="5" to="12" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Label */}
                  <text
                    x={labelCx}
                    y={labelCy}
                    textAnchor="middle"
                    className="text-[8px] font-medium fill-slate-300 pointer-events-none select-none"
                  >
                    {name}
                  </text>
                  {region && (
                    <text
                      x={labelCx}
                      y={labelCy + 11}
                      textAnchor="middle"
                      className="text-[7px] font-bold fill-slate-400 pointer-events-none select-none"
                    >
                      Risk: {region.riskScore.toFixed(0)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Tooltip */}
            {hoveredRegion && regionMap.get(hoveredRegion) && (
              <g>
                <rect
                  x={280}
                  y={260}
                  width={180}
                  height={35}
                  rx={4}
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth={0.5}
                />
                <text
                  x={290}
                  y={278}
                  className="text-[9px] font-semibold fill-slate-200"
                >
                  {hoveredRegion}
                </text>
                <text
                  x={290}
                  y={290}
                  className="text-[8px] fill-slate-400"
                >
                  Risk Score: {regionMap.get(hoveredRegion)!.riskScore.toFixed(0)} |{' '}
                  {regionMap.get(hoveredRegion)!.threshold.label} |{' '}
                  {regionMap.get(hoveredRegion)!.conflictCount} conflicts
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {[
            { label: 'Low', color: '#22c55e' },
            { label: 'Elevated', color: '#eab308' },
            { label: 'High', color: '#f97316' },
            { label: 'Critical', color: '#ce2d48' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

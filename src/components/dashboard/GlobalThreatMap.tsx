'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RegionData, ArticleData } from '@/lib/api';
import { Pause, Play, RotateCcw, Maximize2, MapPin, AlertTriangle, Crosshair } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface ThreatMarker {
  lat: number;
  lng: number;
  label: string;
  region: string;
  riskScore: number;
  severity: 'critical' | 'high' | 'elevated' | 'low';
  eventCount: number;
}

interface GlobalThreatMapProps {
  regions: RegionData[];
  articles: ArticleData[];
}

// ── Region Geo-Coordinates ────────────────────────────────────────────────
const REGION_GEO: Record<string, { lat: number; lng: number; markers: { lat: number; lng: number; label: string }[] }> = {
  'Middle East': {
    lat: 29.5, lng: 44.0,
    markers: [
      { lat: 32.0, lng: 35.5, label: 'Jerusalem' },
      { lat: 33.3, lng: 44.4, label: 'Baghdad' },
      { lat: 35.7, lng: 51.4, label: 'Tehran' },
      { lat: 15.4, lng: 44.2, label: 'Sanaa (Houthis)' },
      { lat: 25.3, lng: 51.5, label: 'Doha' },
      { lat: 12.8, lng: 45.0, label: 'Gulf of Aden' },
    ],
  },
  'Eastern Europe': {
    lat: 48.5, lng: 35.0,
    markers: [
      { lat: 48.4, lng: 37.8, label: 'Donetsk' },
      { lat: 50.5, lng: 30.5, label: 'Kyiv' },
      { lat: 55.8, lng: 37.6, label: 'Moscow' },
      { lat: 47.5, lng: 40.0, label: 'Rostov-on-Don' },
    ],
  },
  'Indo-Pacific': {
    lat: 22.0, lng: 118.0,
    markers: [
      { lat: 16.0, lng: 121.5, label: 'Scarborough Shoal' },
      { lat: 25.0, lng: 121.5, label: 'Taiwan Strait' },
      { lat: 35.7, lng: 139.7, label: 'Tokyo' },
      { lat: 39.9, lng: 116.4, label: 'Beijing' },
      { lat: 14.6, lng: 120.9, label: 'Manila' },
    ],
  },
  'East Africa': {
    lat: 5.0, lng: 40.0,
    markers: [
      { lat: -1.3, lng: 36.8, label: 'Nairobi' },
      { lat: 11.6, lng: 43.1, label: 'Djibouti' },
      { lat: 9.0, lng: 38.7, label: 'Addis Ababa' },
      { lat: 2.0, lng: 45.3, label: 'Mogadishu' },
    ],
  },
  'South Asia': {
    lat: 25.0, lng: 74.0,
    markers: [
      { lat: 33.7, lng: 73.0, label: 'LoC - Kashmir' },
      { lat: 28.6, lng: 77.2, label: 'New Delhi' },
      { lat: 33.7, lng: 73.0, label: 'Islamabad' },
    ],
  },
  'Arctic': {
    lat: 72.0, lng: 40.0,
    markers: [
      { lat: 69.3, lng: 88.2, label: 'Norilsk Base' },
      { lat: 64.7, lng: 177.5, label: 'Wrangel Island' },
      { lat: 71.3, lng: 52.8, label: 'Murmansk' },
    ],
  },
};

// ── Utility: severity from score ──────────────────────────────────────────
function getSeverity(score: number): ThreatMarker['severity'] {
  if (score >= 76) return 'critical';
  if (score >= 51) return 'high';
  if (score >= 26) return 'elevated';
  return 'low';
}

const SEVERITY_COLORS: Record<string, { fill: string; glow: string; ring: string }> = {
  critical: { fill: '#ce2d48', glow: 'rgba(206,45,72,0.6)', ring: 'rgba(206,45,72,0.25)' },
  high: { fill: '#f97316', glow: 'rgba(249,115,22,0.6)', ring: 'rgba(249,115,22,0.25)' },
  elevated: { fill: '#eab308', glow: 'rgba(234,179,8,0.5)', ring: 'rgba(234,179,8,0.2)' },
  low: { fill: '#22c55e', glow: 'rgba(34,197,94,0.5)', ring: 'rgba(34,197,94,0.2)' },
};

// ── Utility: 3D projection ────────────────────────────────────────────────
function latLngTo3D(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

function projectTo2D(x: number, y: number, z: number, cx: number, cy: number, rotation: number, radius: number) {
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const rx = x * cosR - z * sinR;
  const rz = x * sinR + z * cosR;
  const scale = 1.0;
  const fov = 800;
  const viewDist = 3.5;
  const s = fov / (viewDist + rz * 0.003) * scale;
  return {
    sx: cx + rx * s,
    sy: cy - y * s,
    z: rz,
    scale: s,
    visible: rz > -radius * 0.3,
  };
}

// ── Simple continent outlines (lat, lng pairs) ────────────────────────────
const CONTINENT_PATHS: { points: [number, number][]; name: string }[] = [
  {
    name: 'North America',
    points: [
      [70, -165], [72, -130], [70, -100], [65, -90], [60, -65], [50, -55],
      [45, -65], [30, -80], [25, -80], [25, -98], [20, -105], [15, -90],
      [15, -85], [10, -80], [10, -75], [30, -115], [35, -120], [48, -125],
      [55, -130], [60, -145], [65, -168],
    ],
  },
  {
    name: 'South America',
    points: [
      [12, -70], [10, -62], [7, -55], [0, -50], [-5, -35], [-15, -39],
      [-23, -43], [-35, -57], [-45, -65], [-55, -68], [-55, -75], [-45, -75],
      [-30, -70], [-20, -70], [-5, -80], [5, -77], [10, -75],
    ],
  },
  {
    name: 'Europe',
    points: [
      [70, 20], [72, 30], [70, 40], [65, 40], [60, 30], [55, 28],
      [50, 40], [45, 40], [42, 28], [38, 25], [36, 0], [38, -10],
      [43, -10], [48, -5], [50, 0], [52, 5], [55, 10], [58, 10],
      [62, 5], [65, 12], [70, 20],
    ],
  },
  {
    name: 'Africa',
    points: [
      [35, -5], [37, 10], [33, 12], [30, 32], [22, 37], [12, 44],
      [10, 50], [0, 42], [-10, 40], [-15, 40], [-25, 35], [-35, 20],
      [-35, 18], [-30, 15], [-20, 12], [-5, 8], [5, 0], [5, -5],
      [15, -17], [20, -17], [25, -15], [30, -10], [35, -5],
    ],
  },
  {
    name: 'Asia',
    points: [
      [70, 40], [72, 60], [72, 100], [70, 140], [65, 170], [60, 165],
      [55, 135], [50, 130], [45, 135], [40, 130], [35, 128], [30, 120],
      [22, 110], [10, 105], [0, 100], [5, 80], [8, 77], [20, 73],
      [25, 68], [25, 62], [30, 50], [35, 45], [40, 45], [42, 50],
      [45, 40], [50, 40], [55, 40], [60, 40], [65, 40], [70, 40],
    ],
  },
  {
    name: 'Australia',
    points: [
      [-15, 130], [-12, 135], [-15, 140], [-20, 148], [-28, 153],
      [-35, 150], [-38, 145], [-35, 137], [-32, 133], [-32, 115],
      [-22, 114], [-15, 125], [-15, 130],
    ],
  },
];

// ── Globe Arc data (great circle routes between hotspots) ─────────────────
const ARC_CONNECTIONS: [string, string][] = [
  ['Tehran', 'Moscow'],
  ['Beijing', 'Tokyo'],
  ['Tehran', 'Baghdad'],
  ['Donetsk', 'Rostov-on-Don'],
  ['Scarborough Shoal', 'Manila'],
  ['LoC - Kashmir', 'Islamabad'],
  ['Gulf of Aden', 'Sanaa (Houthis)'],
];

// ── Main Component ────────────────────────────────────────────────────────
export function GlobalThreatMap({ regions, articles }: GlobalThreatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const [isSpinning, setIsSpinning] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<ThreatMarker | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<ThreatMarker | null>(null);
  const [time, setTime] = useState(0);

  const regionMap = new Map(regions.map((r) => [r.name, r]));

  // Build threat markers from regions + geo data
  const markers = useCallback((): ThreatMarker[] => {
    const result: ThreatMarker[] = [];
    for (const [regionName, geo] of Object.entries(REGION_GEO)) {
      const region = regionMap.get(regionName);
      if (!region) continue;
      const severity = getSeverity(region.riskScore);
      for (const m of geo.markers) {
        result.push({
          lat: m.lat,
          lng: m.lng,
          label: m.label,
          region: regionName,
          riskScore: region.riskScore,
          severity,
          eventCount: region.conflictCount,
        });
      }
    }
    return result;
  }, [regionMap]);

  // Resolve marker label → {lat, lng}
  const markerGeoMap = useCallback((): Map<string, { lat: number; lng: number }> => {
    const m = new Map<string, { lat: number; lng: number }>();
    for (const geo of Object.values(REGION_GEO)) {
      for (const p of geo.markers) m.set(p.label, { lat: p.lat, lng: p.lng });
    }
    return m;
  }, []);

  // ── Draw globe ───────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) * 0.38;

    ctx.clearRect(0, 0, W, H);

    // ── Atmosphere glow ──
    const atmosGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.2);
    atmosGrad.addColorStop(0, 'rgba(56,130,220,0.08)');
    atmosGrad.addColorStop(0.5, 'rgba(56,130,220,0.03)');
    atmosGrad.addColorStop(1, 'rgba(56,130,220,0)');
    ctx.fillStyle = atmosGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Globe sphere ──
    const globeGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
    globeGrad.addColorStop(0, '#1a2744');
    globeGrad.addColorStop(0.6, '#0f1b33');
    globeGrad.addColorStop(1, '#080e1e');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = globeGrad;
    ctx.fill();

    // Globe border ring
    ctx.strokeStyle = 'rgba(56,130,220,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const rotation = rotationRef.current;

    // ── Grid lines (latitude / longitude) ──
    ctx.strokeStyle = 'rgba(56,130,220,0.06)';
    ctx.lineWidth = 0.5;
    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lng = 0; lng <= 360; lng += 5) {
        const p3 = latLngTo3D(lat, lng, radius * 0.99);
        const p2 = projectTo2D(p3.x, p3.y, p3.z, cx, cy, rotation, radius);
        if (p2.visible) {
          if (!started) { ctx.moveTo(p2.sx, p2.sy); started = true; }
          else ctx.lineTo(p2.sx, p2.sy);
        } else { started = false; }
      }
      ctx.stroke();
    }
    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 5) {
        const p3 = latLngTo3D(lat, lng, radius * 0.99);
        const p2 = projectTo2D(p3.x, p3.y, p3.z, cx, cy, rotation, radius);
        if (p2.visible) {
          if (!started) { ctx.moveTo(p2.sx, p2.sy); started = true; }
          else ctx.lineTo(p2.sx, p2.sy);
        } else { started = false; }
      }
      ctx.stroke();
    }

    // ── Continent outlines ──
    for (const continent of CONTINENT_PATHS) {
      ctx.beginPath();
      let started = false;
      let lastVisible = false;
      for (let i = 0; i <= continent.points.length; i++) {
        const pt = continent.points[i % continent.points.length];
        const p3 = latLngTo3D(pt[0], pt[1], radius * 0.98);
        const p2 = projectTo2D(p3.x, p3.y, p3.z, cx, cy, rotation, radius);
        if (p2.visible) {
          if (!started) { ctx.moveTo(p2.sx, p2.sy); started = true; }
          else ctx.lineTo(p2.sx, p2.sy);
          lastVisible = true;
        } else {
          if (lastVisible) started = false;
          lastVisible = false;
        }
      }
      ctx.strokeStyle = 'rgba(100,160,255,0.12)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Fill continents with subtle color
      ctx.beginPath();
      started = false;
      for (const pt of continent.points) {
        const p3 = latLngTo3D(pt[0], pt[1], radius * 0.97);
        const p2 = projectTo2D(p3.x, p3.y, p3.z, cx, cy, rotation, radius);
        if (p2.visible) {
          if (!started) { ctx.moveTo(p2.sx, p2.sy); started = true; }
          else ctx.lineTo(p2.sx, p2.sy);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(100,160,255,0.03)';
      ctx.fill();
    }

    // ── Arc connections between hotspots ──
    const geoMap = markerGeoMap();
    for (const [fromLabel, toLabel] of ARC_CONNECTIONS) {
      const from = geoMap.get(fromLabel);
      const to = geoMap.get(toLabel);
      if (!from || !to) continue;

      const from3 = latLngTo3D(from.lat, from.lng, radius);
      const to3 = latLngTo3D(to.lat, to.lng, radius);
      const mid3 = {
        x: (from3.x + to3.x) / 2,
        y: (from3.y + to3.y) / 2 + radius * 0.2,
        z: (from3.z + to3.z) / 2,
      };

      const from2 = projectTo2D(from3.x, from3.y, from3.z, cx, cy, rotation, radius);
      const to2 = projectTo2D(to3.x, to3.y, to3.z, cx, cy, rotation, radius);
      const mid2 = projectTo2D(mid3.x, mid3.y, mid3.z, cx, cy, rotation, radius);

      if (from2.visible && to2.visible) {
        ctx.beginPath();
        ctx.moveTo(from2.sx, from2.sy);
        ctx.quadraticCurveTo(mid2.sx, mid2.sy, to2.sx, to2.sy);
        ctx.strokeStyle = 'rgba(206,45,72,0.15)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // ── Threat markers ──
    const allMarkers = markers();
    const visibleMarkers: { marker: ThreatMarker; sx: number; sy: number; scale: number; z: number }[] = [];

    for (const marker of allMarkers) {
      const p3 = latLngTo3D(marker.lat, marker.lng, radius * 1.01);
      const p2 = projectTo2D(p3.x, p3.y, p3.z, cx, cy, rotation, radius);
      if (p2.visible) {
        visibleMarkers.push({ marker, sx: p2.sx, sy: p2.sy, scale: p2.scale, z: p2.z });
      }
    }

    // Sort by z (back to front)
    visibleMarkers.sort((a, b) => a.z - b.z);

    for (const { marker, sx, sy, scale } of visibleMarkers) {
      const colors = SEVERITY_COLORS[marker.severity];
      const isSelected = selectedMarker?.label === marker.label && selectedMarker?.region === marker.region;
      const isHovered = hoveredMarker?.label === marker.label && hoveredMarker?.region === marker.region;
      const baseR = (isSelected ? 5 : isHovered ? 4.5 : 3.5) * (scale / 220);
      const pulsePhase = (time * 0.003 + marker.lat * 0.1 + marker.lng * 0.05) % (Math.PI * 2);
      const pulseR = baseR + Math.sin(pulsePhase) * 1.2;

      // Outer glow ring (pulsing)
      const ringR = pulseR * 2.5 + Math.sin(pulsePhase) * 3;
      ctx.beginPath();
      ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
      ctx.fillStyle = colors.ring;
      ctx.fill();

      // Inner glow
      const innerGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, pulseR * 1.5);
      innerGrad.addColorStop(0, colors.glow);
      innerGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, pulseR * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(sx, sy, baseR, 0, Math.PI * 2);
      ctx.fillStyle = colors.fill;
      ctx.fill();

      // White center
      ctx.beginPath();
      ctx.arc(sx, sy, baseR * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();

      // Label (only for selected/hovered or larger markers)
      if (isSelected || isHovered) {
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(marker.label, sx, sy - pulseR * 2 - 8);

        ctx.font = '10px system-ui, sans-serif';
        ctx.fillStyle = colors.fill;
        ctx.fillText(`${marker.riskScore.toFixed(0)} - ${marker.severity.toUpperCase()}`, sx, sy - pulseR * 2 + 4);
      }
    }

    // ── Highlight ring for selected ──
    if (selectedMarker) {
      const p3 = latLngTo3D(selectedMarker.lat, selectedMarker.lng, radius * 1.01);
      const p2 = projectTo2D(p3.x, p3.y, p3.z, cx, cy, rotation, radius);
      if (p2.visible) {
        const colors = SEVERITY_COLORS[selectedMarker.severity];
        ctx.beginPath();
        ctx.arc(p2.sx, p2.sy, 14, 0, Math.PI * 2);
        ctx.strokeStyle = colors.fill;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosshair lines
        const ch = 20;
        ctx.strokeStyle = `${colors.fill}66`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p2.sx - ch, p2.sy);
        ctx.lineTo(p2.sx - 8, p2.sy);
        ctx.moveTo(p2.sx + 8, p2.sy);
        ctx.lineTo(p2.sx + ch, p2.sy);
        ctx.moveTo(p2.sx, p2.sy - ch);
        ctx.lineTo(p2.sx, p2.sy - 8);
        ctx.moveTo(p2.sx, p2.sy + 8);
        ctx.lineTo(p2.sx, p2.sy + ch);
        ctx.stroke();
      }
    }

    // ── "Lights" on dark side (city lights effect) ──
    for (const continent of CONTINENT_PATHS) {
      for (let i = 0; i < continent.points.length; i += 3) {
        const pt = continent.points[i];
        const p3 = latLngTo3D(pt[0], pt[1], radius * 0.98);
        const p2 = projectTo2D(p3.x, p3.y, p3.z, cx, cy, rotation, radius);
        if (p2.visible && p2.z < 0) {
          ctx.beginPath();
          ctx.arc(p2.sx, p2.sy, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,220,150,${0.08 + Math.random() * 0.08})`;
          ctx.fill();
        }
      }
    }
  }, [markers, markerGeoMap, selectedMarker, hoveredMarker, time]);

  // ── Animation loop ───────────────────────────────────────────────────
  useEffect(() => {
    const animate = () => {
      if (isSpinning) {
        rotationRef.current += 0.002;
      }
      setTime((t) => t + 16);
      draw();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw, isSpinning]);

  // ── Click handler ────────────────────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.38;

      let closest: ThreatMarker | null = null;
      let closestDist = 20;

      for (const m of markers()) {
        const p3 = latLngTo3D(m.lat, m.lng, radius * 1.01);
        const p2 = projectTo2D(p3.x, p3.y, p3.z, cx, cy, rotationRef.current, radius);
        if (!p2.visible) continue;
        const dist = Math.sqrt((mx - p2.sx) ** 2 + (my - p2.sy) ** 2);
        if (dist < closestDist) {
          closestDist = dist;
          closest = m;
        }
      }
      setSelectedMarker(closest);
    },
    [markers]
  );

  // ── Mouse move handler ──────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.38;

      let closest: ThreatMarker | null = null;
      let closestDist = 15;

      for (const m of markers()) {
        const p3 = latLngTo3D(m.lat, m.lng, radius * 1.01);
        const p2 = projectTo2D(p3.x, p3.y, p3.z, cx, cy, rotationRef.current, radius);
        if (!p2.visible) continue;
        const dist = Math.sqrt((mx - p2.sx) ** 2 + (my - p2.sy) ** 2);
        if (dist < closestDist) {
          closestDist = dist;
          closest = m;
        }
      }
      setHoveredMarker(closest);
      canvas.style.cursor = closest ? 'pointer' : 'grab';
    },
    [markers]
  );

  // ── Drag to rotate ──────────────────────────────────────────────────
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    setIsSpinning(false);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastX.current;
      rotationRef.current += dx * 0.005;
      lastX.current = e.clientX;
    },
    []
  );

  // ── Region-related articles ─────────────────────────────────────────
  const regionArticles = selectedMarker
    ? articles.filter((a) => {
        const tags = a.tags ?? [];
        const regionKey = selectedMarker.region.toLowerCase();
        return tags.some(
          (t) =>
            t.includes(regionKey) ||
            t === 'middle-east' ||
            t === 'eastern-europe' ||
            t === 'south-china-sea' ||
            t === 'south-asia' ||
            t === 'arctic' ||
            t === 'east-africa'
        );
      })
    : [];

  return (
    <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-red-400" />
            Global Threat Map
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={() => setIsSpinning((s) => !s)}
              title={isSpinning ? 'Pause rotation' : 'Resume rotation'}
            >
              {isSpinning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={() => {
                rotationRef.current = 0;
                setIsSpinning(true);
                setSelectedMarker(null);
              }}
              title="Reset view"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="relative w-full" style={{ paddingBottom: '56%' }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full rounded-lg"
            style={{ cursor: 'grab' }}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Selected marker info panel */}
          {selectedMarker && (
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-sm border border-slate-700/60 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" style={{ color: SEVERITY_COLORS[selectedMarker.severity].fill }} />
                  <span className="text-sm font-semibold text-white">{selectedMarker.label}</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border"
                  style={{
                    color: SEVERITY_COLORS[selectedMarker.severity].fill,
                    borderColor: SEVERITY_COLORS[selectedMarker.severity].fill,
                    backgroundColor: `${SEVERITY_COLORS[selectedMarker.severity].fill}15`,
                  }}
                >
                  {selectedMarker.severity.toUpperCase()} - {selectedMarker.riskScore.toFixed(0)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>Region: {selectedMarker.region}</span>
                <span>|</span>
                <span>{selectedMarker.eventCount} active events</span>
                <span>|</span>
                <span>
                  {selectedMarker.lat.toFixed(1)}, {selectedMarker.lng.toFixed(1)}
                </span>
              </div>
              {regionArticles.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700/40">
                  <p className="text-[10px] text-slate-500 mb-1">RELATED INTELLIGENCE</p>
                  {regionArticles.slice(0, 2).map((a) => (
                    <p key={a.id} className="text-[11px] text-slate-300 line-clamp-1 hover:text-white cursor-pointer">
                      &bull; {a.title}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spin indicator */}
          {isSpinning && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-900/60 backdrop-blur-sm rounded-full px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              LIVE TRACKING
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {Object.entries(SEVERITY_COLORS).map(([label, { fill }]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: fill, boxShadow: `0 0 6px ${fill}` }} />
              <span className="text-[10px] text-slate-400 capitalize">{label}</span>
            </div>
          ))}
          <span className="text-[10px] text-slate-600">|</span>
          <span className="text-[10px] text-slate-500">Click markers for details | Drag to rotate</span>
        </div>
      </CardContent>
    </Card>
  );
}

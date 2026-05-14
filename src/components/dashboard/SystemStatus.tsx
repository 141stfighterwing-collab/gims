'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface SystemStatusItem {
  name: string;
  status: 'nominal' | 'degraded' | 'offline';
  value: number; // 0-100
}

const SYSTEM_ITEMS: SystemStatusItem[] = [
  { name: 'Data Pipeline', status: 'nominal', value: 98 },
  { name: 'API Gateway', status: 'nominal', value: 100 },
  { name: 'Scoring Engine', status: 'nominal', value: 95 },
  { name: 'Forecast Engine', status: 'nominal', value: 97 },
];

const STATUS_CONFIG = {
  nominal: { color: '#00e676', label: 'NOMINAL' },
  degraded: { color: '#ff9800', label: 'DEGRADED' },
  offline: { color: '#f44336', label: 'OFFLINE' },
};

export function SystemStatus() {
  const [items, setItems] = useState(SYSTEM_ITEMS);

  // Simulate minor value fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          value: Math.min(100, Math.max(80, item.value + (Math.random() - 0.5) * 2)),
        }))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gims-panel p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-3.5 h-3.5 text-[#00bcd4]" />
        <h3 className="gims-panel-header">System Status</h3>
      </div>

      {/* Status rows */}
      <div className="space-y-3">
        {items.map((item) => {
          const config = STATUS_CONFIG[item.status];
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full status-pulse"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-[11px] text-[#7b8ca8] font-medium">
                    {item.name}
                  </span>
                </div>
                <span
                  className="text-[9px] font-bold tracking-wider"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1 bg-[#0a0e17] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: config.color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

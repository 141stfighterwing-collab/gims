'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchArticles, type ArticleData } from '@/lib/api';

interface IntelEntry {
  timestamp: string;
  text: string;
  severity: 'critical' | 'elevated' | 'nominal';
}

function formatArticleAsLog(article: ArticleData): IntelEntry {
  const date = new Date(article.publishedAt);
  const ts = date.toISOString().slice(11, 19);

  const tags = article.tags ?? [];
  let severity: IntelEntry['severity'] = 'nominal';
  if (tags.some((t) => ['nuclear', 'missile', 'attack', 'weapons'].includes(t))) {
    severity = 'critical';
  } else if (tags.some((t) => ['enrichment', 'procurement', 'military', 'conflict'].includes(t))) {
    severity = 'elevated';
  }

  // Extract source region keyword
  const sourceKeywords = ['PENTAGON', 'IRAN', 'CHINA', 'RUSSIA', 'NATO', 'UKRAINE', 'INDIA', 'JAPAN', 'UAE'];
  let source = 'INTEL';
  for (const kw of sourceKeywords) {
    if (article.title.toUpperCase().includes(kw)) {
      source = kw;
      break;
    }
  }

  // Truncate title to fit log style
  const text = `${source} ${article.title.length > 60 ? article.title.slice(0, 57) + '...' : article.title}`;

  return { timestamp: ts, text, severity };
}

export function IntelLog() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const { data: articlesData } = useQuery({
    queryKey: ['articles', 'intel-log'],
    queryFn: () => fetchArticles({ limit: 20 }),
    refetchInterval: 60000,
  });

  const entries = (articlesData?.articles ?? []).map(formatArticleAsLog);

  // Auto-scroll to bottom when entries length changes
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 20);
  };

  return (
    <div className="gims-panel p-4 flex flex-col" style={{ height: '280px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00bcd4]" />
          <h3 className="gims-panel-header">Intel Log</h3>
        </div>
        <span className="text-[9px] text-[#4a5568] font-tactical">
          {entries.length} ENTRIES
        </span>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar pr-1"
      >
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[11px] text-[#4a5568]">
            Awaiting intelligence data...
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div key={idx} className="intel-entry">
              <span className="intel-timestamp">[{entry.timestamp}]</span>
              <span
                className={
                  entry.severity === 'critical'
                    ? 'intel-severity-critical'
                    : entry.severity === 'elevated'
                    ? 'intel-severity-elevated'
                    : 'intel-severity-nominal'
                }
              >
                {entry.text}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Blinking cursor */}
      <div className="mt-1 flex items-center gap-1">
        <span className="text-[10px] text-[#00bcd4] font-tactical">&gt;</span>
        <div className="w-[6px] h-[12px] bg-[#00bcd4]/60 animate-pulse" />
      </div>
    </div>
  );
}

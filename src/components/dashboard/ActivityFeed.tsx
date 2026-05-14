'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { ArticleData } from '@/lib/api';
import { ExternalLink } from 'lucide-react';

interface ActivityFeedProps {
  articles: ArticleData[];
}

const tagColors: Record<string, string> = {
  'military-contracts': 'bg-red-900/50 text-red-300 border-red-700/50',
  'missiles': 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  'procurement': 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  'drone-technology': 'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
  'china': 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  'wireless-power': 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  'nuclear': 'bg-red-900/50 text-red-300 border-red-700/50',
  'iran': 'bg-red-900/50 text-red-300 border-red-700/50',
  'proliferation': 'bg-purple-900/50 text-purple-300 border-purple-700/50',
  'ukraine': 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  'russia': 'bg-slate-700/50 text-slate-300 border-slate-600/50',
  'hypersonic': 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  'ai': 'bg-violet-900/50 text-violet-300 border-violet-700/50',
  'cyber': 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  'middle-east': 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  'nato': 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
};

function getTagColor(tag: string): string {
  return tagColors[tag] ?? 'bg-slate-700/50 text-slate-300 border-slate-600/50';
}

export function ActivityFeed({ articles }: ActivityFeedProps) {
  return (
    <Card className="bg-slate-800/60 border-slate-700/50 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {articles.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">No recent activity</p>
        )}
        {articles.map((article) => (
          <div
            key={article.id}
            className="group p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                {article.title}
              </h4>
              <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 mt-0.5 shrink-0 transition-colors" />
            </div>
            <p className="text-xs text-slate-400 mb-2 line-clamp-2">
              {article.summary}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {(article.tags ?? []).slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 border ${getTagColor(tag)}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                {format(new Date(article.publishedAt), 'MMM d')}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

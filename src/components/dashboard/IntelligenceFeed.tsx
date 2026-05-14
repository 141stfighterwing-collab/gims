'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ExternalLink, AlertTriangle } from 'lucide-react';
import { fetchArticles, type ArticleData } from '@/lib/api';
import { format } from 'date-fns';

const TAG_OPTIONS = [
  'All',
  'military-contracts',
  'missiles',
  'nuclear',
  'iran',
  'china',
  'ukraine',
  'russia',
  'hypersonic',
  'ai',
  'drone-technology',
  'cyber',
  'nato',
  'middle-east',
  'south-china-sea',
];

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
  'autonomous-systems': 'bg-violet-900/50 text-violet-300 border-violet-700/50',
  'cyber': 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  'middle-east': 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  'nato': 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
  'defense-contracts': 'bg-red-900/50 text-red-300 border-red-700/50',
  'defense-spending': 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
  'us': 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  'technology': 'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
  'military-tech': 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  'breakthrough': 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  'houthi': 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  'red-sea': 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  'shipping': 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  'iran-proxy': 'bg-red-900/50 text-red-300 border-red-700/50',
  'maritime': 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  'europe': 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
  'military-budget': 'bg-red-900/50 text-red-300 border-red-700/50',
  'critical-infrastructure': 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  'espionage': 'bg-purple-900/50 text-purple-300 border-purple-700/50',
  'india': 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  'pakistan': 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  'kashmir': 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  'nuclear': 'bg-red-900/50 text-red-300 border-red-700/50',
  'south-asia': 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  'arctic': 'bg-sky-900/50 text-sky-300 border-sky-700/50',
  'militarization': 'bg-red-900/50 text-red-300 border-red-700/50',
  'strategic-competition': 'bg-violet-900/50 text-violet-300 border-violet-700/50',
  'south-china-sea': 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  'philippines': 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  'territorial-dispute': 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  'counteroffensive': 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  'eastern-europe': 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
  'weapons-test': 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  'iaea': 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
};

function getTagColor(tag: string): string {
  return tagColors[tag] ?? 'bg-slate-700/50 text-slate-300 border-slate-600/50';
}

const PAGE_SIZE = 5;

export function IntelligenceFeed() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [offset, setOffset] = useState(0);
  const [searchInput, setSearchInput] = useState('');

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchArticles({
        search: search || undefined,
        tag: activeTag !== 'All' ? activeTag : undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setArticles(data.articles);
      setTotal(data.total);
    } catch {
      console.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [search, activeTag, offset]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = () => {
    setSearch(searchInput);
    setOffset(0);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search articles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
        >
          Search
        </button>
      </div>

      {/* Tag Filters */}
      <div className="flex flex-wrap gap-1.5">
        {TAG_OPTIONS.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={`cursor-pointer text-xs transition-all ${
              activeTag === tag
                ? 'bg-slate-600/80 text-white border-slate-500'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
            }`}
            onClick={() => {
              setActiveTag(tag);
              setOffset(0);
            }}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-slate-800/60 border-slate-700/50">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4 bg-slate-700 mb-3" />
                <Skeleton className="h-4 w-full bg-slate-700 mb-2" />
                <Skeleton className="h-4 w-2/3 bg-slate-700" />
              </CardContent>
            </Card>
          ))
        ) : articles.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50">
            <CardContent className="p-8 text-center text-slate-500">
              No articles found matching your criteria
            </CardContent>
          </Card>
        ) : (
          articles.map((article) => (
            <Card
              key={article.id}
              className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600/50 transition-colors"
            >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-semibold text-slate-100 leading-snug">
                    {article.title}
                  </h3>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-400">{article.source}</span>
                  <span>•</span>
                  <span>{format(new Date(article.publishedAt), 'MMMM d, yyyy')}</span>
                </div>

                {/* Summary */}
                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                  {article.summary}
                </p>

                {/* Why This Matters */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-900/10 border border-amber-800/20 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Why This Matters
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {article.whyMatters}
                    </p>
                  </div>
                </div>

                {/* Tags & Impact */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-wrap gap-1">
                    {(article.tags ?? []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 border ${getTagColor(tag)}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {Object.entries(article.indexImpact ?? {}).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400"
                      >
                        {key}: +{(value as number * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
            className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400">
            Page {Math.floor(offset / PAGE_SIZE) + 1} of {totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={offset + PAGE_SIZE >= total}
            className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

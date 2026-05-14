'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  BarChart3,
  Newspaper,
  TrendingUp,
  FileText,
  Shield,
  Clock,
  Radio,
} from 'lucide-react';
import { IndexCard } from '@/components/dashboard/IndexCard';
import { WorldMap } from '@/components/dashboard/WorldMap';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { IndicesDeepDive } from '@/components/dashboard/IndicesDeepDive';
import { IntelligenceFeed } from '@/components/dashboard/IntelligenceFeed';
import { ForecastCenter } from '@/components/dashboard/ForecastCenter';
import { DailyBrief } from '@/components/dashboard/DailyBrief';
import {
  fetchIndices,
  fetchIndexHistory,
  fetchArticles,
  fetchRegions,
  type IndexData,
  type IndexHistoryPoint,
} from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const TABS = [
  { value: 'overview', label: 'Global Overview', icon: Globe },
  { value: 'indices', label: 'Indices Deep Dive', icon: BarChart3 },
  { value: 'feed', label: 'Intelligence Feed', icon: Newspaper },
  { value: 'forecasts', label: 'Forecast Center', icon: TrendingUp },
  { value: 'brief', label: 'Daily Brief', icon: FileText },
];

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: indices, isLoading: indicesLoading } = useQuery({
    queryKey: ['indices'],
    queryFn: fetchIndices,
  });

  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  });

  const { data: recentArticles, isLoading: articlesLoading } = useQuery({
    queryKey: ['articles', 'recent'],
    queryFn: () => fetchArticles({ limit: 5 }),
  });

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0f1e]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-600/20 rounded-lg">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    GIMS
                  </h1>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest -mt-0.5">
                    Global Intelligence Monitoring System
                  </p>
                </div>
              </div>
              <Badge className="bg-red-600/15 text-red-400 border-red-800/30 text-[10px] ml-2 hidden sm:flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                <Radio className="h-3 w-3 text-green-500" />
                <span>SYSTEMS NOMINAL</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-mono">
                  {currentTime.toISOString().replace('T', ' ').slice(0, 19)} UTC
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-800/60 border border-slate-700/50 p-1 w-full sm:w-auto flex">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 flex-1 sm:flex-initial justify-center"
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence>
            {/* Tab 1: Global Overview */}
            <TabsContent value="overview" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
                hidden={false}
              >
                {/* Index Score Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {indicesLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-[120px] bg-slate-800" />
                      ))
                    : indices?.map((index) => (
                        <IndexCardWithHistory key={index.key} index={index} />
                      ))}
                </div>

                {/* World Map + Activity Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    {regionsLoading ? (
                      <Skeleton className="h-[400px] bg-slate-800" />
                    ) : regions ? (
                      <WorldMap regions={regions} />
                    ) : null}
                  </div>
                  <div>
                    {articlesLoading ? (
                      <Skeleton className="h-[400px] bg-slate-800" />
                    ) : recentArticles ? (
                      <ActivityFeed articles={recentArticles.articles} />
                    ) : null}
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Tab 2: Indices Deep Dive */}
            <TabsContent value="indices" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                hidden
              >
                <IndicesDeepDive />
              </motion.div>
            </TabsContent>

            {/* Tab 3: Intelligence Feed */}
            <TabsContent value="feed" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                hidden
              >
                <IntelligenceFeed />
              </motion.div>
            </TabsContent>

            {/* Tab 4: Forecast Center */}
            <TabsContent value="forecasts" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                hidden
              >
                <ForecastCenter />
              </motion.div>
            </TabsContent>

            {/* Tab 5: Daily Brief */}
            <TabsContent value="brief" forceMount>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                hidden
              >
                <DailyBrief />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-8">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-[10px] text-slate-600">
            <span>GIMS v1.0 // Global Intelligence Monitoring System</span>
            <span>CLASSIFICATION: UNCLASSIFIED // FOUO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Wrapper component to fetch history for each IndexCard
function IndexCardWithHistory({ index }: { index: IndexData }) {
  const { data: history } = useQuery({
    queryKey: ['indexHistory', index.key],
    queryFn: () => fetchIndexHistory(index.key),
  });

  return <IndexCard index={index} history={history} />;
}

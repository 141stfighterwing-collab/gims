'use client';

import { useState, useEffect } from 'react';
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
import { GlobalThreatMap } from '@/components/dashboard/GlobalThreatMap';
import { WorldwideAlerts } from '@/components/dashboard/WorldwideAlerts';
import { IndicesDeepDive } from '@/components/dashboard/IndicesDeepDive';
import { IntelligenceFeed } from '@/components/dashboard/IntelligenceFeed';
import { ForecastCenter } from '@/components/dashboard/ForecastCenter';
import { DailyBrief } from '@/components/dashboard/DailyBrief';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SystemStatus } from '@/components/dashboard/SystemStatus';
import { IntelLog } from '@/components/dashboard/IntelLog';
import {
  fetchIndices,
  fetchIndexHistory,
  fetchArticles,
  fetchRegions,
  fetchForecasts,
  type IndexData,
} from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const TABS = [
  { value: 'overview', label: 'Overview', icon: Globe },
  { value: 'indices', label: 'Indices', icon: BarChart3 },
  { value: 'feed', label: 'Intel Feed', icon: Newspaper },
  { value: 'forecasts', label: 'Forecasts', icon: TrendingUp },
  { value: 'brief', label: 'Daily Brief', icon: FileText },
];

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

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
    queryFn: () => fetchArticles({ limit: 20 }),
  });

  const { data: forecasts } = useQuery({
    queryKey: ['forecasts'],
    queryFn: fetchForecasts,
  });

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white flex">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content area - offset for sidebar */}
      <div className="flex-1 md:ml-16 flex flex-col min-h-screen pb-16 md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0d1220] border-b border-[#1e2633]">
          <div className="px-4 lg:px-6 py-2.5">
            <div className="flex items-center justify-between">
              {/* Left: Logo + Title */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-wide">
                    GIMS<span className="text-[#00bcd4]">.</span>
                  </h1>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] text-[#4a5568] uppercase tracking-[0.15em] font-semibold">
                    War Room
                  </p>
                </div>
              </div>

              {/* Center: Tab Navigation */}
              <nav className="hidden md:flex items-center gap-0">
                {TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`
                      relative px-4 py-2 text-[11px] uppercase tracking-[0.12em] font-semibold transition-all duration-200
                      ${activeTab === tab.value
                        ? 'text-[#00bcd4]'
                        : 'text-[#4a5568] hover:text-[#7b8ca8]'
                      }
                    `}
                  >
                    {tab.label}
                    {activeTab === tab.value && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00bcd4] rounded-t" />
                    )}
                  </button>
                ))}
              </nav>

              {/* Right: Status indicators */}
              <div className="flex items-center gap-4">
                {/* Systems Status */}
                <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-[#7b8ca8]">
                  <Radio className="h-3 w-3 text-[#00e676]" />
                  <span className="uppercase tracking-wider font-semibold">Systems Nominal</span>
                </div>

                {/* UTC Clock */}
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#7b8ca8]">
                  <Clock className="h-3 w-3 text-[#4a5568]" />
                  <span className="font-tactical tracking-wider">
                    {currentTime.toISOString().replace('T', ' ').slice(0, 19)} UTC
                  </span>
                </div>

                {/* Live Badge */}
                <Badge className="bg-[#f44336]/15 text-[#f44336] border-[#f44336]/30 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f44336] live-pulse" />
                  Live
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Tab 1: Global Overview */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="p-4 lg:p-6 space-y-4"
              >
                {/* Row 1: Index Score Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                  {indicesLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-[72px] bg-[#121824]" />
                      ))
                    : indices?.map((index) => (
                        <IndexCardWithHistory key={index.key} index={index} />
                      ))}
                </div>

                {/* Row 2: Three-column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column - System Status + Intel Log */}
                  <div className="lg:col-span-3 xl:col-span-2 space-y-4">
                    <SystemStatus />
                    <IntelLog />
                  </div>

                  {/* Center Column - Globe */}
                  <div className="lg:col-span-5 xl:col-span-6">
                    <div className="h-full min-h-[400px] lg:min-h-[520px]">
                      {(regionsLoading || articlesLoading) ? (
                        <Skeleton className="h-full bg-[#121824]" />
                      ) : regions && recentArticles ? (
                        <GlobalThreatMap regions={regions} articles={recentArticles.articles} />
                      ) : null}
                    </div>
                  </div>

                  {/* Right Column - Worldwide Alerts */}
                  <div className="lg:col-span-4">
                    <div className="h-full min-h-[400px] lg:min-h-[520px]">
                      {(regionsLoading || articlesLoading || !forecasts) ? (
                        <Skeleton className="h-full bg-[#121824]" />
                      ) : (
                        <WorldwideAlerts />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Indices Deep Dive */}
            {activeTab === 'indices' && (
              <motion.div
                key="indices"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="p-4 lg:p-6"
              >
                <IndicesDeepDive />
              </motion.div>
            )}

            {/* Tab 3: Intelligence Feed */}
            {activeTab === 'feed' && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="p-4 lg:p-6"
              >
                <IntelligenceFeed />
              </motion.div>
            )}

            {/* Tab 4: Forecast Center */}
            {activeTab === 'forecasts' && (
              <motion.div
                key="forecasts"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="p-4 lg:p-6"
              >
                <ForecastCenter />
              </motion.div>
            )}

            {/* Tab 5: Daily Brief */}
            {activeTab === 'brief' && (
              <motion.div
                key="brief"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="p-4 lg:p-6"
              >
                <DailyBrief />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#1e2633] mt-auto hidden md:block">
          <div className="px-4 lg:px-6 py-2.5">
            <div className="flex items-center justify-between text-[9px] text-[#2a3548] uppercase tracking-wider">
              <span>GIMS v1.0 // Global Intelligence Monitoring System</span>
              <span>Classification: Unclassified // FOUO</span>
            </div>
          </div>
        </footer>
      </div>
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

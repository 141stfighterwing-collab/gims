'use client';

import {
  LayoutGrid,
  Shield,
  BarChart3,
  Newspaper,
  TrendingUp,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  value: string;
  icon: LucideIcon;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { value: 'overview', icon: LayoutGrid, label: 'Dashboard' },
  { value: 'threatmap', icon: Shield, label: 'Threat Map' },
  { value: 'indices', icon: BarChart3, label: 'Indices' },
  { value: 'feed', icon: Newspaper, label: 'Intel Feed' },
  { value: 'forecasts', icon: TrendingUp, label: 'Forecasts' },
  { value: 'brief', icon: FileText, label: 'Daily Brief' },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  // Map threatmap tab to overview (same view) for sidebar
  const normalizedTab = activeTab === 'threatmap' ? 'overview' : activeTab;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col items-center w-16 h-screen bg-[#0d1220] border-r border-[#1e2633] fixed left-0 top-0 z-50">
        {/* Logo */}
        <div className="flex flex-col items-center pt-4 pb-6 border-b border-[#1e2633] w-full">
          <div className="relative w-8 h-8 flex items-center justify-center mb-1">
            <Shield className="w-5 h-5 text-[#00bcd4]" />
            <div className="absolute inset-0 rounded-full bg-[#00bcd4]/10" />
          </div>
          <span className="text-[8px] font-bold text-[#00bcd4] tracking-[0.2em]">
            GIMS
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col items-center gap-1 py-4 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = normalizedTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onTabChange(item.value)}
                title={item.label}
                className={`
                  relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group
                  ${isActive
                    ? 'bg-[#00bcd4]/15 text-[#00bcd4]'
                    : 'text-[#4a5568] hover:text-[#7b8ca8] hover:bg-[#1e2633]/50'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#00bcd4] rounded-r-full" />
                )}
                <item.icon className="w-[18px] h-[18px]" />
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#1e2633] text-[11px] text-[#7b8ca8] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-[#1e2633] z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-1 pb-4 border-t border-[#1e2633] w-full pt-4">
          <button
            title="Settings"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#4a5568] hover:text-[#7b8ca8] hover:bg-[#1e2633]/50 transition-all"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
          <button
            title="Help"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#4a5568] hover:text-[#7b8ca8] hover:bg-[#1e2633]/50 transition-all"
          >
            <HelpCircle className="w-[18px] h-[18px]" />
          </button>
          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-[#1e2633] border border-[#2a3548] flex items-center justify-center mt-1">
            <span className="text-[9px] font-bold text-[#7b8ca8]">OP-1</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1220] border-t border-[#1e2633] flex items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = normalizedTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={`
                flex flex-col items-center gap-0.5 py-1 px-2 rounded-md transition-all
                ${isActive ? 'text-[#00bcd4]' : 'text-[#4a5568]'}
              `}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-[9px] leading-none">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

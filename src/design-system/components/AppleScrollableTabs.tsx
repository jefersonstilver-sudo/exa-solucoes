import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface AppleScrollableTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const AppleScrollableTabs = ({ 
  tabs, 
  activeTab, 
  onChange,
  className 
}: AppleScrollableTabsProps) => (
  <div className={cn("relative", className)}>
    {/* Scroll container with hidden scrollbar */}
    <div className="overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex gap-2 min-w-max">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                "min-w-[80px] touch-manipulation whitespace-nowrap",
                "duration-normal ease-apple",
                activeTab === tab.id
                  ? "bg-[hsl(var(--exa-red))] text-white shadow-lg"
                  : "bg-white/80 text-gray-600 hover:bg-white border border-gray-200"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {Icon && <Icon className="w-4 h-4" />}
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
    {/* Fade indicator on right */}
    <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[hsl(var(--apple-gray-50))] pointer-events-none sm:hidden" />
  </div>
);

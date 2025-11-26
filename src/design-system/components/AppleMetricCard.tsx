import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface AppleMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const AppleMetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'text-[hsl(var(--exa-red))]',
  trend,
  className 
}: AppleMetricCardProps) => {
  return (
    <div className={cn(
      'bg-white/90 backdrop-blur-xl border border-white/40',
      'rounded-2xl p-4 sm:p-6',
      'shadow-[var(--shadow-glass)]',
      'hover:scale-[1.02] hover:shadow-[var(--shadow-xl)]',
      'transition-all duration-normal ease-apple',
      'group',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[hsl(var(--apple-gray-500))] mb-2 truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-[hsl(var(--apple-gray-900))] group-hover:text-[hsl(var(--exa-red))] transition-colors truncate">
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-sm mt-2 font-medium",
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            )}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-lg bg-gray-50 border border-gray-100',
          iconColor,
          'group-hover:border-[hsl(var(--exa-red))] transition-colors flex-shrink-0'
        )}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};

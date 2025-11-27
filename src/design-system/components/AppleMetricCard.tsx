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
      'bg-gradient-to-br from-background via-background to-accent/5',
      'backdrop-blur-xl border border-border/40',
      'rounded-2xl p-4 sm:p-6',
      'shadow-lg hover:shadow-xl',
      'hover:scale-[1.02] hover:border-primary/20',
      'transition-all duration-300 ease-out',
      'relative overflow-hidden group',
      'before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:hover:opacity-100 before:transition-opacity',
      className
    )}>
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-2 truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
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
          'p-3 rounded-lg bg-primary/10 border border-primary/20',
          'group-hover:bg-primary/20 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20',
          'transition-all duration-300 flex-shrink-0'
        )}>
          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", iconColor)} />
        </div>
      </div>
    </div>
  );
};

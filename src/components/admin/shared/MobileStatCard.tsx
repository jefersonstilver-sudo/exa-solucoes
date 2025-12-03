import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileStatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'text-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
};

const variantIconBg = {
  default: 'bg-gray-100 dark:bg-gray-800',
  success: 'bg-emerald-50 dark:bg-emerald-900/30',
  warning: 'bg-amber-50 dark:bg-amber-900/30',
  danger: 'bg-red-50 dark:bg-red-900/30',
  info: 'bg-blue-50 dark:bg-blue-900/30',
};

export const MobileStatCard: React.FC<MobileStatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className
}) => {
  return (
    <div className={cn(
      "glass-card-mobile-subtle p-3 flex flex-col gap-1.5",
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {Icon && (
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center",
            variantIconBg[variant]
          )}>
            <Icon className={cn("w-3.5 h-3.5", variantStyles[variant])} />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className={cn(
          "text-xl font-bold leading-none",
          variantStyles[variant]
        )}>
          {value}
        </span>
        {trend && (
          <span className={cn(
            "text-[10px] font-medium",
            trend.isPositive ? "text-emerald-600" : "text-red-600"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
    </div>
  );
};

export const MobileStatsGrid: React.FC<{ children: React.ReactNode; columns?: 2 | 3 | 4 }> = ({ 
  children, 
  columns = 3 
}) => {
  return (
    <div className={cn(
      "grid gap-2 px-3 py-2",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-3",
      columns === 4 && "grid-cols-4"
    )}>
      {children}
    </div>
  );
};

export default MobileStatCard;

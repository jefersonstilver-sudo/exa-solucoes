import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  badge?: {
    value: string | number;
    variant: 'danger' | 'success' | 'warning' | 'info';
  };
  onClick?: () => void;
  className?: string;
}

export const MiniStatCard = ({
  title,
  value,
  icon: Icon,
  badge,
  onClick,
  className
}: MiniStatCardProps) => {
  const badgeColors = {
    danger: 'bg-red-500 text-white animate-pulse',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex-shrink-0 w-[140px] h-20 md:h-24 p-3 md:p-4',
        'bg-white rounded-2xl border border-gray-200',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        onClick && 'cursor-pointer active:scale-95',
        'snap-center',
        className
      )}
    >
      {badge && (
        <div className={cn(
          'absolute -top-2 -right-2 h-6 w-6 rounded-full',
          'flex items-center justify-center text-xs font-bold',
          badgeColors[badge.variant]
        )}>
          {badge.value}
        </div>
      )}
      
      <div className="flex items-start gap-2">
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
          <Icon className="w-4 h-4 text-gray-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate">
            {title}
          </p>
          <p className="text-base md:text-lg font-bold text-gray-900 truncate mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

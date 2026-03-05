import React from 'react';
import { cn } from '@/lib/utils';

interface AdvertiserOrderStatsProps {
  active: number;
  pending: number;
  completed: number;
  className?: string;
}

export const AdvertiserOrderStats: React.FC<AdvertiserOrderStatsProps> = ({
  active,
  pending,
  completed,
  className
}) => {
  const stats = [
    { label: 'Ativas', value: active, accent: 'text-green-600' },
    { label: 'Pendentes', value: pending, accent: 'text-blue-600' },
    { label: 'Concluídas', value: completed, accent: 'text-muted-foreground' },
  ];

  return (
    <div className={cn('grid grid-cols-3 gap-2 sm:gap-3', className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border/40 rounded-xl p-3 sm:p-4 shadow-sm"
        >
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1">
            {stat.label}
          </p>
          <p className={cn('text-2xl sm:text-3xl font-bold', stat.accent)}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

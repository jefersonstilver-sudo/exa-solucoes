import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardLargeProps {
  label: string;
  value: string;
  variation?: number | null;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatsCardLarge: React.FC<StatsCardLargeProps> = ({
  label,
  value,
  variation,
  icon: Icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary'
}) => {
  const isPositive = variation && variation > 0;
  const isNegative = variation && variation < 0;

  return (
    <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconBgColor)}>
            <Icon className={cn("w-4.5 h-4.5", iconColor)} />
          </div>
        </div>
        
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-foreground tracking-tight">
            {value}
          </span>
          
          {variation !== null && variation !== undefined && (
            <div className={cn(
              "flex items-center gap-0.5 text-xs font-semibold mb-1",
              isPositive && "text-emerald-600",
              isNegative && "text-red-500"
            )}>
              {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
              {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{variation}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCardLarge;

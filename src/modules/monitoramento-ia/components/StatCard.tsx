/**
 * Component: StatCard
 * Card de estatística para dashboard
 */

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard = ({ title, value, icon: Icon, iconColor = 'text-primary', trend }: StatCardProps) => {
  return (
    <div className="bg-card rounded-[14px] border border-border p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
            {value}
          </p>
          {trend && (
            <p className={`text-sm mt-2 font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-muted border border-border ${iconColor} group-hover:border-primary transition-colors`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

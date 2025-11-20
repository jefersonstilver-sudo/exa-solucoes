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

export const StatCard = ({ title, value, icon: Icon, iconColor = 'text-[#9C1E1E]', trend }: StatCardProps) => {
  return (
    <div className="bg-module-card rounded-[14px] border border-module p-6 hover:shadow-lg hover:shadow-[#9C1E1E]/10 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-module-secondary mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-module-primary group-hover:text-[#9C1E1E] transition-colors">
            {value}
          </p>
          {trend && (
            <p className={`text-sm mt-2 font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-module-input border border-module ${iconColor} group-hover:border-module-accent transition-colors`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

/**
 * Component: StatCard
 * Card de estatística para dashboard
 */

import { LucideIcon } from 'lucide-react';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

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
  const { theme } = useModuleTheme();
  const tc = getThemeClasses(theme);
  
  return (
    <div className={`${tc.bgCard} rounded-xl ${tc.border} border p-6 hover:shadow-lg hover:shadow-[#9C1E1E]/10 transition-all duration-200 group`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${tc.textSecondary} mb-2`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${tc.textPrimary} group-hover:text-[#9C1E1E] transition-colors`}>
            {value}
          </p>
          {trend && (
            <p className={`text-sm mt-2 font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${tc.bgInput} ${tc.border} border ${iconColor} group-hover:${tc.borderAccent} transition-colors`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

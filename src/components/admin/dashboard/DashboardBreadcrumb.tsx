import React from 'react';
import { Calendar } from 'lucide-react';
import { ElegantPeriodType } from './ElegantPeriodButton';

interface DashboardBreadcrumbProps {
  periodFilter: ElegantPeriodType;
}

const DashboardBreadcrumb = ({ periodFilter }: DashboardBreadcrumbProps) => {
  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'today':
        return 'Hoje';
      case 'yesterday':
        return 'Ontem';
      case '3days':
        return 'Últimos 3 dias';
      case '7days':
        return 'Últimos 7 dias';
      case '30days':
        return 'Últimos 30 dias';
      case 'custom':
        return 'Customizado';
      default:
        return 'Hoje';
    }
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <Calendar className="h-3 w-3" />
      <span>{getPeriodLabel()}</span>
    </div>
  );
};

export default DashboardBreadcrumb;

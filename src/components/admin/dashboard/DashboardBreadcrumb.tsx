import React from 'react';
import { Calendar } from 'lucide-react';
import { PeriodType } from '@/components/admin/common/AdminPeriodSelector';

interface DashboardBreadcrumbProps {
  periodFilter: PeriodType;
}

const DashboardBreadcrumb = ({ periodFilter }: DashboardBreadcrumbProps) => {
  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'current_month':
        return 'Mês Atual';
      case 'last_month':
        return 'Mês Passado';
      case 'custom':
        return 'Customizado';
      case '30':
        return '30 dias';
      case '90':
        return '90 dias';
      case 'all':
        return 'Todos';
      default:
        return 'Mês Atual';
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

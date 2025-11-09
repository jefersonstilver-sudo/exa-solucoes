import React from 'react';
import { Home, Calendar } from 'lucide-react';
import { PeriodType } from '@/components/admin/common/AdminPeriodSelector';

interface DashboardBreadcrumbProps {
  periodFilter: PeriodType;
}

const DashboardBreadcrumb = ({ periodFilter }: DashboardBreadcrumbProps) => {
  const getPeriodDisplay = () => {
    switch (periodFilter) {
      case 'current_month':
        const now = new Date();
        const monthNames = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      case 'last_month':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const monthNamesLast = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${monthNamesLast[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;
      case '30':
        return 'Últimos 30 dias';
      case '90':
        return 'Últimos 90 dias';
      case 'all':
        return 'Todos os Períodos';
      case 'custom':
        return 'Período Personalizado';
      default:
        return 'Período Atual';
    }
  };

  const isCurrentPeriod = periodFilter === 'current_month';

  return (
    <div className="flex items-center space-x-3 text-sm text-gray-600 mb-6">
      <div className="flex items-center space-x-2">
        <Home className="h-4 w-4" />
        <span>Dashboard</span>
      </div>
      
      <span className="text-gray-400">›</span>
      
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-indexa-purple" />
        <span className="font-medium text-gray-900">
          {getPeriodDisplay()}
        </span>
        {isCurrentPeriod && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
            Atual
          </span>
        )}
      </div>
    </div>
  );
};

export default DashboardBreadcrumb;

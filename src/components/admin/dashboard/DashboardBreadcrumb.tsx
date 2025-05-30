
import React from 'react';
import { Home, Calendar } from 'lucide-react';

interface DashboardBreadcrumbProps {
  selectedMonth: string;
}

const DashboardBreadcrumb = ({ selectedMonth }: DashboardBreadcrumbProps) => {
  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const monthName = monthNames[parseInt(month) - 1];
    return `${monthName} ${year}`;
  };

  const isCurrentMonth = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    return selectedMonth === currentMonth;
  };

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
          {formatMonthDisplay(selectedMonth)}
        </span>
        {isCurrentMonth() && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
            Atual
          </span>
        )}
      </div>
    </div>
  );
};

export default DashboardBreadcrumb;

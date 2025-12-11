import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type PeriodFilter = 'today' | 'last_3_days' | 'last_7_days' | 'current_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'current_year' | 'all';

interface OrderPeriodFilterProps {
  value: PeriodFilter;
  onChange: (value: PeriodFilter) => void;
}

export const OrderPeriodFilter: React.FC<OrderPeriodFilterProps> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px] h-9 border-border/50 hover:border-[#9C1E1E]/30 transition-colors bg-background/50">
        <SelectValue placeholder="Período" />
      </SelectTrigger>
      <SelectContent align="end" className="bg-background/95 backdrop-blur-md border-border/50">
        <SelectItem value="today" className="cursor-pointer hover:bg-[#9C1E1E]/10">Hoje</SelectItem>
        <SelectItem value="last_3_days" className="cursor-pointer hover:bg-[#9C1E1E]/10">3 dias</SelectItem>
        <SelectItem value="last_7_days" className="cursor-pointer hover:bg-[#9C1E1E]/10">7 dias</SelectItem>
        <SelectItem value="current_month" className="cursor-pointer hover:bg-[#9C1E1E]/10">Mês atual</SelectItem>
        <SelectItem value="last_month" className="cursor-pointer hover:bg-[#9C1E1E]/10">Último mês</SelectItem>
        <SelectItem value="last_3_months" className="cursor-pointer hover:bg-[#9C1E1E]/10">3 meses</SelectItem>
        <SelectItem value="last_6_months" className="cursor-pointer hover:bg-[#9C1E1E]/10">6 meses</SelectItem>
        <SelectItem value="current_year" className="cursor-pointer hover:bg-[#9C1E1E]/10">Ano atual</SelectItem>
        <SelectItem value="all" className="cursor-pointer hover:bg-[#9C1E1E]/10">Todos</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const filterByPeriod = (items: any[], period: PeriodFilter): any[] => {
  if (period === 'all') return items;

  const now = new Date();
  
  // Usar início do dia em timezone local
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOf3DaysAgo = new Date(startOfToday.getTime() - 2 * 24 * 60 * 60 * 1000);
  const startOf7DaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const startOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
  const startOf6MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

  return items.filter(item => {
    if (!item.created_at) return false;
    
    const createdAt = new Date(item.created_at);
    
    // Verificar se a data é válida
    if (isNaN(createdAt.getTime())) return false;
    
    switch (period) {
      case 'today':
        return createdAt >= startOfToday;
      case 'last_3_days':
        return createdAt >= startOf3DaysAgo;
      case 'last_7_days':
        return createdAt >= startOf7DaysAgo;
      case 'current_month':
        return createdAt >= startOfCurrentMonth;
      case 'last_month':
        return createdAt >= startOfLastMonth && createdAt <= endOfLastMonth;
      case 'last_3_months':
        return createdAt >= startOf3MonthsAgo;
      case 'last_6_months':
        return createdAt >= startOf6MonthsAgo;
      case 'current_year':
        return createdAt >= startOfYear;
      default:
        return true;
    }
  });
};

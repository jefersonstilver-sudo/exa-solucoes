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
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">Hoje</SelectItem>
        <SelectItem value="last_3_days">Últimos 3 dias</SelectItem>
        <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
        <SelectItem value="current_month">Mês atual</SelectItem>
        <SelectItem value="last_month">Último mês</SelectItem>
        <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
        <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
        <SelectItem value="current_year">Ano atual</SelectItem>
        <SelectItem value="all">Todos</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const filterByPeriod = (items: any[], period: PeriodFilter): any[] => {
  if (period === 'all') return items;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOf3DaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const startOf7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const startOf6MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  return items.filter(item => {
    const createdAt = new Date(item.created_at);
    
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

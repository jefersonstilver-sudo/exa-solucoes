import React from 'react';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type PeriodFilter = 'all' | 'current_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year';

interface OrderPeriodFilterProps {
  value: PeriodFilter;
  onChange: (value: PeriodFilter) => void;
}

export const OrderPeriodFilter: React.FC<OrderPeriodFilterProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current_month">📅 Mês Atual</SelectItem>
          <SelectItem value="last_month">📆 Último Mês</SelectItem>
          <SelectItem value="last_3_months">📊 Últimos 3 Meses</SelectItem>
          <SelectItem value="last_6_months">📈 Últimos 6 Meses</SelectItem>
          <SelectItem value="this_year">🗓️ Este Ano</SelectItem>
          <SelectItem value="all">🌐 Todos os Pedidos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export const filterByPeriod = (items: any[], period: PeriodFilter): any[] => {
  if (period === 'all') return items;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return items.filter(item => {
    const itemDate = new Date(item.created_at);
    const itemYear = itemDate.getFullYear();
    const itemMonth = itemDate.getMonth();

    switch (period) {
      case 'current_month':
        return itemYear === currentYear && itemMonth === currentMonth;
      
      case 'last_month':
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return itemYear === lastMonthYear && itemMonth === lastMonth;
      
      case 'last_3_months':
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(currentMonth - 3);
        return itemDate >= threeMonthsAgo;
      
      case 'last_6_months':
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(currentMonth - 6);
        return itemDate >= sixMonthsAgo;
      
      case 'this_year':
        return itemYear === currentYear;
      
      default:
        return true;
    }
  });
};

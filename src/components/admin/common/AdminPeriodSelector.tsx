import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

export type PeriodType = 'current_month' | 'last_month' | '30' | '90' | 'all' | 'custom';

export interface PeriodDates {
  start: Date | undefined;
  end: Date | undefined;
}

interface AdminPeriodSelectorProps {
  value: PeriodType;
  onChange: (period: PeriodType, dates?: PeriodDates) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (start: Date | undefined, end: Date | undefined) => void;
}

const AdminPeriodSelector: React.FC<AdminPeriodSelectorProps> = ({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}) => {
  const [showCustomDates, setShowCustomDates] = useState(value === 'custom');

  const handlePeriodChange = (newValue: PeriodType) => {
    setShowCustomDates(newValue === 'custom');
    onChange(newValue);
  };

  return (
    <div className="flex gap-2 items-center">
      <Select value={value} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current_month">Mês Atual</SelectItem>
          <SelectItem value="last_month">Mês Anterior</SelectItem>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="90">Últimos 90 dias</SelectItem>
          <SelectItem value="all">Tudo (Desde o Início)</SelectItem>
          <SelectItem value="custom">Período Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {showCustomDates && (
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[160px] justify-start text-left font-normal",
                  !customStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={(date) => onCustomDateChange?.(date, customEndDate)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">até</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[160px] justify-start text-left font-normal",
                  !customEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={(date) => onCustomDateChange?.(customStartDate, date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default AdminPeriodSelector;

export const getPeriodDates = (period: PeriodType, customStart?: Date, customEnd?: Date): PeriodDates => {
  if (period === 'custom') {
    return { start: customStart, end: customEnd };
  }

  if (period === 'all') {
    return { start: undefined, end: undefined };
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();

  if (period === 'current_month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (period === 'last_month') {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);
    
    const lastMonthEnd = new Date(lastMonth);
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
    lastMonthEnd.setDate(0);
    lastMonthEnd.setHours(23, 59, 59, 999);
    
    return { start: lastMonth, end: lastMonthEnd };
  }

  start.setDate(start.getDate() - parseInt(period));
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
};

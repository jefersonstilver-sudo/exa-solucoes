import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
export type ElegantPeriodType = 'today' | 'yesterday' | '3days' | '7days' | '30days' | 'custom';

export const getElegantPeriodDates = (
  period: ElegantPeriodType,
  customStart?: Date,
  customEnd?: Date
): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (period) {
    case 'today': {
      return { start: today, end: endOfToday };
    }
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endYesterday = new Date(yesterday);
      endYesterday.setHours(23, 59, 59, 999);
      return { start: yesterday, end: endYesterday };
    }
    case '3days': {
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return { start: threeDaysAgo, end: endOfToday };
    }
    case '7days': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return { start: sevenDaysAgo, end: endOfToday };
    }
    case '30days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { start: thirtyDaysAgo, end: endOfToday };
    }
    case 'custom': {
      if (customStart && customEnd) {
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      return { start: today, end: endOfToday };
    }
    default:
      return { start: today, end: endOfToday };
  }
};

interface ElegantPeriodButtonProps {
  value: ElegantPeriodType;
  onChange: (period: ElegantPeriodType) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange: (start: Date | undefined, end: Date | undefined) => void;
}

const periodLabels: Record<ElegantPeriodType, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  '3days': 'Últimos 3 dias',
  '7days': 'Últimos 7 dias',
  '30days': 'Últimos 30 dias',
  custom: 'Período Personalizado'
};

const ElegantPeriodButton = ({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomDateChange
}: ElegantPeriodButtonProps) => {
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const today = new Date();
  const isToday = value === 'today';

  const displayDate = value === 'custom' && customStartDate && customEndDate
    ? `${format(customStartDate, 'dd MMM', { locale: ptBR })} - ${format(customEndDate, 'dd MMM', { locale: ptBR })}`
    : format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const displayLabel = isToday ? 'Hoje' : periodLabels[value];

  return (
    <div className="flex items-center gap-2">
      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Calendar className="h-4 w-4 mr-2" />
                {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Data inicial'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={customStartDate}
                onSelect={(date) => {
                  onCustomDateChange(date, customEndDate);
                  setShowStartCalendar(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Calendar className="h-4 w-4 mr-2" />
                {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Data final'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={customEndDate}
                onSelect={(date) => {
                  onCustomDateChange(customStartDate, date);
                  setShowEndCalendar(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-10 px-4 bg-background/95 backdrop-blur-sm border-border/50 hover:border-border hover:bg-accent/50 transition-all shadow-sm"
          >
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="font-medium">{displayLabel}</span>
            <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => onChange('today')}>
            Hoje
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('yesterday')}>
            Ontem
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('3days')}>
            Últimos 3 dias
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('7days')}>
            Últimos 7 dias
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('30days')}>
            Últimos 30 dias
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('custom')}>
            Período Personalizado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ElegantPeriodButton;

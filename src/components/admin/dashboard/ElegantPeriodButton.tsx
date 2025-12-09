import React, { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ElegantPeriodType = 'today' | 'yesterday' | '3days' | '7days' | 'current_month' | '30days' | 'custom';

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
    case 'current_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfMonth, end: endOfToday };
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
  savePeriodEnabled?: boolean;
  onSavePeriodChange?: (enabled: boolean) => void;
}

const periodLabels: Record<ElegantPeriodType, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  '3days': 'Últimos 3 dias',
  '7days': 'Últimos 7 dias',
  current_month: 'Este mês',
  '30days': 'Últimos 30 dias',
  custom: 'Período Personalizado'
};

const ElegantPeriodButton = ({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  savePeriodEnabled = false,
  onSavePeriodChange
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
                <CalendarDays className="h-4 w-4 mr-2" />
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
                <CalendarDays className="h-4 w-4 mr-2" />
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
            className="h-10 px-4 bg-white backdrop-blur-sm border-gray-200 hover:border-primary/30 hover:shadow-md transition-all shadow-sm group"
          >
            <CalendarDays className="h-4 w-4 mr-2 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-medium">{displayLabel}</span>
            <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground group-hover:rotate-180 transition-transform" />
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
          <DropdownMenuItem onClick={() => onChange('current_month')}>
            Este mês
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('30days')}>
            Últimos 30 dias
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('custom')}>
            Período Personalizado
          </DropdownMenuItem>
          
          {onSavePeriodChange && (
            <>
              <DropdownMenuSeparator />
              <div 
                className="px-2 py-2 flex items-center gap-2 hover:bg-accent rounded-sm cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSavePeriodChange(!savePeriodEnabled);
                }}
              >
                <Checkbox 
                  id="save-period" 
                  checked={savePeriodEnabled}
                  onCheckedChange={(checked) => onSavePeriodChange(checked === true)}
                  onClick={(e) => e.stopPropagation()}
                />
                <label 
                  htmlFor="save-period" 
                  className="text-sm text-muted-foreground cursor-pointer flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Lembrar minha escolha
                </label>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ElegantPeriodButton;

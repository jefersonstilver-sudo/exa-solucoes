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
import { PeriodType } from '@/components/admin/common/AdminPeriodSelector';

interface ElegantPeriodButtonProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange: (start: Date | undefined, end: Date | undefined) => void;
}

const periodLabels: Record<PeriodType, string> = {
  current_month: 'Mês Atual',
  last_month: 'Mês Anterior',
  '30': 'Últimos 30 dias',
  '90': 'Últimos 90 dias',
  all: 'Todo Período',
  custom: 'Personalizado'
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
  const isToday = value === 'current_month' && 
    today.getMonth() === new Date().getMonth() && 
    today.getFullYear() === new Date().getFullYear();

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
            {!isToday && value !== 'custom' && (
              <>
                <span className="mx-2 text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{displayDate}</span>
              </>
            )}
            {isToday && (
              <>
                <span className="mx-2 text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{displayDate}</span>
              </>
            )}
            <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onChange('current_month')}>
            Mês Atual
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('last_month')}>
            Mês Anterior
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('30')}>
            Últimos 30 dias
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('90')}>
            Últimos 90 dias
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('all')}>
            Todo Período
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange('custom')}>
            Personalizado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ElegantPeriodButton;

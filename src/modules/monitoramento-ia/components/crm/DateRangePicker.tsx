import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { PeriodType } from '../../hooks/useLeadMetricsDetailed';

interface DateRangePickerProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  customStart?: Date;
  customEnd?: Date;
  onCustomDatesChange: (start?: Date, end?: Date) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomDatesChange
}) => {
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

  const quickButtons = [
    { label: 'Hoje', value: 'today' as PeriodType },
    { label: 'Ontem', value: 'yesterday' as PeriodType },
    { label: '7 dias', value: '7days' as PeriodType },
    { label: '30 dias', value: '30days' as PeriodType },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {quickButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={period === btn.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Período Personalizado */}
      <div className="flex items-center gap-2">
        <Popover open={isStartPickerOpen} onOpenChange={setIsStartPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={period === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'justify-start text-left font-normal',
                !customStart && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customStart ? format(customStart, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inicial'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customStart}
              onSelect={(date) => {
                onCustomDatesChange(date, customEnd);
                onPeriodChange('custom');
                setIsStartPickerOpen(false);
              }}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <span className="text-sm text-muted-foreground">até</span>

        <Popover open={isEndPickerOpen} onOpenChange={setIsEndPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={period === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'justify-start text-left font-normal',
                !customEnd && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customEnd ? format(customEnd, 'dd/MM/yyyy', { locale: ptBR }) : 'Data final'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customEnd}
              onSelect={(date) => {
                onCustomDatesChange(customStart, date);
                onPeriodChange('custom');
                setIsEndPickerOpen(false);
              }}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

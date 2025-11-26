import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from 'lucide-react';
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
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Botões rápidos */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={period === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange('today')}
          className={cn(
            period === 'today' && "bg-[var(--exa-accent)] hover:bg-[var(--exa-accent)]/90"
          )}
        >
          📅 Hoje
        </Button>
        <Button
          variant={period === 'yesterday' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange('yesterday')}
          className={cn(
            period === 'yesterday' && "bg-[var(--exa-accent)] hover:bg-[var(--exa-accent)]/90"
          )}
        >
          🕐 Ontem
        </Button>
        <Button
          variant={period === '7days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange('7days')}
          className={cn(
            period === '7days' && "bg-[var(--exa-accent)] hover:bg-[var(--exa-accent)]/90"
          )}
        >
          📊 7 dias
        </Button>
        <Button
          variant={period === '30days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange('30days')}
          className={cn(
            period === '30days' && "bg-[var(--exa-accent)] hover:bg-[var(--exa-accent)]/90"
          )}
        >
          📈 30 dias
        </Button>
      </div>

      {/* Seletor de período personalizado */}
      <div className="flex flex-wrap gap-4 items-center bg-[var(--exa-bg-card)] p-4 rounded-lg border border-[var(--exa-border)]">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide">
            De:
          </label>
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal bg-[var(--exa-bg-primary)] border-[var(--exa-border)]",
                  !customStart && "text-[var(--exa-text-secondary)]"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {customStart ? format(customStart, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[var(--exa-bg-card)] border-[var(--exa-border)]">
              <CalendarComponent
                mode="single"
                selected={customStart}
                onSelect={(date) => {
                  if (date) {
                    onCustomDatesChange(date, customEnd);
                    setStartOpen(false);
                  }
                }}
                initialFocus
                className="rounded-lg"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide">
            Até:
          </label>
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal bg-[var(--exa-bg-primary)] border-[var(--exa-border)]",
                  !customEnd && "text-[var(--exa-text-secondary)]"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {customEnd ? format(customEnd, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[var(--exa-bg-card)] border-[var(--exa-border)]">
              <CalendarComponent
                mode="single"
                selected={customEnd}
                onSelect={(date) => {
                  if (date) {
                    onCustomDatesChange(customStart, date);
                    onPeriodChange('custom');
                    setEndOpen(false);
                  }
                }}
                initialFocus
                className="rounded-lg"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
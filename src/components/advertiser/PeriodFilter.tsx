import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DateRange {
  start: Date;
  end: Date;
}

interface PeriodFilterProps {
  onPeriodChange: (range: DateRange) => void;
  defaultPeriod?: 'today' | '7d' | '15d' | '30d';
}

const quickPeriods = [
  { id: 'today', label: 'Hoje', days: 0 },
  { id: '7d', label: '7 dias', days: 7 },
  { id: '15d', label: '15 dias', days: 15 },
  { id: '30d', label: '30 dias', days: 30 },
] as const;

export const PeriodFilter = ({ onPeriodChange, defaultPeriod = '30d' }: PeriodFilterProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultPeriod);
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const applyPeriod = (periodId: string, days: number) => {
    setSelectedPeriod(periodId);
    if (days === 0) {
      onPeriodChange({ start: startOfDay(new Date()), end: endOfDay(new Date()) });
    } else {
      onPeriodChange({ start: startOfDay(subDays(new Date(), days)), end: endOfDay(new Date()) });
    }
    setIsOpen(false);
  };

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      setSelectedPeriod('custom');
      onPeriodChange({ start: startOfDay(customStart), end: endOfDay(customEnd) });
      setIsOpen(false);
    }
  };

  const getLabel = () => {
    if (selectedPeriod === 'custom' && customStart && customEnd) {
      return `${format(customStart, 'dd/MM/yy', { locale: ptBR })} - ${format(customEnd, 'dd/MM/yy', { locale: ptBR })}`;
    }
    const found = quickPeriods.find(p => p.id === selectedPeriod);
    if (found) {
      return found.id === 'today' ? 'Hoje' : `Últimos ${found.days} dias`;
    }
    return 'Selecionar período';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-background hover:bg-accent border-border/40 shadow-sm"
        >
          <Calendar className="w-4 h-4 mr-2 text-[#9C1E1E]" />
          {getLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          {/* Quick select buttons */}
          <div className="flex flex-wrap gap-2">
            {quickPeriods.map((p) => (
              <Button
                key={p.id}
                variant={selectedPeriod === p.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyPeriod(p.id, p.days)}
                className={selectedPeriod === p.id ? 'bg-[#9C1E1E] hover:bg-[#7A1717] text-white' : ''}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* Separator */}
          <div className="border-t border-border" />

          {/* Custom range */}
          <div>
            <h4 className="text-sm font-medium mb-3">Período personalizado</h4>
            <div className="flex gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Início</label>
                <CalendarComponent
                  mode="single"
                  selected={customStart}
                  onSelect={setCustomStart}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Fim</label>
                <CalendarComponent
                  mode="single"
                  selected={customEnd}
                  onSelect={setCustomEnd}
                  disabled={(date) => customStart ? date < customStart : false}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </div>
            </div>
            <Button
              onClick={applyCustomRange}
              disabled={!customStart || !customEnd}
              className="w-full mt-3 bg-[#9C1E1E] hover:bg-[#7A1717]"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

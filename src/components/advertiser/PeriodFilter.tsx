import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DateRange {
  start: Date;
  end: Date;
}

interface PeriodFilterProps {
  onPeriodChange: (range: DateRange) => void;
  defaultPeriod?: 'today' | '10d' | '15d' | '30d';
}

export const PeriodFilter = ({ onPeriodChange, defaultPeriod = '30d' }: PeriodFilterProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultPeriod);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const periods = [
    { id: 'today', label: 'Hoje', days: 0 },
    { id: '10d', label: 'Últimos 10 dias', days: 10 },
    { id: '15d', label: 'Últimos 15 dias', days: 15 },
    { id: '30d', label: 'Últimos 30 dias', days: 30 },
  ];

  const handlePeriodSelect = (periodId: string, days: number) => {
    setSelectedPeriod(periodId);
    const end = new Date();
    const start = subDays(end, days);
    onPeriodChange({ start, end });
  };

  const handleCustomRangeApply = () => {
    if (customRange) {
      setSelectedPeriod('custom');
      onPeriodChange(customRange);
      setIsCustomOpen(false);
    }
  };

  const getCurrentLabel = () => {
    if (selectedPeriod === 'custom' && customRange) {
      return `${format(customRange.start, 'dd/MM/yy', { locale: ptBR })} - ${format(customRange.end, 'dd/MM/yy', { locale: ptBR })}`;
    }
    return periods.find(p => p.id === selectedPeriod)?.label || 'Selecionar período';
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-background hover:bg-accent border-border/40 shadow-sm"
          >
            <Calendar className="w-4 h-4 mr-2 text-[#9C1E1E]" />
            {getCurrentLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {periods.map((period) => (
            <DropdownMenuItem
              key={period.id}
              onClick={() => handlePeriodSelect(period.id, period.days)}
              className={selectedPeriod === period.id ? 'bg-accent' : ''}
            >
              {period.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={() => setIsCustomOpen(true)}>
            Período Personalizado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <div />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-sm">Selecione o período</h4>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Data Início</label>
              <CalendarComponent
                mode="single"
                selected={customRange?.start}
                onSelect={(date) => {
                  if (date) {
                    setCustomRange(prev => ({
                      start: date,
                      end: prev?.end || new Date()
                    }));
                  }
                }}
                locale={ptBR}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Data Fim</label>
              <CalendarComponent
                mode="single"
                selected={customRange?.end}
                onSelect={(date) => {
                  if (date) {
                    setCustomRange(prev => ({
                      start: prev?.start || subDays(date, 30),
                      end: date
                    }));
                  }
                }}
                disabled={(date) => customRange?.start ? date < customRange.start : false}
                locale={ptBR}
              />
            </div>
            <Button
              onClick={handleCustomRangeApply}
              disabled={!customRange?.start || !customRange?.end}
              className="w-full bg-[#9C1E1E] hover:bg-[#7A1717]"
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

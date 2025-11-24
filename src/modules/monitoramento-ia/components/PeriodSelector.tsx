import { useState } from 'react';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export type PeriodType = 'hoje' | 'ontem' | 'esta-semana' | '7dias' | '30dias' | 'personalizado';

interface PeriodSelectorProps {
  value: PeriodType;
  onChange: (value: PeriodType, customStart?: Date, customEnd?: Date) => void;
  customStartDate?: Date;
  customEndDate?: Date;
}

export const PeriodSelector = ({ value, onChange, customStartDate, customEndDate }: PeriodSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(customStartDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(customEndDate);

  const periods = [
    { value: 'hoje' as const, label: 'Hoje' },
    { value: 'ontem' as const, label: 'Ontem' },
    { value: 'esta-semana' as const, label: 'Esta Semana' },
    { value: '7dias' as const, label: 'Últimos 7 dias' },
    { value: '30dias' as const, label: 'Últimos 30 dias' },
    { value: 'personalizado' as const, label: 'Período Personalizado' },
  ];

  const getDisplayLabel = () => {
    const period = periods.find(p => p.value === value);
    if (value === 'personalizado' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'dd/MM')} - ${format(customEndDate, 'dd/MM')}`;
    }
    return period?.label || 'Selecione';
  };

  const handlePeriodSelect = (periodValue: PeriodType) => {
    if (periodValue === 'personalizado') {
      setShowCustomRange(true);
    } else {
      onChange(periodValue);
      setIsOpen(false);
      setShowCustomRange(false);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      onChange('personalizado', tempStartDate, tempEndDate);
      setIsOpen(false);
      setShowCustomRange(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="p-2.5 border-module-border border text-module-primary rounded-lg hover:bg-module-secondary/20 transition-colors flex items-center gap-2 min-w-[140px] justify-between bg-module-card">
          <CalendarIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{getDisplayLabel()}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-module-card border-module-border shadow-xl" 
        align="end"
        sideOffset={8}
      >
        {!showCustomRange ? (
          <div className="p-2">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => handlePeriodSelect(period.value)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between",
                  "hover:bg-module-hover text-module-primary text-sm",
                  value === period.value && "bg-module-accent/10 font-medium"
                )}
              >
                {period.label}
                {value === period.value && (
                  <Check className="w-4 h-4 text-module-accent" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="text-sm font-medium text-module-primary mb-3">
              Selecione o Período
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-module-secondary mb-1 block">Data Inicial</label>
                <Calendar
                  mode="single"
                  selected={tempStartDate}
                  onSelect={setTempStartDate}
                  locale={ptBR}
                  className="rounded-md border-module-border bg-module-primary/5"
                />
              </div>
              
              <div>
                <label className="text-xs text-module-secondary mb-1 block">Data Final</label>
                <Calendar
                  mode="single"
                  selected={tempEndDate}
                  onSelect={setTempEndDate}
                  locale={ptBR}
                  disabled={(date) => tempStartDate ? date < tempStartDate : false}
                  className="rounded-md border-module-border bg-module-primary/5"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowCustomRange(false);
                  setTempStartDate(customStartDate);
                  setTempEndDate(customEndDate);
                }}
                className="flex-1 px-3 py-2 text-xs border-module-border border rounded-md hover:bg-module-hover text-module-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyCustomRange}
                disabled={!tempStartDate || !tempEndDate}
                className="flex-1 px-3 py-2 text-xs bg-module-accent text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

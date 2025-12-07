import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfDay, startOfWeek, startOfMonth, endOfMonth, subMonths, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type PeriodType = 'hoje' | 'semana' | 'mes' | 'ultimos3' | 'custom';

export interface PeriodRange {
  type: PeriodType;
  startDate: Date;
  endDate: Date;
  label: string;
}

interface ProposalsPeriodSelectorProps {
  value: PeriodRange;
  onChange: (period: PeriodRange) => void;
}

const getPresetPeriods = (): { type: PeriodType; label: string; getRange: () => { start: Date; end: Date } }[] => {
  const now = new Date();
  return [
    {
      type: 'hoje',
      label: 'Hoje',
      getRange: () => ({ start: startOfDay(now), end: endOfDay(now) })
    },
    {
      type: 'semana',
      label: 'Esta Semana',
      getRange: () => ({ start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfDay(now) })
    },
    {
      type: 'mes',
      label: 'Mês Atual',
      getRange: () => ({ start: startOfMonth(now), end: endOfMonth(now) })
    },
    {
      type: 'ultimos3',
      label: 'Últimos 3 meses',
      getRange: () => ({ start: startOfMonth(subMonths(now, 2)), end: endOfDay(now) })
    }
  ];
};

export const ProposalsPeriodSelector: React.FC<ProposalsPeriodSelectorProps> = ({
  value,
  onChange
}) => {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState<Date | undefined>(value.startDate);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(value.endDate);

  const presets = getPresetPeriods();

  const handlePresetSelect = (type: PeriodType) => {
    const preset = presets.find(p => p.type === type);
    if (preset) {
      const range = preset.getRange();
      onChange({
        type,
        startDate: range.start,
        endDate: range.end,
        label: preset.label
      });
      setOpen(false);
      setShowCustom(false);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({
        type: 'custom',
        startDate: startOfDay(customStart),
        endDate: endOfDay(customEnd),
        label: `${format(customStart, 'dd/MM')} - ${format(customEnd, 'dd/MM')}`
      });
      setOpen(false);
      setShowCustom(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 px-3 gap-2 text-xs font-medium",
            "bg-white/80 backdrop-blur-sm border-white/50",
            "hover:bg-white/90 hover:border-[#9C1E1E]/20",
            "shadow-sm hover:shadow-md transition-all duration-200",
            "rounded-xl"
          )}
        >
          <Calendar className="h-3.5 w-3.5 text-[#9C1E1E]" />
          <span className="text-foreground">{value.label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0 bg-white/95 backdrop-blur-xl border-white/50 shadow-xl rounded-xl overflow-hidden"
        align="end"
      >
        {!showCustom ? (
          <div className="p-2">
            <p className="text-[10px] text-muted-foreground px-2 py-1 uppercase tracking-wide">
              Período
            </p>
            <div className="space-y-0.5">
              {presets.map((preset) => (
                <button
                  key={preset.type}
                  onClick={() => handlePresetSelect(preset.type)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                    value.type === preset.type
                      ? "bg-[#9C1E1E]/10 text-[#9C1E1E] font-medium"
                      : "hover:bg-gray-50 text-foreground"
                  )}
                >
                  <span>{preset.label}</span>
                  {value.type === preset.type && (
                    <Check className="h-4 w-4 text-[#9C1E1E]" />
                  )}
                </button>
              ))}
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => setShowCustom(true)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                  value.type === 'custom'
                    ? "bg-[#9C1E1E]/10 text-[#9C1E1E] font-medium"
                    : "hover:bg-gray-50 text-foreground"
                )}
              >
                <span>Personalizado</span>
                {value.type === 'custom' && (
                  <Check className="h-4 w-4 text-[#9C1E1E]" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowCustom(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Voltar
              </button>
              <span className="text-xs font-medium">Período Personalizado</span>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Data Início</p>
                <CalendarComponent
                  mode="single"
                  selected={customStart}
                  onSelect={setCustomStart}
                  locale={ptBR}
                  className="rounded-lg border p-2"
                />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Data Fim</p>
                <CalendarComponent
                  mode="single"
                  selected={customEnd}
                  onSelect={setCustomEnd}
                  locale={ptBR}
                  disabled={(date) => customStart ? date < customStart : false}
                  className="rounded-lg border p-2"
                />
              </div>
            </div>

            <Button
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
              className="w-full bg-[#9C1E1E] hover:bg-[#7D1818] h-9"
            >
              Aplicar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

// Helper to get default period (current month)
export const getDefaultPeriod = (): PeriodRange => {
  const now = new Date();
  return {
    type: 'mes',
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
    label: format(now, 'MMMM', { locale: ptBR }).charAt(0).toUpperCase() + format(now, 'MMMM', { locale: ptBR }).slice(1)
  };
};

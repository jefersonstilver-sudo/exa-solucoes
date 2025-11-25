import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  value: { from?: Date; to?: Date };
  onChange: (range: { from?: Date; to?: Date }) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(
    value.from && value.to ? { from: value.from, to: value.to } : undefined
  );

  const presets = [
    { label: 'Hoje', getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { label: 'Ontem', getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
    { label: 'Última semana', getValue: () => ({ from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) }) },
    { label: 'Último mês', getValue: () => ({ from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) }) }
  ];

  const getLabel = () => {
    if (!value.from) return 'Hoje';
    
    const preset = presets.find(p => {
      const range = p.getValue();
      return range.from?.getTime() === value.from?.getTime() && range.to?.getTime() === value.to?.getTime();
    });

    if (preset) return preset.label;
    
    if (value.from && value.to) {
      return `${format(value.from, 'dd/MM')} - ${format(value.to, 'dd/MM')}`;
    }
    
    return 'Personalizado';
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      onChange({ from: startOfDay(range.from), to: endOfDay(range.to) });
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-2 text-xs font-medium backdrop-blur-md",
            "bg-white/60 hover:bg-white/80 border-gray-200/50",
            "text-gray-700 shadow-sm transition-all"
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          {getLabel()}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-auto p-0 backdrop-blur-xl",
          "bg-white/95 border-gray-200/50 shadow-xl"
        )} 
        align="end"
      >
        <div className="flex">
          {/* Presets */}
          <div className="border-r border-gray-200/50 p-2 space-y-1">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs hover:bg-gray-100/60"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={handleCustomRangeSelect}
              numberOfMonths={1}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

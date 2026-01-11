/**
 * FinancialPeriodSelector
 * 
 * Componente moderno e minimalista para seleção de período
 * Reutilizável em todas as páginas do módulo financeiro
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FinancialPeriodType,
  PERIOD_OPTIONS,
  getPeriodDisplayLabel,
} from './financialPeriodUtils';

interface FinancialPeriodSelectorProps {
  value: FinancialPeriodType;
  onChange: (period: FinancialPeriodType) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (start: Date | undefined, end: Date | undefined) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

const FinancialPeriodSelector: React.FC<FinancialPeriodSelectorProps> = ({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  variant = 'default',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(customStartDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(customEndDate);

  const displayLabel = getPeriodDisplayLabel(value, customStartDate, customEndDate);

  const handlePeriodSelect = (period: FinancialPeriodType) => {
    if (period === 'custom') {
      setShowCustomCalendar(true);
      setTempStartDate(customStartDate);
      setTempEndDate(customEndDate);
    } else {
      onChange(period);
      setShowCustomCalendar(false);
      setOpen(false);
    }
  };

  const handleCustomConfirm = () => {
    if (tempStartDate && tempEndDate) {
      onCustomDateChange?.(tempStartDate, tempEndDate);
      onChange('custom');
      setShowCustomCalendar(false);
      setOpen(false);
    }
  };

  const handleCustomCancel = () => {
    setShowCustomCalendar(false);
    setTempStartDate(customStartDate);
    setTempEndDate(customEndDate);
  };

  const quickOptions = PERIOD_OPTIONS.filter(o => o.group === 'quick');
  const monthlyOptions = PERIOD_OPTIONS.filter(o => o.group === 'monthly');
  const extendedOptions = PERIOD_OPTIONS.filter(o => o.group === 'extended');
  const otherOptions = PERIOD_OPTIONS.filter(o => o.group === 'other');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "bg-white/80 backdrop-blur-sm border-gray-200/60 hover:bg-white hover:border-gray-300 transition-all duration-200",
            "shadow-sm hover:shadow-md",
            "text-gray-700 font-medium",
            variant === 'compact' ? "h-8 px-3 text-sm gap-1.5" : "h-9 px-4 gap-2",
            className
          )}
        >
          <CalendarIcon className={cn(
            "text-primary/70",
            variant === 'compact' ? "h-3.5 w-3.5" : "h-4 w-4"
          )} />
          <span className="capitalize">{displayLabel}</span>
          <ChevronDown className={cn(
            "text-gray-400",
            variant === 'compact' ? "h-3 w-3" : "h-3.5 w-3.5"
          )} />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-auto p-0 bg-white/95 backdrop-blur-lg border-gray-200/60 shadow-xl" 
        align="end"
        sideOffset={8}
      >
        {!showCustomCalendar ? (
          <div className="p-2 min-w-[220px]">
            {/* Quick Options */}
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                Rápido
              </p>
              {quickOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                    value === option.value 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span>{option.label}</span>
                  {value === option.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>

            <Separator className="my-2" />

            {/* Monthly Options */}
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                Mensal
              </p>
              {monthlyOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                    value === option.value 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span>{option.label}</span>
                  {value === option.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>

            <Separator className="my-2" />

            {/* Extended Options */}
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                Estendido
              </p>
              {extendedOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                    value === option.value 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span>{option.label}</span>
                  {value === option.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>

            <Separator className="my-2" />

            {/* Other Options */}
            <div className="space-y-0.5">
              {otherOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                    value === option.value 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span>{option.label}</span>
                  {value === option.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Período Personalizado</p>
              <button 
                onClick={handleCustomCancel}
                className="text-xs text-muted-foreground hover:text-gray-700"
              >
                Voltar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Data Início</p>
                <div className="border rounded-lg p-1">
                  <Calendar
                    mode="single"
                    selected={tempStartDate}
                    onSelect={setTempStartDate}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </div>
                {tempStartDate && (
                  <p className="text-xs text-center text-gray-600">
                    {format(tempStartDate, 'dd/MM/yyyy')}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Data Fim</p>
                <div className="border rounded-lg p-1">
                  <Calendar
                    mode="single"
                    selected={tempEndDate}
                    onSelect={setTempEndDate}
                    locale={ptBR}
                    disabled={(date) => tempStartDate ? date < tempStartDate : false}
                    className="pointer-events-auto"
                  />
                </div>
                {tempEndDate && (
                  <p className="text-xs text-center text-gray-600">
                    {format(tempEndDate, 'dd/MM/yyyy')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCustomConfirm}
                disabled={!tempStartDate || !tempEndDate}
                className="flex-1"
              >
                Aplicar
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default FinancialPeriodSelector;

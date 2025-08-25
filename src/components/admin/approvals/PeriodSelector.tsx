import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarRange } from 'lucide-react';
import DateRangePicker from './DateRangePicker';

interface PeriodSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomStartDateChange: (date: Date | undefined) => void;
  onCustomEndDateChange: (date: Date | undefined) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
}) => {
  // Gerar opções de período (últimos 12 meses + opção personalizada)
  const generatePeriodOptions = () => {
    const options = [];
    const now = new Date();
    
    // Mês atual
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${month.toString().padStart(2, '0')}`;
      
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      const label = `${monthNames[date.getMonth()]} ${year}`;
      const isCurrent = i === 0;
      
      options.push({ value, label, isCurrent });
    }
    
    // Opção personalizada
    options.push({ value: 'custom', label: 'Período Personalizado', isCurrent: false });
    
    return options;
  };

  const periodOptions = generatePeriodOptions();

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 bg-background rounded-lg border px-4 py-2">
        <Calendar className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-foreground">Período:</span>
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-48 border-0 bg-transparent focus:ring-0">
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {option.isCurrent && (
                    <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      Atual
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedPeriod === 'custom' && (
        <div className="flex items-center space-x-3 bg-background rounded-lg border px-4 py-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          <DateRangePicker
            startDate={customStartDate}
            endDate={customEndDate}
            onStartDateChange={onCustomStartDateChange}
            onEndDateChange={onCustomEndDateChange}
          />
        </div>
      )}
    </div>
  );
};

export default PeriodSelector;
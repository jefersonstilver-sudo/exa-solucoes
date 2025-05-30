
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronDown } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const MonthSelector = ({ selectedMonth, onMonthChange }: MonthSelectorProps) => {
  // Gerar os últimos 12 meses
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
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
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div className="flex items-center space-x-3 bg-white rounded-lg border border-gray-200 px-4 py-2 shadow-sm">
      <Calendar className="h-5 w-5 text-indexa-purple" />
      <span className="text-sm font-medium text-gray-700">Período:</span>
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className="w-48 border-0 bg-transparent focus:ring-0 text-gray-900 font-semibold">
          <SelectValue placeholder="Selecionar mês" />
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {option.isCurrent && (
                  <span className="ml-2 px-2 py-1 bg-indexa-purple/10 text-indexa-purple text-xs rounded-full">
                    Atual
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthSelector;

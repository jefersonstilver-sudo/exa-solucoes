
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronDown } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  variant?: 'default' | 'onColor'; // Novo: variante para usar em fundos coloridos
}

const MonthSelector = ({ selectedMonth, onMonthChange, variant = 'default' }: MonthSelectorProps) => {
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

  // Estilos dinâmicos baseados na variante
  const containerClasses = variant === 'onColor'
    ? "flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 px-3 py-2"
    : "flex items-center space-x-3 bg-white rounded-lg border border-gray-200 px-4 py-2 shadow-sm";

  const iconClasses = variant === 'onColor' ? "h-4 w-4 text-white" : "h-5 w-5 text-indexa-purple";
  const labelClasses = variant === 'onColor' ? "text-xs font-medium text-white" : "text-sm font-medium text-gray-700";
  const triggerClasses = variant === 'onColor'
    ? "w-36 border-0 bg-transparent focus:ring-0 text-white font-semibold text-xs"
    : "w-48 border-0 bg-transparent focus:ring-0 text-gray-900 font-semibold";

  return (
    <div className={containerClasses}>
      <Calendar className={iconClasses} />
      <span className={labelClasses}>Período:</span>
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className={triggerClasses}>
          <SelectValue placeholder="Selecionar mês" />
          <ChevronDown className={variant === 'onColor' ? "h-3.5 w-3.5 text-white/80" : "h-4 w-4 text-gray-400"} />
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

/**
 * TaskFilterSelect - Componente genérico de filtro
 * Fase 4.3: Select reutilizável para filtros da Central de Tarefas
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
}

interface TaskFilterSelectProps {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string | string[] | undefined;
  onChange: (value: string | string[] | undefined) => void;
  multiple?: boolean;
  className?: string;
}

export const TaskFilterSelect: React.FC<TaskFilterSelectProps> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  multiple = false,
  className
}) => {
  // Para single select
  if (!multiple) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <Select
          value={value as string || ''}
          onValueChange={(v) => onChange(v === '__all__' ? undefined : v)}
        >
          <SelectTrigger className="h-9 text-sm bg-white border-gray-200">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.icon && <span className="mr-1">{opt.icon}</span>}
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Para multi select (implementação simplificada com badges)
  const selectedValues = (value as string[]) || [];
  
  const handleToggle = (optValue: string) => {
    if (selectedValues.includes(optValue)) {
      const newValues = selectedValues.filter(v => v !== optValue);
      onChange(newValues.length > 0 ? newValues : undefined);
    } else {
      onChange([...selectedValues, optValue]);
    }
  };

  const handleClearAll = () => {
    onChange(undefined);
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        {selectedValues.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selectedValues.includes(opt.value);
          return (
            <Badge
              key={opt.value}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs transition-colors",
                isSelected 
                  ? "bg-gray-900 hover:bg-gray-700" 
                  : "bg-white hover:bg-gray-50 text-gray-600"
              )}
              onClick={() => handleToggle(opt.value)}
            >
              {opt.icon && <span className="mr-0.5">{opt.icon}</span>}
              {opt.label}
              {isSelected && <X className="h-3 w-3 ml-1" />}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default TaskFilterSelect;

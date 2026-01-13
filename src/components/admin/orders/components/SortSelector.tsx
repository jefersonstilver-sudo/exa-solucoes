import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

export type SortField = 'created_at' | 'updated_at' | 'client_name' | 'valor_total';
export type SortDirection = 'asc' | 'desc';

interface SortSelectorProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const sortOptions = [
  { value: 'created_at_desc', label: 'Mais recentes', field: 'created_at' as SortField, direction: 'desc' as SortDirection },
  { value: 'created_at_asc', label: 'Mais antigos', field: 'created_at' as SortField, direction: 'asc' as SortDirection },
  { value: 'client_name_asc', label: 'Cliente (A-Z)', field: 'client_name' as SortField, direction: 'asc' as SortDirection },
  { value: 'client_name_desc', label: 'Cliente (Z-A)', field: 'client_name' as SortField, direction: 'desc' as SortDirection },
  { value: 'valor_total_desc', label: 'Maior valor', field: 'valor_total' as SortField, direction: 'desc' as SortDirection },
  { value: 'valor_total_asc', label: 'Menor valor', field: 'valor_total' as SortField, direction: 'asc' as SortDirection },
];

export const SortSelector: React.FC<SortSelectorProps> = ({
  sortField,
  sortDirection,
  onSortChange,
}) => {
  const currentValue = `${sortField}_${sortDirection}`;

  const handleChange = (value: string) => {
    const option = sortOptions.find(opt => opt.value === value);
    if (option) {
      onSortChange(option.field, option.direction);
    }
  };

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px] h-8 text-xs">
        <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
        <SelectValue placeholder="Ordenar por" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SortSelector;

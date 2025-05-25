
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface PanelAssignmentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  orientationFilter: string;
  onOrientationFilterChange: (value: string) => void;
  onClearFilters: () => void;
  disabled: boolean;
}

const PanelAssignmentFilters: React.FC<PanelAssignmentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  orientationFilter,
  onOrientationFilterChange,
  onClearFilters,
  disabled
}) => {
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || orientationFilter !== 'all';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por código ou localização..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value="online">Online</SelectItem>
          <SelectItem value="offline">Offline</SelectItem>
          <SelectItem value="maintenance">Manutenção</SelectItem>
        </SelectContent>
      </Select>

      <Select value={orientationFilter} onValueChange={onOrientationFilterChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Orientação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Orientações</SelectItem>
          <SelectItem value="horizontal">Horizontal</SelectItem>
          <SelectItem value="vertical">Vertical</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={onClearFilters}
        disabled={!hasActiveFilters || disabled}
        className="flex items-center"
      >
        <X className="h-4 w-4 mr-1" />
        Limpar
      </Button>
    </div>
  );
};

export default PanelAssignmentFilters;

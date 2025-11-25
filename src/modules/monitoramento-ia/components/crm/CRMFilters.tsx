import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangePicker } from './DateRangePicker';

interface CRMFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onRefresh: () => void;
}

export const CRMFilters: React.FC<CRMFiltersProps> = ({ filters, onFilterChange, onRefresh }) => {

  return (
    <div className="flex items-center gap-3 flex-wrap justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>
        </div>

        {/* Agente */}
        <Select
          value={filters.agentKey || 'all'}
          onValueChange={(value) =>
            onFilterChange({ ...filters, agentKey: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className={cn(
            "w-[160px] h-8 text-xs backdrop-blur-md",
            "bg-white/60 hover:bg-white/80 border-gray-200/50"
          )}>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent className="backdrop-blur-xl bg-white/95 border-gray-200/50">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sofia">Sofia</SelectItem>
            <SelectItem value="eduardo">Eduardo</SelectItem>
            <SelectItem value="iris">IRIS</SelectItem>
          </SelectContent>
        </Select>

        {/* Sentimento */}
        <Select
          value={filters.sentiment || 'all'}
          onValueChange={(value) =>
            onFilterChange({ ...filters, sentiment: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className={cn(
            "w-[140px] h-8 text-xs backdrop-blur-md",
            "bg-white/60 hover:bg-white/80 border-gray-200/50"
          )}>
            <SelectValue placeholder="Sentimento" />
          </SelectTrigger>
          <SelectContent className="backdrop-blur-xl bg-white/95 border-gray-200/50">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="positive">Positivo</SelectItem>
            <SelectItem value="neutral">Neutro</SelectItem>
            <SelectItem value="negative">Negativo</SelectItem>
          </SelectContent>
        </Select>

        {/* Toggles */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onFilterChange({ ...filters, unreadOnly: !filters.unreadOnly })}
            className={cn(
              "h-8 text-xs backdrop-blur-md transition-all",
              filters.unreadOnly 
                ? 'bg-orange-500/90 text-white hover:bg-orange-600 shadow-md' 
                : 'bg-white/60 hover:bg-white/80 border-gray-200/50 text-gray-700'
            )}
          >
            Não Lidas
          </Button>
        </div>
      </div>

      {/* Calendário de período */}
      <DateRangePicker
        value={{ from: filters.dateFrom, to: filters.dateTo }}
        onChange={(range) => onFilterChange({ ...filters, dateFrom: range.from, dateTo: range.to })}
      />
    </div>
  );
};

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Filter } from 'lucide-react';

interface CRMFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onRefresh: () => void;
}

export const CRMFilters: React.FC<CRMFiltersProps> = ({ filters, onFilterChange, onRefresh }) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros:</span>
      </div>

      {/* Agente */}
      <Select
        value={filters.agentKey || 'all'}
        onValueChange={(value) =>
          onFilterChange({ ...filters, agentKey: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos os agentes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os agentes</SelectItem>
          <SelectItem value="sofia">Sofia (IA Vendas)</SelectItem>
          <SelectItem value="eduardo">Eduardo (Humano)</SelectItem>
          <SelectItem value="iris">IRIS (IA Diretoria)</SelectItem>
          <SelectItem value="exa_alert">EXA Alert</SelectItem>
        </SelectContent>
      </Select>

      {/* Sentimento */}
      <Select
        value={filters.sentiment || 'all'}
        onValueChange={(value) =>
          onFilterChange({ ...filters, sentiment: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos os sentimentos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="positive">Positivo</SelectItem>
          <SelectItem value="neutral">Neutro</SelectItem>
          <SelectItem value="negative">Negativo</SelectItem>
          <SelectItem value="angry">Irritado</SelectItem>
        </SelectContent>
      </Select>

      {/* Toggles */}
      <div className="flex gap-2">
        <Button
          variant={filters.unreadOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filters, unreadOnly: !filters.unreadOnly })}
        >
          Não Lidas
        </Button>
        <Button
          variant={filters.criticalOnly ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filters, criticalOnly: !filters.criticalOnly })}
        >
          Críticas
        </Button>
        <Button
          variant={filters.hotLeadsOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filters, hotLeadsOnly: !filters.hotLeadsOnly })}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Leads Quentes
        </Button>
      </div>

      <div className="ml-auto">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
    </div>
  );
};

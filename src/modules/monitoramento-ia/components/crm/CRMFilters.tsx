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
        <SelectTrigger className="w-[180px] bg-module-card border-module text-module-primary">
          <SelectValue placeholder="Todos os agentes" />
        </SelectTrigger>
        <SelectContent className="bg-module-card border-module text-module-primary z-50">
          <SelectItem value="all" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Todos os agentes</SelectItem>
          <SelectItem value="sofia" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Sofia (IA Vendas)</SelectItem>
          <SelectItem value="eduardo" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Eduardo (Humano)</SelectItem>
          <SelectItem value="iris" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">IRIS (IA Diretoria)</SelectItem>
          <SelectItem value="exa_alert" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">EXA Alert</SelectItem>
        </SelectContent>
      </Select>

      {/* Sentimento */}
      <Select
        value={filters.sentiment || 'all'}
        onValueChange={(value) =>
          onFilterChange({ ...filters, sentiment: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px] bg-module-card border-module text-module-primary">
          <SelectValue placeholder="Todos os sentimentos" />
        </SelectTrigger>
        <SelectContent className="bg-module-card border-module text-module-primary z-50">
          <SelectItem value="all" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Todos</SelectItem>
          <SelectItem value="positive" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Positivo</SelectItem>
          <SelectItem value="neutral" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Neutro</SelectItem>
          <SelectItem value="negative" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Negativo</SelectItem>
          <SelectItem value="angry" className="hover:bg-module-secondary/50 focus:bg-module-secondary/50">Irritado</SelectItem>
        </SelectContent>
      </Select>

      {/* Toggles */}
      <div className="flex gap-2">
        <Button
          variant={filters.unreadOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filters, unreadOnly: !filters.unreadOnly })}
          className={filters.unreadOnly ? '' : 'border-module text-module-primary hover:bg-module-secondary/50'}
        >
          Não Lidas
        </Button>
        <Button
          variant={filters.criticalOnly ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filters, criticalOnly: !filters.criticalOnly })}
          className={filters.criticalOnly ? '' : 'border-module text-module-primary hover:bg-module-secondary/50'}
        >
          Críticas
        </Button>
        <Button
          variant={filters.hotLeadsOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange({ ...filters, hotLeadsOnly: !filters.hotLeadsOnly })}
          className={filters.hotLeadsOnly ? 'bg-orange-500 hover:bg-orange-600' : 'border-module text-module-primary hover:bg-module-secondary/50'}
        >
          Leads Quentes
        </Button>
      </div>

      <div className="ml-auto">
        <Button variant="outline" size="sm" onClick={onRefresh} className="border-module text-module-primary hover:bg-module-secondary/50">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
    </div>
  );
};

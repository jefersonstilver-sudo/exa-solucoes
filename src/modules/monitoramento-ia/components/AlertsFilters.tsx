import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { AlertFilters } from '../utils/alerts';

interface AlertsFiltersProps {
  filters: AlertFilters;
  condominios: string[];
  onFiltersChange: (filters: AlertFilters) => void;
  onClearFilters: () => void;
}

export const AlertsFilters = ({ 
  filters, 
  condominios, 
  onFiltersChange,
  onClearFilters 
}: AlertsFiltersProps) => {
  return (
    <div className="bg-module-card rounded-xl p-4 mb-6 space-y-4 border border-module">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-module-muted" />
        <Input
          placeholder="Buscar por painel, condomínio ou tipo..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 bg-module-input border-module border text-module-primary placeholder-module-muted"
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status */}
        <Select
          value={filters.status?.[0] || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              status: value === 'all' ? undefined : [value] 
            })
          }
        >
          <SelectTrigger className="bg-module-input border-module border text-module-primary">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-module-card border-module border z-50">
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
          </SelectContent>
        </Select>

        {/* Severity */}
        <Select
          value={filters.severity?.[0] || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              severity: value === 'all' ? undefined : [value] 
            })
          }
        >
          <SelectTrigger className="bg-module-input border-module border text-module-primary">
            <SelectValue placeholder="Severidade" />
          </SelectTrigger>
          <SelectContent className="bg-module-card border-module border z-50">
            <SelectItem value="all">Todas as severidades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>

        {/* Condominio */}
        <Select
          value={filters.condominio || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              condominio: value === 'all' ? undefined : value 
            })
          }
        >
          <SelectTrigger className="bg-module-input border-module border text-module-primary">
            <SelectValue placeholder="Condomínio" />
          </SelectTrigger>
          <SelectContent className="bg-module-card border-module border z-50">
            <SelectItem value="all">Todos os condomínios</SelectItem>
            {condominios.map((cond) => (
              <SelectItem key={cond} value={cond}>{cond}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Order By */}
        <Select
          value={filters.orderBy || 'opened_at'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              orderBy: value as AlertFilters['orderBy']
            })
          }
        >
          <SelectTrigger className="bg-module-input border-module border text-module-primary">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent className="bg-module-card border-module border z-50">
            <SelectItem value="severity">Severidade</SelectItem>
            <SelectItem value="opened_at">Tempo aberto</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="name">Nome do painel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className="w-full md:w-auto bg-module-input border-module border text-module-primary hover:bg-module-accent-hover"
      >
        <X className="w-4 h-4 mr-2" />
        Limpar filtros
      </Button>
    </div>
  );
};

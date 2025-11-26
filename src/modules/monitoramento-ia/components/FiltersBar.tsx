import { Search, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import { DevicesFilters, DevicesSort } from '../utils/devices';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface FiltersBarProps {
  filters: DevicesFilters;
  sort: DevicesSort;
  onFiltersChange: (filters: DevicesFilters) => void;
  onSortChange: (sort: DevicesSort) => void;
  onNewPanel: () => void;
}

export const FiltersBar = ({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onNewPanel,
}: FiltersBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-module-card border-module border rounded-xl shadow-sm mb-6">
      <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-module-hover/30 transition-colors">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-module-secondary" />
          <span className="text-lg font-semibold text-module-primary">Buscar e Filtrar</span>
          {(filters.search || filters.status?.length || filters.condominio || filters.torre) && (
            <span className="text-xs bg-module-accent text-white px-2 py-1 rounded-full">
              Filtros ativos
            </span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-module-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-6 pb-6 pt-2">
          {/* Linha 1: Busca e botão novo */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-module-tertiary" />
          <input
            type="text"
            placeholder="Buscar por nome, prédio ou AnyDesk ID..."
            value={filters.search || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2.5 bg-module-input border-module border rounded-lg text-module-primary placeholder-module-muted focus:outline-none focus:ring-2 focus:ring-module-accent focus:border-transparent"
          />
        </div>
        <button
          onClick={onNewPanel}
          className="bg-module-accent hover:bg-module-accent-hover text-white font-semibold px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          + Novo Painel
        </button>
      </div>

      {/* Linha 2: Filtros e ordenação */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Filtro de Status */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-module-secondary" />
          <select
            value={filters.status?.[0] || ''}
            onChange={(e) => {
              const value = e.target.value;
              onFiltersChange({ ...filters, status: value ? [value] : [] });
            }}
            className="bg-module-input border-module border rounded-lg px-3 py-2 text-sm text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
          >
            <option value="">Todos os status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="unknown">Desconhecido</option>
          </select>
        </div>

        {/* Filtro de Condomínio */}
        <input
          type="text"
          placeholder="Filtrar por condomínio..."
          value={filters.condominio || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, condominio: e.target.value })
          }
          className="bg-module-input border-module border rounded-lg px-3 py-2 text-sm text-module-primary placeholder-module-muted focus:outline-none focus:ring-2 focus:ring-module-accent"
        />

        {/* Filtro de Torre */}
        <input
          type="text"
          placeholder="Filtrar por torre..."
          value={filters.torre || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, torre: e.target.value })
          }
          className="bg-module-input border-module border rounded-lg px-3 py-2 text-sm text-module-primary placeholder-module-muted focus:outline-none focus:ring-2 focus:ring-module-accent"
        />

        {/* Ordenação */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-module-secondary" />
          <select
            value={`${sort.field}-${sort.order}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              onSortChange({
                field: field as DevicesSort['field'],
                order: order as DevicesSort['order'],
              });
            }}
            className="bg-module-input border-module border rounded-lg px-3 py-2 text-sm text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
          >
            <option value="name-asc">Nome (A-Z)</option>
            <option value="name-desc">Nome (Z-A)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="status-desc">Status (Z-A)</option>
            <option value="last_online-desc">Último online (Recente)</option>
            <option value="last_online-asc">Último online (Antigo)</option>
          </select>
        </div>
      </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

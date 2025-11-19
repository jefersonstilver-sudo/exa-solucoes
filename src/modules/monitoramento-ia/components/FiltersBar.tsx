import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { DevicesFilters, DevicesSort } from '../utils/devices';

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
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-6">
      {/* Linha 1: Busca e botão novo */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, prédio ou AnyDesk ID..."
            value={filters.search || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD000] focus:border-transparent"
          />
        </div>
        <button
          onClick={onNewPanel}
          className="bg-[#FFD000] hover:bg-[#E6BB00] text-[#0A0A0A] font-semibold px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          + Novo Painel
        </button>
      </div>

      {/* Linha 2: Filtros e ordenação */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Filtro de Status */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            multiple
            value={filters.status || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
              onFiltersChange({ ...filters, status: selected });
            }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD000]"
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
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD000]"
        />

        {/* Filtro de Torre */}
        <input
          type="text"
          placeholder="Filtrar por torre..."
          value={filters.torre || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, torre: e.target.value })
          }
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD000]"
        />

        {/* Ordenação */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <select
            value={`${sort.field}-${sort.order}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              onSortChange({
                field: field as DevicesSort['field'],
                order: order as DevicesSort['order'],
              });
            }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD000]"
          >
            <option value="name-asc">Nome (A-Z)</option>
            <option value="name-desc">Nome (Z-A)</option>
            <option value="condominio_name-asc">Condomínio (A-Z)</option>
            <option value="condominio_name-desc">Condomínio (Z-A)</option>
            <option value="last_online_at-desc">Último online (mais recente)</option>
            <option value="last_online_at-asc">Último online (mais antigo)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="status-desc">Status (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

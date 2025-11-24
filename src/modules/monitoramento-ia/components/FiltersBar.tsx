import { Search, ArrowUpDown, Wifi, WifiOff, HelpCircle } from 'lucide-react';
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
  const statusButtons = [
    { value: '', label: 'Todos', icon: null },
    { value: 'offline', label: 'Offline', icon: WifiOff },
    { value: 'online', label: 'Online', icon: Wifi },
    { value: 'unknown', label: 'Desconhecido', icon: HelpCircle },
  ];

  const sortOptions = [
    { value: 'status-desc', label: 'Offline Primeiro' },
    { value: 'status-asc', label: 'Online Primeiro' },
    { value: 'name-asc', label: 'Nome (A-Z)' },
    { value: 'name-desc', label: 'Nome (Z-A)' },
    { value: 'last_online-desc', label: 'Recente' },
    { value: 'last_online-asc', label: 'Antigo' },
  ];

  return (
    <div className="bg-module-card border-module border rounded-xl shadow-sm p-4 mb-6">
      {/* Busca */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-module-tertiary" />
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.search || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="w-full pl-9 pr-3 py-2 bg-module-input border-module border rounded-lg text-sm text-module-primary placeholder-module-muted focus:outline-none focus:ring-1 focus:ring-module-accent"
          />
        </div>
        <button
          onClick={onNewPanel}
          className="bg-module-accent hover:bg-module-accent-hover text-white font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm"
        >
          + Novo
        </button>
      </div>

      {/* Filtros por Status - Botões */}
      <div className="flex flex-wrap gap-2 mb-3">
        {statusButtons.map((btn) => {
          const isActive = (filters.status?.[0] || '') === btn.value;
          const Icon = btn.icon;
          return (
            <button
              key={btn.value}
              onClick={() =>
                onFiltersChange({ ...filters, status: btn.value ? [btn.value] : [] })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-module-accent text-white'
                  : 'bg-module-input text-module-secondary hover:bg-module-accent/10 border border-module'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Ordenação - Botões */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-3.5 h-3.5 text-module-tertiary" />
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => {
            const isActive = `${sort.field}-${sort.order}` === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  const [field, order] = option.value.split('-');
                  onSortChange({
                    field: field as DevicesSort['field'],
                    order: order as DevicesSort['order'],
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-module-accent text-white'
                    : 'bg-module-input text-module-secondary hover:bg-module-accent/10 border border-module'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

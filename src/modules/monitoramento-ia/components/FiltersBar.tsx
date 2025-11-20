import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { DevicesFilters, DevicesSort } from '../utils/devices';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

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
  const { theme } = useModuleTheme();
  const tc = getThemeClasses(theme);
  
  return (
    <div className={`${tc.bgCard} ${tc.border} border rounded-xl shadow-sm p-4 lg:p-6 mb-6`}>
      {/* Linha 1: Busca e botão novo */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${tc.textTertiary}`} />
          <input
            type="text"
            placeholder="Buscar por nome, prédio ou AnyDesk ID..."
            value={filters.search || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className={`w-full pl-10 pr-4 py-2.5 ${tc.bgInput} ${tc.border} border rounded-lg ${tc.textPrimary} ${tc.placeholder} focus:outline-none focus:ring-2 ${tc.focusRing} focus:border-transparent`}
          />
        </div>
        <button
          onClick={onNewPanel}
          className={`${tc.bgAccent} ${tc.bgAccentHover} text-white font-semibold px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap`}
        >
          + Novo Painel
        </button>
      </div>

      {/* Linha 2: Filtros e ordenação */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Filtro de Status */}
        <div className="flex items-center gap-2">
          <Filter className={`w-4 h-4 ${tc.textSecondary}`} />
          <select
            value={filters.status?.[0] || ''}
            onChange={(e) => {
              const value = e.target.value;
              onFiltersChange({ ...filters, status: value ? [value] : [] });
            }}
            className={`${tc.bgInput} ${tc.border} border rounded-lg px-3 py-2 text-sm ${tc.textPrimary} focus:outline-none focus:ring-2 ${tc.focusRing}`}
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
          className={`${tc.bgInput} ${tc.border} border rounded-lg px-3 py-2 text-sm ${tc.textPrimary} ${tc.placeholder} focus:outline-none focus:ring-2 ${tc.focusRing}`}
        />

        {/* Filtro de Torre */}
        <input
          type="text"
          placeholder="Filtrar por torre..."
          value={filters.torre || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, torre: e.target.value })
          }
          className={`${tc.bgInput} ${tc.border} border rounded-lg px-3 py-2 text-sm ${tc.textPrimary} ${tc.placeholder} focus:outline-none focus:ring-2 ${tc.focusRing}`}
        />

        {/* Ordenação */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className={`w-4 h-4 ${tc.textSecondary}`} />
          <select
            value={`${sort.field}-${sort.order}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              onSortChange({
                field: field as DevicesSort['field'],
                order: order as DevicesSort['order'],
              });
            }}
            className={`${tc.bgInput} ${tc.border} border rounded-lg px-3 py-2 text-sm ${tc.textPrimary} focus:outline-none focus:ring-2 ${tc.focusRing}`}
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
  );
};

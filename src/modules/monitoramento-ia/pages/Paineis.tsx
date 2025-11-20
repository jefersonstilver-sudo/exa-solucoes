import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Device,
  calculateDeviceStats,
} from '../utils/devices';
import { PanelCard } from '../components/PanelCard';
import { PanelDetailModal } from '../components/PanelDetailModal';
import { FiltersBar } from '../components/FiltersBar';
import { useDevices } from '../hooks/useDevices';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Simple StatCard component for Paineis page
const SimpleStatCard = ({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'red' | 'gray' }) => {
  
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-[#9C1E1E]',
    gray: 'text-module-secondary',
  };
  
  return (
    <div className="bg-module-card border border-module rounded-[14px] p-4">
      <p className="text-module-secondary text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>
        {value}
      </p>
    </div>
  );
};

export const PaineisPage = () => {
  const {
    devices,
    loading,
    lastUpdate,
    page,
    setPage,
    total,
    filters,
    setFilters,
    sort,
    setSort,
    refresh,
  } = useDevices(0, 30);

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const handleRefresh = () => {
    refresh();
  };

  const stats = calculateDeviceStats(devices);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${tc.bgCard} ${tc.border} border px-6 py-4 rounded-xl`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${tc.textPrimary}`}>
              Painéis
            </h1>
            <p className={`text-sm ${tc.textSecondary} mt-1`}>
              Última atualização:{' '}
              {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2.5 ${tc.border} border ${tc.textPrimary} rounded-lg ${tc.bgHover} transition-colors disabled:opacity-50`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <div className={`text-xs ${tc.textSecondary} hidden lg:block`}>
              Auto-atualização: 5 min
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleStatCard label="Total" value={stats.total} color="blue" />
        <SimpleStatCard label="Online" value={stats.online} color="green" />
        <SimpleStatCard label="Offline" value={stats.offline} color="red" />
        <SimpleStatCard label="Desconhecido" value={stats.unknown} color="gray" />
      </div>

      {/* Filtros */}
      <FiltersBar
        filters={filters}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        onNewPanel={() => setShowNewModal(true)}
      />

      {/* Loading state */}
      {loading && devices.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#9C1E1E]"></div>
          <p className={`mt-4 ${tc.textSecondary}`}>Carregando painéis...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className={`text-center py-12 ${tc.bgCard} rounded-xl shadow-sm ${tc.border} border p-8`}>
          <p className={tc.textSecondary}>Nenhum painel encontrado</p>
        </div>
      ) : (
        <>
          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <PanelCard
                key={device.id}
                device={device}
                onClick={() => setSelectedDevice(device)}
              />
            ))}
          </div>

          {/* Paginação */}
          {total > 30 && (
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className={`px-4 py-2 ${tc.border} border rounded-lg ${tc.bgHover} disabled:opacity-50 disabled:cursor-not-allowed ${tc.textPrimary}`}
              >
                Anterior
              </button>
              <span className={`px-4 py-2 ${tc.textPrimary}`}>
                Página {page + 1} de {Math.ceil(total / 30)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * 30 >= total}
                className={`px-4 py-2 ${tc.border} border rounded-lg ${tc.bgHover} disabled:opacity-50 disabled:cursor-not-allowed ${tc.textPrimary}`}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de detalhes */}
      {selectedDevice && (
        <PanelDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onUpdate={refresh}
        />
      )}
    </div>
  );
};

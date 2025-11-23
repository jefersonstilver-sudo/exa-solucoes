import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import {
  Device,
  calculateDeviceStats,
} from '../utils/devices';
import { PanelCard } from '../components/PanelCard';
import { ComputerDetailModal } from '../components/anydesk/ComputerDetailModal';
import { FiltersBar } from '../components/FiltersBar';
import { useDevices } from '../hooks/useDevices';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Simple StatCard component for Paineis page
const SimpleStatCard = ({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'red' | 'gray' }) => {
  
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-[#9C1E1E]',
    gray: 'text-module-secondary',
  };
  
  return (
    <div className="glass-card rounded-[14px] p-4 hover:scale-105 transition-all">
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
  const [topOfflinePanels, setTopOfflinePanels] = useState<Device[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleRefresh = () => {
    refresh();
  };

  const handleSyncAnyDesk = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const SUPABASE_URL = "https://aakenoljsycyrcrchgxj.supabase.co";
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/sync-anydesk`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro na sincronização: ${error}`);
      }

      const result = await response.json();
      console.log('[SYNC] Resultado:', result);
      
      toast.success(`Sincronização concluída! ${result.summary?.devices_updated || 0} atualizados, ${result.summary?.devices_created || 0} criados`);
      
      // Recarregar dados
      refresh();
    } catch (error) {
      console.error('[SYNC] Erro:', error);
      toast.error('Erro ao sincronizar com AnyDesk');
    } finally {
      setSyncing(false);
    }
  };

  const stats = calculateDeviceStats(devices);

  // Auto-sync do AnyDesk a cada 4 segundos (em background)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const SUPABASE_URL = "https://aakenoljsycyrcrchgxj.supabase.co";
        await fetch(`${SUPABASE_URL}/functions/v1/sync-anydesk`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('[AUTO-SYNC] Sincronização automática executada');
      } catch (error) {
        console.error('[AUTO-SYNC] Erro na sincronização automática:', error);
      }
    }, 4000); // 4 segundos

    return () => clearInterval(syncInterval);
  }, []);

  // Buscar top 3 painéis com mais quedas
  useEffect(() => {
    const fetchTopOffline = async () => {
      try {
        const { data: topData } = await supabase
          .from('devices')
          .select('*')
          .order('offline_count', { ascending: false })
          .limit(3);

        if (topData) setTopOfflinePanels(topData as Device[]);
      } catch (error) {
        console.error('Erro ao buscar dados de offline:', error);
      }
    };

    fetchTopOffline();
  }, [devices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card border-white/10 px-6 py-4 rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary">
              Painéis
            </h1>
            <p className="text-sm text-module-secondary mt-1">
              Última atualização:{' '}
              {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncAnyDesk}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar AnyDesk
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 border-module border text-module-primary rounded-lg hover:bg-module-hover transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <div className="text-xs text-module-secondary hidden lg:block">
              Auto-refresh: 4s
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

      {/* Card de Mais Quedas */}
      <div className="glass-card border-white/10 rounded-[14px] p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-bold text-module-primary">Painéis com Mais Quedas</h3>
        </div>
        <div className="space-y-3">
          {topOfflinePanels.length > 0 ? (
            topOfflinePanels.map((panel) => (
              <div key={panel.id} className="flex items-center justify-between p-3 bg-module-input rounded-lg border border-module">
                <div>
                  <p className="text-sm font-medium text-module-primary">{panel.comments || panel.name}</p>
                  <p className="text-xs text-module-tertiary">{panel.condominio_name}</p>
                </div>
                <span className="text-lg font-bold text-red-500">{panel.offline_count || 0} quedas</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-module-secondary">Nenhum dado disponível</p>
          )}
        </div>
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
          <p className="mt-4 text-module-secondary">Carregando painéis...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 bg-module-card rounded-xl shadow-sm border-module border p-8">
          <p className="text-module-secondary">Nenhum painel encontrado</p>
        </div>
      ) : (
        <>
          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <PanelCard
                key={device.id}
                device={device}
                onClick={() => {
                  setSelectedDevice(device);
                  setIsDetailModalOpen(true);
                }}
              />
            ))}
          </div>

          {/* Paginação */}
          {total > 30 && (
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 border-module border rounded-lg hover:bg-module-hover disabled:opacity-50 disabled:cursor-not-allowed text-module-primary"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-module-primary">
                Página {page + 1} de {Math.ceil(total / 30)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * 30 >= total}
                className="px-4 py-2 border-module border rounded-lg hover:bg-module-hover disabled:opacity-50 disabled:cursor-not-allowed text-module-primary"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de detalhes */}
      {selectedDevice && (
        <ComputerDetailModal
          computer={selectedDevice}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedDevice(null);
          }}
        />
      )}
    </div>
  );
};

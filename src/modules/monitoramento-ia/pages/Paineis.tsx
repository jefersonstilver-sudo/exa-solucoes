import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Clock, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import {
  Device,
  calculateDeviceStats,
} from '../utils/devices';
import { PanelCard } from '../components/PanelCard';
import { ComputerDetailModal } from '../components/anydesk/ComputerDetailModal';
import { FiltersBar } from '../components/FiltersBar';
import { useDevices } from '../hooks/useDevices';
import { useModuleTheme } from '../hooks/useModuleTheme';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Simple StatCard component for Paineis page
const SimpleStatCard = ({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'red' | 'gray' }) => {
  
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-[#9C1E1E]',
    gray: 'text-module-secondary',
  };
  
  return (
    <div className="glass-card border-module rounded-[14px] p-4 hover:scale-105 transition-all shadow-sm">
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

  const { theme } = useModuleTheme();

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [topOfflinePanels, setTopOfflinePanels] = useState<Device[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [quedaPeriod, setQuedaPeriod] = useState<'hoje' | '7dias' | '30dias'>('hoje');
  const [isQuedasOpen, setIsQuedasOpen] = useState(false);

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

  // Buscar TODAS as quedas do período selecionado (hoje/7dias/30dias)
  useEffect(() => {
    const fetchAllDrops = async () => {
      try {
        let startDate: Date;
        const endDate = endOfDay(new Date());
        
        switch (quedaPeriod) {
          case 'hoje':
            startDate = startOfDay(new Date());
            break;
          case '7dias':
            startDate = startOfDay(subDays(new Date(), 7));
            break;
          case '30dias':
            startDate = startOfDay(subDays(new Date(), 30));
            break;
          default:
            startDate = startOfDay(new Date());
        }

        // Buscar TODOS os painéis que tiveram quedas no período (sem limit)
        const { data: dropsData } = await supabase
          .from('devices')
          .select('*')
          .gt('offline_count', 0)
          .order('offline_count', { ascending: false });

        if (dropsData) {
          // Filtrar apenas os que realmente tiveram quedas no período
          const filteredDrops = dropsData.filter(device => {
            if (!device.last_online_at) return false;
            const lastOnline = new Date(device.last_online_at);
            return lastOnline >= startDate && lastOnline <= endDate;
          });
          setTopOfflinePanels(filteredDrops as Device[]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados de quedas:', error);
      }
    };

    fetchAllDrops();
  }, [devices, quedaPeriod]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card border-module px-6 py-4 rounded-xl shadow-sm">
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
            {/* Seletor de Período - Ícone */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2.5 border-module-border border text-module-primary rounded-lg hover:bg-module-secondary/20 transition-colors">
                  <CalendarIcon className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <Select value={quedaPeriod} onValueChange={(value: any) => setQuedaPeriod(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                    <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </PopoverContent>
            </Popover>

            {/* Sincronizar AnyDesk - Apenas Ícone */}
            <button
              onClick={handleSyncAnyDesk}
              disabled={syncing}
              title="Sincronizar AnyDesk"
              className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>
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

      {/* Card de TODAS as Quedas - Colapsável */}
      <Collapsible open={isQuedasOpen} onOpenChange={setIsQuedasOpen}>
        <div className="glass-card border-module rounded-[14px] p-4 shadow-sm">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-module-primary">
                  {quedaPeriod === 'hoje' ? 'Todas as Quedas de Hoje' : 
                   quedaPeriod === '7dias' ? 'Quedas dos Últimos 7 Dias' : 
                   'Quedas dos Últimos 30 Dias'}
                </h3>
                <Badge variant="destructive" className="ml-2 animate-pulse bg-red-600 text-white">
                  {topOfflinePanels.reduce((sum, panel) => sum + (panel.offline_count || 0), 0)} quedas
                </Badge>
              </div>
              <ChevronDown className={`w-5 h-5 text-module-secondary transition-transform ${isQuedasOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {topOfflinePanels.length > 0 ? (
                topOfflinePanels.map((panel) => {
                  const displayName = (panel.comments || panel.name).split(' - ')[0].trim();
                  
                  // Calcular hora da queda e tempo offline
                  const quedaTime = panel.metadata?.last_drop_at 
                    ? format(new Date(panel.metadata.last_drop_at), 'HH:mm', { locale: ptBR }) 
                    : panel.last_online_at 
                      ? format(new Date(panel.last_online_at), 'HH:mm', { locale: ptBR })
                      : '-';
                  
                  let tempoOffline = '-';
                  const referenceTime = panel.metadata?.last_drop_at || panel.last_online_at;
                  
                  if (referenceTime) {
                    const offlineStart = new Date(referenceTime);
                    const now = new Date();
                    const diffMs = now.getTime() - offlineStart.getTime();
                    const diffSeconds = Math.floor(diffMs / 1000);
                    const diffMinutes = Math.floor(diffSeconds / 60);
                    const diffHours = Math.floor(diffMinutes / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    
                    if (diffDays > 0) {
                      tempoOffline = `${diffDays}d ${diffHours % 24}h`;
                    } else if (diffHours > 0) {
                      tempoOffline = `${diffHours}h ${diffMinutes % 60}m`;
                    } else if (diffMinutes > 0) {
                      tempoOffline = `${diffMinutes}m ${diffSeconds % 60}s`;
                    } else {
                      tempoOffline = `${diffSeconds}s`;
                    }
                  }
                  
                  return (
                    <div key={panel.id} className="flex items-center justify-between p-3 bg-module-secondary rounded-lg border border-module hover:bg-module-hover transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-module-primary">{displayName}</p>
                        <p className="text-xs text-module-tertiary">{panel.condominio_name || 'Sem condomínio'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-module-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Queda: {quedaTime}
                          </span>
                          <span className="text-xs text-module-secondary">
                            Offline: {tempoOffline}
                          </span>
                        </div>
                      </div>
                      <span className="text-base font-bold text-red-600 ml-4">{panel.offline_count || 0}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-module-secondary text-center py-4">Nenhuma queda registrada no período selecionado</p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

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
          theme={theme}
        />
      )}
    </div>
  );
};

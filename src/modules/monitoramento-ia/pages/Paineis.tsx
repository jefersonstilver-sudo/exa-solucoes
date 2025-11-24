import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Clock, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import {
  Device,
  calculateDeviceStats,
} from '../utils/devices';
import { PanelCard } from '../components/PanelCard';
import { ComputerDetailModal } from '../components/anydesk/ComputerDetailModal';
import { FiltersBar } from '../components/FiltersBar';
import { QuedaDiariaList } from '../components/QuedaDiariaList';
import { OfflineAlert } from '../components/OfflineAlert';
import { useOfflineAlerts } from '../hooks/useOfflineAlerts';
import { AnimatePresence } from 'framer-motion';
import { useDevices } from '../hooks/useDevices';
import { useModuleTheme } from '../hooks/useModuleTheme';
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfYesterday, endOfYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { PeriodSelector, PeriodType } from '../components/PeriodSelector';

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
  const [todasQuedas, setTodasQuedas] = useState<any[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [quedaPeriod, setQuedaPeriod] = useState<PeriodType>('hoje');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [isQuedasOpen, setIsQuedasOpen] = useState(false);
  
  // Hook de alertas offline
  const { offlineDevices, activeAlerts, dismissAlert } = useOfflineAlerts();

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

  // Buscar TODAS as quedas do período com detalhes de connection_history
  useEffect(() => {
    const fetchAllDrops = async () => {
      try {
        let startDate: Date;
        const endDate = endOfDay(new Date());
        
        switch (quedaPeriod) {
          case 'hoje':
            startDate = startOfDay(new Date());
            break;
          case 'ontem':
            startDate = startOfYesterday();
            break;
          case 'esta-semana':
            startDate = startOfWeek(new Date(), { locale: ptBR });
            break;
          case '7dias':
            startDate = startOfDay(subDays(new Date(), 7));
            break;
          case '30dias':
            startDate = startOfDay(subDays(new Date(), 30));
            break;
          case 'personalizado':
            if (customStartDate && customEndDate) {
              startDate = startOfDay(customStartDate);
            } else {
              startDate = startOfDay(new Date());
            }
            break;
          default:
            startDate = startOfDay(new Date());
        }

        // Buscar todas as desconexões do período
        const { data: connectionHistory, error } = await supabase
          .from('connection_history')
          .select(`
            *,
            devices!inner(id, name, comments, condominio_name)
          `)
          .eq('event_type', 'offline')
          .gte('started_at', startDate.toISOString())
          .lte('started_at', endDate.toISOString())
          .order('started_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar connection_history:', error);
          return;
        }

        if (!connectionHistory || connectionHistory.length === 0) {
          setTodasQuedas([]);
          return;
        }

        // Agrupar por painel
        const quedaPorPainel = new Map();

        connectionHistory.forEach((conn: any) => {
          const painelId = conn.computer_id;
          const painelData = conn.devices;
          
          if (!painelData) return;

          if (!quedaPorPainel.has(painelId)) {
            // Limpar nome do painel para evitar duplicação
            const rawName = painelData.comments || painelData.name || '';
            const cleanName = rawName.includes(' - ') 
              ? rawName.split(' - ')[0].trim() 
              : rawName.trim();
            
            quedaPorPainel.set(painelId, {
              painel_id: painelId,
              painel_nome: cleanName,
              condominio_nome: painelData.condominio_name || 'Sem condomínio',
              total_ocorrencias: 0,
              tempo_total_offline_segundos: 0,
              ocorrencias: []
            });
          }

          const painelInfo = quedaPorPainel.get(painelId);
          painelInfo.total_ocorrencias++;
          painelInfo.tempo_total_offline_segundos += (conn.duration_seconds || 0);
          painelInfo.ocorrencias.push({
            inicio: conn.started_at,
            fim: conn.ended_at,
            duracao_segundos: conn.duration_seconds || 0
          });
        });

        // Converter para array e ordenar por tempo total offline
        const quedasArray = Array.from(quedaPorPainel.values())
          .sort((a, b) => b.tempo_total_offline_segundos - a.tempo_total_offline_segundos);

        setTodasQuedas(quedasArray);
      } catch (error) {
        console.error('Erro ao buscar dados de quedas:', error);
        setTodasQuedas([]);
      }
    };

    fetchAllDrops();
  }, [devices, quedaPeriod, customStartDate, customEndDate]);

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
            {/* Seletor de Período */}
            <PeriodSelector
              value={quedaPeriod}
              onChange={(value, customStart, customEnd) => {
                setQuedaPeriod(value);
                if (customStart) setCustomStartDate(customStart);
                if (customEnd) setCustomEndDate(customEnd);
              }}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
            />

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
                   quedaPeriod === 'ontem' ? 'Todas as Quedas de Ontem' :
                   quedaPeriod === 'esta-semana' ? 'Quedas desta Semana' :
                   quedaPeriod === '7dias' ? 'Quedas dos Últimos 7 Dias' : 
                   quedaPeriod === '30dias' ? 'Quedas dos Últimos 30 Dias' :
                   'Quedas do Período Selecionado'}
                </h3>
                <Badge variant="destructive" className="ml-2 animate-pulse bg-red-600 text-white">
                  {todasQuedas.reduce((sum, painel) => sum + painel.total_ocorrencias, 0)} quedas
                </Badge>
              </div>
              <ChevronDown className={`w-5 h-5 text-module-secondary transition-transform ${isQuedasOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <QuedaDiariaList paineis={todasQuedas} />
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
      
      {/* Alertas flutuantes de painéis offline */}
      <div className="fixed top-20 right-6 z-50 space-y-3 max-w-md">
        <AnimatePresence mode="popLayout">
          {offlineDevices
            .filter(device => activeAlerts.includes(device.id))
            .slice(0, 3) // Mostrar no máximo 3 alertas
            .map(device => (
              <OfflineAlert
                key={device.id}
                panelName={device.name}
                onClose={() => dismissAlert(device.id)}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

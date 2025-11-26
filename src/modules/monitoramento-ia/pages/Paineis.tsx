import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Clock, ChevronDown, Calendar as CalendarIcon, Maximize2, Monitor, Wifi, WifiOff, HelpCircle } from 'lucide-react';
import {
  Device,
  calculateDeviceStats,
} from '../utils/devices';
import { PanelCard } from '../components/PanelCard';
import { ComputerDetailModal } from '../components/anydesk/ComputerDetailModal';
import { FiltersBar } from '../components/FiltersBar';
import { PanelsListView } from '../components/PanelsListView';
import { FullscreenMonitor } from '../components/FullscreenMonitor';
import { ViewToggle } from '../components/ViewToggle';
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
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';
import { Sidebar } from '../components/Sidebar';

// Compact Stat Icon Component for mobile
const CompactStatIcon = ({ icon: Icon, value, color, label }: { 
  icon: any; 
  value: number; 
  color: string;
  label: string;
}) => {
  return (
    <div className="relative flex items-center justify-center">
      <Icon className={`w-10 h-10 ${color}`} strokeWidth={1.5} />
      <span className="absolute text-xs font-bold text-white">
        {value}
      </span>
    </div>
  );
};

// Simple StatCard component for Paineis page
const SimpleStatCard = ({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'red' | 'gray' }) => {
  
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-[#9C1E1E]',
    gray: 'text-module-secondary',
  };
  
  return (
    <div className="bg-card border border-border rounded-[14px] p-4 hover:scale-105 transition-all shadow-sm">
      <p className="text-muted-foreground text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>
        {value}
      </p>
    </div>
  );
};

export const PaineisPage = () => {
  const navigate = useNavigate();
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  
  // Hook de alertas offline
  const { offlineDevices, activeAlerts, dismissAlert } = useOfflineAlerts();

  // Ordenar devices por total_events (mais eventos primeiro)
  const sortedDevices = [...devices].sort((a, b) => {
    const eventsA = (a as any).total_events || 0;
    const eventsB = (b as any).total_events || 0;
    return eventsB - eventsA;
  });

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
    <div className="min-h-screen bg-background">
      {/* Overlay para sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className="lg:hidden">
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

      <div className="space-y-4 lg:space-y-6 p-4 lg:p-6">
      {/* Header - Desktop e resumo mobile */}
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
            {/* Desktop: Título completo */}
            <div className="hidden lg:flex items-center justify-between lg:justify-start lg:gap-4 flex-1">
              <div>
                <h1 className="text-lg lg:text-3xl font-bold text-foreground flex items-center gap-2">
                  <span className="inline-flex w-2 h-2 lg:w-3 lg:h-3 bg-primary rounded-full animate-pulse" />
                  Painéis
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Mobile: Título pequeno + Relógio */}
            <div className="flex lg:hidden items-center justify-between">
              <h1 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="inline-flex w-2 h-2 bg-primary rounded-full animate-pulse" />
                Painéis
              </h1>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {format(lastUpdate, "HH:mm:ss")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(lastUpdate, "dd/MM", { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
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

              <button
                onClick={handleSyncAnyDesk}
                disabled={syncing}
                title="Sincronizar AnyDesk"
                className="p-2 lg:p-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats - Compacto em linha no mobile, collapsible */}
      <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Mobile: Linha compacta com ícones */}
          <CollapsibleTrigger className="w-full lg:hidden">
            <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <CompactStatIcon icon={Monitor} value={stats.total} color="text-blue-500" label="Total" />
                <CompactStatIcon icon={Wifi} value={stats.online} color="text-green-500" label="Online" />
                <CompactStatIcon icon={WifiOff} value={stats.offline} color="text-red-500" label="Offline" />
                <CompactStatIcon icon={HelpCircle} value={stats.unknown} color="text-gray-400" label="Desc" />
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${statsOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>

          {/* Desktop: Grid normal - sempre visível */}
          <div className="hidden lg:block p-4">
            <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
              <div className="bg-card border border-border rounded-[14px] p-4 hover:scale-105 transition-all shadow-sm">
                <p className="text-muted-foreground text-sm mb-1">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="bg-card border border-border rounded-[14px] p-4 hover:scale-105 transition-all shadow-sm">
                <p className="text-muted-foreground text-sm mb-1">Online</p>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
              </div>
              <div className="bg-card border border-border rounded-[14px] p-4 hover:scale-105 transition-all shadow-sm">
                <p className="text-muted-foreground text-sm mb-1">Offline</p>
                <p className="text-2xl font-bold text-[#9C1E1E]">{stats.offline}</p>
              </div>
              <div className="bg-card border border-border rounded-[14px] p-4 hover:scale-105 transition-all shadow-sm">
                <p className="text-muted-foreground text-sm mb-1">Desconhecido</p>
                <p className="text-2xl font-bold text-module-secondary">{stats.unknown}</p>
              </div>
            </div>
          </div>

          {/* Mobile: Detalhes expandidos */}
          <CollapsibleContent className="lg:hidden">
            <div className="p-3 space-y-2 border-t">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Total de Painéis</span>
                <span className="text-lg font-bold text-blue-600">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Online</span>
                <span className="text-lg font-bold text-green-600">{stats.online}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Offline</span>
                <span className="text-lg font-bold text-red-600">{stats.offline}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Desconhecido</span>
                <span className="text-lg font-bold text-gray-600">{stats.unknown}</span>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Quedas - Collapsible escondido por padrão no mobile */}
      <Collapsible open={isQuedasOpen} onOpenChange={setIsQuedasOpen}>
        <div className="bg-card border border-border rounded-[14px] p-3 lg:p-4 shadow-sm">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-red-600 shrink-0" />
                <h3 className="text-sm lg:text-lg font-bold text-foreground truncate">
                  {quedaPeriod === 'hoje' ? 'Quedas de Hoje' : 
                   quedaPeriod === 'ontem' ? 'Quedas de Ontem' :
                   quedaPeriod === 'esta-semana' ? 'Quedas desta Semana' :
                   quedaPeriod === '7dias' ? 'Últimos 7 Dias' : 
                   quedaPeriod === '30dias' ? 'Últimos 30 Dias' :
                   'Período Selecionado'}
                </h3>
                <Badge variant="destructive" className="animate-pulse bg-red-600 text-white text-xs lg:text-sm shrink-0">
                  {todasQuedas.reduce((sum, painel) => sum + painel.total_ocorrencias, 0)}
                </Badge>
              </div>
              <ChevronDown className={`w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground transition-transform shrink-0 ${isQuedasOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-3 lg:mt-4">
            <div className="flex justify-end mb-2 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/admin/monitoramento-ia/historico-quedas');
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Histórico
              </Button>
            </div>
            <div className="hidden lg:flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/admin/monitoramento-ia/historico-quedas');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Histórico Completo
              </Button>
            </div>
            <QuedaDiariaList paineis={todasQuedas} />
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Barra de ações - Mobile otimizado */}
      <div className="flex flex-col gap-3 lg:gap-4">
        <div className="w-full">
          <FiltersBar
            filters={filters}
            sort={sort}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            onNewPanel={() => setShowNewModal(true)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2.5 lg:p-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-sm"
            title="Modo Monitor (Tela Cheia)"
          >
            <Maximize2 className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && devices.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando painéis...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl shadow-sm border border-border p-8">
          <p className="text-muted-foreground">Nenhum painel encontrado</p>
        </div>
      ) : (
        <>
          {/* Visualização: Cards (2 cols mobile) ou Tabela (responsiva) */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
              {sortedDevices.map((device) => (
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
          ) : (
            <PanelsListView
              devices={sortedDevices}
              sort={sort}
              onSortChange={setSort}
              onDeviceClick={(device) => {
                setSelectedDevice(device);
                setIsDetailModalOpen(true);
              }}
            />
          )}

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
      
      {/* Modo Monitor Fullscreen */}
      {isFullscreen && (
        <FullscreenMonitor devices={devices} onClose={() => setIsFullscreen(false)} />
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
    </div>
  );
};

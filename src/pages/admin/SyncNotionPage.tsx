import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Building2, Clock, AlertCircle, CheckCircle, Loader2, Wrench, Users, Zap, Wifi, ChevronLeft, ChevronRight, CalendarDays, List } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { BuildingColumnVisibility } from '@/components/admin/buildings/BuildingColumnVisibility';

interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  status: string;
  notion_status: string | null;
  notion_page_id: string | null;
  notion_last_synced_at: string | null;
  notion_oti: string | null;
  notion_internal_id: number | null;
  numero_unidades: number | null;
  publico_estimado: number | null;
  notion_fotos: any;
  imagem_principal: string | null;
  notion_data_trabalho: string | null;
}

// Status groupings matching Notion board - DARK THEME
const STATUS_GROUPS = {
  online: {
    title: 'PRÉDIOS ONLINE',
    icon: CheckCircle,
    statuses: ['Ativo'],
    bgColor: 'bg-[#2D3B2D]', // Verde escuro Notion
    borderColor: 'border-emerald-800/30',
    iconColor: 'text-emerald-400',
    headerColor: 'text-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  offline: {
    title: 'PRÉDIOS OFF-LINE',
    icon: AlertCircle,
    statuses: ['Subir Nuc', 'Troca painel', 'Manutenção'],
    bgColor: 'bg-[#4D2D2D]', // Vermelho escuro Notion
    borderColor: 'border-red-800/30',
    iconColor: 'text-red-400',
    headerColor: 'text-red-400',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30'
  },
  instalacao: {
    title: 'EM INSTALAÇÃO',
    icon: Wrench,
    statuses: ['Instalação Internet', 'Instalação'],
    bgColor: 'bg-[#3D2D1D]', // Marrom/bronze Notion
    borderColor: 'border-amber-800/30',
    iconColor: 'text-amber-400',
    headerColor: 'text-amber-400',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  instalacaoInternet: {
    title: 'INSTALAÇÃO DE INTERNET',
    icon: Wifi,
    statuses: ['Primeira Reunião', 'Visita Técnica'],
    bgColor: 'bg-[#3D3D3D]', // Cinza escuro
    borderColor: 'border-gray-700/30',
    iconColor: 'text-gray-300',
    headerColor: 'text-gray-300',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }
};

// Statuses that need maintenance work
const MAINTENANCE_STATUSES = ['Instalação Internet', 'Instalação', 'Subir Nuc', 'Troca painel', 'Manutenção'];

// Building Card Component
const BuildingCard = ({ building, badgeColor }: { building: Building; badgeColor: string }) => {
  const getImageUrl = () => {
    if (building.notion_fotos) {
      try {
        const fotos = typeof building.notion_fotos === 'string' 
          ? JSON.parse(building.notion_fotos) 
          : building.notion_fotos;
        if (Array.isArray(fotos) && fotos.length > 0) {
          return fotos[0]?.url || fotos[0];
        }
      } catch (e) {
        console.error('Error parsing notion_fotos:', e);
      }
    }
    return building.imagem_principal || null;
  };

  const imageUrl = getImageUrl();

  return (
    <div className="flex-shrink-0 w-[180px] md:w-[200px] bg-[#2D2D2D] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-700/50 group cursor-pointer">
      <div className="h-[120px] md:h-[140px] bg-gray-800 relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={building.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
            <Building2 className="h-10 w-10 text-gray-600" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className={`${badgeColor} text-[10px] px-1.5 py-0.5 shadow-sm`}>
            {building.notion_status || 'N/A'}
          </Badge>
        </div>
        {building.notion_oti && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] px-1.5 py-0.5 shadow-sm">
              {building.notion_oti}
            </Badge>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-sm text-white truncate">{building.nome}</h3>
        <p className="text-xs text-gray-400 truncate mt-0.5">{building.bairro}</p>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
          {building.numero_unidades && (
            <span className="flex items-center gap-0.5">
              <Building2 className="h-3 w-3" />
              {building.numero_unidades}
            </span>
          )}
          {building.publico_estimado && (
            <span className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {building.publico_estimado.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Status Section Component
const StatusSection = ({ 
  group, 
  buildings 
}: { 
  group: typeof STATUS_GROUPS[keyof typeof STATUS_GROUPS];
  buildings: Building[];
}) => {
  const Icon = group.icon;
  
  if (buildings.length === 0) return null;

  return (
    <div className={`rounded-2xl ${group.bgColor} ${group.borderColor} border p-4 md:p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${group.iconColor}`} />
          <h2 className={`font-semibold ${group.headerColor} text-sm md:text-base`}>{group.title}</h2>
          <Badge className="bg-gray-600/50 text-white text-xs border-gray-500/30">{buildings.length}</Badge>
        </div>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {buildings.map((building) => (
          <BuildingCard 
            key={building.id} 
            building={building} 
            badgeColor={group.badgeColor}
          />
        ))}
      </div>
    </div>
  );
};

// Calendar Section Component
const CalendarSection = ({ buildings }: { buildings: Building[] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group buildings by work date
  const buildingsByDate = useMemo(() => {
    const map = new Map<string, Building[]>();
    buildings.forEach(b => {
      if (b.notion_data_trabalho) {
        const dateKey = b.notion_data_trabalho.split('T')[0]; // Get just the date part
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(b);
      }
    });
    return map;
  }, [buildings]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get weekday names
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Get leading empty cells for the first week
  const leadingEmptyCells = monthStart.getDay();

  return (
    <div className="bg-[#2D2D2D] rounded-2xl p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-white" />
          <h2 className="font-semibold text-white text-sm">AGENDAMENTO</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-white text-sm font-medium min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] text-gray-500 font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {Array.from({ length: leadingEmptyCells }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Days */}
        {daysInMonth.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayBuildings = buildingsByDate.get(dateKey) || [];
          const hasEvents = dayBuildings.length > 0;
          const isTodayDate = isToday(day);

          return (
            <div 
              key={dateKey}
              className={`
                aspect-square rounded-lg p-1 flex flex-col items-center justify-start cursor-pointer
                transition-all duration-200
                ${hasEvents ? 'bg-blue-600/20 hover:bg-blue-600/30' : 'hover:bg-white/5'}
                ${isTodayDate ? 'ring-1 ring-blue-400' : ''}
              `}
              title={dayBuildings.map(b => b.nome).join('\n')}
            >
              <span className={`text-[11px] ${isTodayDate ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </span>
              {hasEvents && (
                <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
                  {dayBuildings.slice(0, 3).map((b, idx) => (
                    <div 
                      key={b.id}
                      className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      title={b.nome}
                    />
                  ))}
                  {dayBuildings.length > 3 && (
                    <span className="text-[8px] text-blue-400">+{dayBuildings.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-gray-600/30">
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Trabalho agendado</span>
        </div>
      </div>
    </div>
  );
};

// Maintenance List Component - Buildings WITHOUT work date scheduled (URGENT)
const MaintenanceList = ({ buildings }: { buildings: Building[] }) => {
  // Filter buildings that need work BUT don't have a scheduled date
  const pendingWork = useMemo(() => {
    return buildings.filter(b => 
      MAINTENANCE_STATUSES.includes(b.notion_status || '') &&
      !b.notion_data_trabalho // Work date is EMPTY
    );
  }, [buildings]);

  return (
    <div className="bg-[#2D2D2D] rounded-2xl p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-white" />
          <h2 className="font-semibold text-white text-sm">MANUTENÇÃO</h2>
        </div>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
          {pendingWork.length} pendentes
        </Badge>
      </div>

      {/* Subtitle */}
      <p className="text-[10px] text-gray-400 mb-3">
        Prédios aguardando agendamento de trabalho
      </p>

      {/* List */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {pendingWork.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Todos os trabalhos agendados</p>
          </div>
        ) : (
          pendingWork.map(building => (
            <div 
              key={building.id} 
              className="flex items-center justify-between p-2.5 bg-[#3D3D3D] rounded-lg hover:bg-[#454545] transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-medium truncate block">{building.nome}</span>
                <span className="text-gray-400 text-[10px] truncate block">{building.bairro}</span>
              </div>
              <Badge 
                className={`text-[9px] ml-2 flex-shrink-0 ${
                  building.notion_status === 'Subir Nuc' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  building.notion_status === 'Manutenção' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                  building.notion_status === 'Troca painel' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  building.notion_status === 'Instalação' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  'bg-purple-500/20 text-purple-400 border-purple-500/30'
                }`}
              >
                {building.notion_status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SyncNotionPage = () => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  // Fetch buildings with notion data including photos and work date
  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['notion-buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, endereco, bairro, status, notion_status, notion_page_id, notion_last_synced_at, notion_oti, notion_internal_id, numero_unidades, publico_estimado, notion_fotos, imagem_principal, notion_data_trabalho')
        .not('notion_page_id', 'is', null)
        .order('nome');
      
      if (error) throw error;
      return (data || []) as Building[];
    }
  });

  // Fetch sync logs
  const { data: syncLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ['notion-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notion_sync_logs')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Force sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      const { data, error } = await supabase.functions.invoke('sync-notion-buildings');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sincronização concluída! ${data?.created || 0} criados, ${data?.updated || 0} atualizados`);
      queryClient.invalidateQueries({ queryKey: ['notion-buildings'] });
      queryClient.invalidateQueries({ queryKey: ['notion-sync-logs'] });
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });

  // Group buildings by status
  const groupedBuildings = useMemo(() => ({
    online: buildings?.filter(b => STATUS_GROUPS.online.statuses.includes(b.notion_status || '')) || [],
    offline: buildings?.filter(b => STATUS_GROUPS.offline.statuses.includes(b.notion_status || '')) || [],
    instalacao: buildings?.filter(b => STATUS_GROUPS.instalacao.statuses.includes(b.notion_status || '')) || [],
    instalacaoInternet: buildings?.filter(b => STATUS_GROUPS.instalacaoInternet.statuses.includes(b.notion_status || '')) || []
  }), [buildings]);

  const lastSync = syncLogs?.[0];
  const totalBuildings = buildings?.length || 0;

  return (
    <div className="p-4 md:p-6 space-y-5 bg-[#1E1E1E] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10">
              <RefreshCw className="h-5 w-5 text-white" />
            </div>
            Sync Notion
          </h1>
          <p className="text-xs text-gray-400 mt-1 ml-11">
            Sincronização bidirecional • {totalBuildings} prédios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BuildingColumnVisibility />
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={isSyncing}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 shadow-md text-white"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Forçar Sincronização
          </Button>
        </div>
      </div>

      {/* Quick Stats - 4 metrics */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <div className="bg-[#2D3B2D] rounded-xl p-3 shadow-sm border border-emerald-800/30 text-center">
          <div className="text-xl md:text-2xl font-bold text-emerald-400">{groupedBuildings.online.length}</div>
          <div className="text-[10px] text-emerald-300/70">Online</div>
        </div>
        <div className="bg-[#4D2D2D] rounded-xl p-3 shadow-sm border border-red-800/30 text-center">
          <div className="text-xl md:text-2xl font-bold text-red-400">{groupedBuildings.offline.length}</div>
          <div className="text-[10px] text-red-300/70">Offline</div>
        </div>
        <div className="bg-[#3D2D1D] rounded-xl p-3 shadow-sm border border-amber-800/30 text-center">
          <div className="text-xl md:text-2xl font-bold text-amber-400">{groupedBuildings.instalacao.length}</div>
          <div className="text-[10px] text-amber-300/70">Instalação</div>
        </div>
        <div className="bg-[#3D3D3D] rounded-xl p-3 shadow-sm border border-gray-700/30 text-center">
          <div className="text-xl md:text-2xl font-bold text-gray-300">{groupedBuildings.instalacaoInternet.length}</div>
          <div className="text-[10px] text-gray-400">Aguardando</div>
        </div>
      </div>

      {/* Loading State */}
      {loadingBuildings ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Status Sections - 4 Gallery Sections */}
          <div className="space-y-4">
            <StatusSection group={STATUS_GROUPS.online} buildings={groupedBuildings.online} />
            <StatusSection group={STATUS_GROUPS.offline} buildings={groupedBuildings.offline} />
            <StatusSection group={STATUS_GROUPS.instalacao} buildings={groupedBuildings.instalacao} />
            <StatusSection group={STATUS_GROUPS.instalacaoInternet} buildings={groupedBuildings.instalacaoInternet} />
          </div>

          {/* Calendar + Maintenance List - Unified Container */}
          <div className="bg-[#252525] rounded-2xl p-4 mt-6">
            {/* Header with tabs */}
            <div className="flex items-center gap-6 mb-4 border-b border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-white" />
                <h2 className="text-white font-semibold text-sm">AGENDAMENTO</h2>
              </div>
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-gray-400" />
                <h2 className="text-gray-400 font-semibold text-sm">MANUTENÇÃO</h2>
              </div>
            </div>
            
            {/* Two columns side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <CalendarSection buildings={buildings || []} />
              </div>
              <div>
                <MaintenanceList buildings={buildings || []} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sync Logs - Collapsible */}
      <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full bg-[#2D2D2D] rounded-xl p-3 shadow-sm border border-gray-700/50 flex items-center justify-between hover:bg-[#3D3D3D] transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Histórico de Sincronizações</span>
              {lastSync && (
                <span className="text-xs text-gray-500">
                  Última: {format(new Date(lastSync.sync_started_at), "dd/MM HH:mm", { locale: ptBR })}
                </span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${logsOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="bg-[#2D2D2D] rounded-xl shadow-sm border border-gray-700/50 divide-y divide-gray-700/50">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              syncLogs?.map((log) => (
                <div key={log.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : log.status === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                    )}
                    <span className="text-sm text-gray-300">
                      {format(new Date(log.sync_started_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {log.buildings_created > 0 && (
                      <span className="text-emerald-400 font-medium">+{log.buildings_created}</span>
                    )}
                    {log.buildings_updated > 0 && (
                      <span className="text-blue-400 font-medium">↻{log.buildings_updated}</span>
                    )}
                    {log.duration_ms && (
                      <span className="text-gray-500">{(log.duration_ms / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              ))
            )}
            {syncLogs?.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma sincronização realizada</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default SyncNotionPage;

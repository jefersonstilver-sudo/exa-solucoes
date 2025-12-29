import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Building2, Clock, AlertCircle, CheckCircle, Loader2, Wrench, Users, Zap, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { BuildingColumnVisibility } from '@/components/admin/buildings/BuildingColumnVisibility';
import { NotionStyleCalendar } from '@/components/admin/notion-sync/NotionStyleCalendar';

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
  notion_horario_trabalho: string | null;
}

interface Device {
  id: string;
  name: string | null;
  status: 'online' | 'offline' | null;
  building_id: string | null;
}

// Função para normalizar nomes para comparação
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(edificio|edifício|residencial|condomínio|condominio|cond\.?)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Função para encontrar device que corresponde ao building
function findDeviceForBuilding(building: Building, devices: Device[]): Device | null {
  const buildingNorm = normalizeName(building.nome);
  
  // 1. Primeiro tenta por building_id
  const byId = devices.find(d => d.building_id === building.id);
  if (byId) return byId;
  
  // 2. Depois tenta por match de nome
  for (const device of devices) {
    if (!device.name) continue;
    const deviceNorm = normalizeName(device.name);
    
    // Match exato
    if (deviceNorm === buildingNorm) return device;
    
    // Match parcial (um contém o outro)
    if (deviceNorm.includes(buildingNorm) || buildingNorm.includes(deviceNorm)) return device;
    
    // Match sem números finais
    const deviceBase = deviceNorm.replace(/\s*\d+$/, '');
    const buildingBase = buildingNorm.replace(/\s*\d+$/, '');
    if (deviceBase === buildingBase || deviceBase.includes(buildingBase) || buildingBase.includes(deviceBase)) {
      return device;
    }
  }
  
  return null;
}

// Status groupings matching Notion board - LIGHT THEME
const STATUS_GROUPS = {
  online: {
    title: 'PRÉDIOS ONLINE',
    icon: CheckCircle,
    statuses: ['Ativo'],
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    headerColor: 'text-emerald-700',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  },
  offline: {
    title: 'PRÉDIOS OFF-LINE',
    icon: AlertCircle,
    statuses: ['Subir Nuc', 'Troca painel', 'Manutenção'],
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    headerColor: 'text-red-700',
    badgeColor: 'bg-red-100 text-red-700 border-red-200'
  },
  instalacao: {
    title: 'EM INSTALAÇÃO',
    icon: Wrench,
    statuses: ['Instalação Internet', 'Instalação'],
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    headerColor: 'text-amber-700',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  instalacaoInternet: {
    title: 'INSTALAÇÃO DE INTERNET',
    icon: Wifi,
    statuses: ['Primeira Reunião', 'Visita Técnica'],
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    iconColor: 'text-gray-600',
    headerColor: 'text-gray-700',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200'
  }
};


// Building Card Component - LIGHT THEME
const BuildingCard = ({ building, badgeColor }: { building: Building; badgeColor: string }) => {
  const getImageUrl = () => {
    // Priority 1: notion_fotos
    if (building.notion_fotos) {
      try {
        const fotos = typeof building.notion_fotos === 'string' 
          ? JSON.parse(building.notion_fotos) 
          : building.notion_fotos;
        if (Array.isArray(fotos) && fotos.length > 0) {
          const firstPhoto = fotos[0]?.url || fotos[0]?.file?.url || fotos[0];
          if (typeof firstPhoto === 'string' && firstPhoto.length > 0) return firstPhoto;
        }
      } catch (e) {
        console.error('Error parsing notion_fotos:', e);
      }
    }
    // Priority 2: imagem_principal (may be a path or full URL)
    if (building.imagem_principal) {
      if (building.imagem_principal.startsWith('http')) {
        return building.imagem_principal;
      }
      // Construct Supabase storage URL
      return `https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/buildings/${building.imagem_principal}`;
    }
    return null;
  };

  const imageUrl = getImageUrl();

  return (
    <div className="flex-shrink-0 w-[180px] md:w-[200px] bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 group cursor-pointer">
      <div className="h-[120px] md:h-[140px] bg-gray-100 relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={building.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Building2 className="h-10 w-10 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className={`${badgeColor} text-[10px] px-1.5 py-0.5 shadow-sm`}>
            {building.notion_status || 'N/A'}
          </Badge>
        </div>
        {building.notion_oti && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0.5 shadow-sm">
              {building.notion_oti}
            </Badge>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 truncate">{building.nome}</h3>
        <p className="text-xs text-gray-500 truncate mt-0.5">{building.bairro}</p>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
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

// Status Section Component - LIGHT THEME
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
          <Badge className="bg-gray-200 text-gray-700 text-xs border-gray-300">{buildings.length}</Badge>
        </div>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
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


const SyncNotionPage = () => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  // Fetch buildings with notion data including photos, work date AND work time
  const { data: buildings, isLoading: loadingBuildings } = useQuery({
    queryKey: ['notion-buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, endereco, bairro, status, notion_status, notion_page_id, notion_last_synced_at, notion_oti, notion_internal_id, numero_unidades, publico_estimado, notion_fotos, imagem_principal, notion_data_trabalho, notion_horario_trabalho')
        .order('nome');
      
      if (error) throw error;
      return (data || []) as Building[];
    }
  });

  // Fetch devices for real AnyDesk status
  const { data: devices } = useQuery({
    queryKey: ['sync-page-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devices')
        .select('id, name, status, building_id')
        .eq('is_active', true);
      
      if (error) throw error;
      return (data || []) as Device[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
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

  // Force sync mutation - with force=true to bypass last_edited_time check
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      const { data, error } = await supabase.functions.invoke('sync-notion-buildings', {
        body: { force: true } // Force update all buildings
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Sincronização forçada concluída! ${data?.stats?.created || 0} criados, ${data?.stats?.updated || 0} atualizados`);
      queryClient.invalidateQueries({ queryKey: ['notion-buildings'] });
      queryClient.invalidateQueries({ queryKey: ['notion-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sync-page-devices'] });
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });

  // Sync device-building status mutation
  const syncDeviceStatusMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-device-building-status');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const stats = data?.stats || {};
      toast.success(`Sincronização AnyDesk concluída! ${stats.devicesAssociated || 0} devices associados, ${stats.buildingsUpdatedToOnline || 0} prédios atualizados para Online`);
      queryClient.invalidateQueries({ queryKey: ['notion-buildings'] });
      queryClient.invalidateQueries({ queryKey: ['sync-page-devices'] });
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização AnyDesk: ${error.message}`);
    }
  });

  // Group buildings by status WITH REAL ANYDESK STATUS
  const normalizeStatusForGroup = (status: string | null): string => {
    if (!status) return '';
    return status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  };
  
  const groupedBuildings = useMemo(() => {
    const normalizeAndMatch = (statuses: string[], buildingStatus: string | null) => {
      if (!buildingStatus) return false;
      const normalized = normalizeStatusForGroup(buildingStatus);
      return statuses.some(s => normalizeStatusForGroup(s) === normalized);
    };

    // Helper: Check if building has online device
    const hasBuildingOnlineDevice = (building: Building): boolean => {
      if (!devices?.length) return false;
      const device = findDeviceForBuilding(building, devices);
      return device?.status === 'online';
    };

    // Helper: Check if building has offline device
    const hasBuildingOfflineDevice = (building: Building): boolean => {
      if (!devices?.length) return false;
      const device = findDeviceForBuilding(building, devices);
      return device?.status === 'offline';
    };

    // Helper: Check if building has any device
    const hasBuildingDevice = (building: Building): boolean => {
      if (!devices?.length) return false;
      const device = findDeviceForBuilding(building, devices);
      return !!device;
    };

    // ONLINE: Prédios com status Ativo OU com device online (AnyDesk = prioridade máxima)
    const onlineBuildings = buildings?.filter(b => 
      normalizeAndMatch(STATUS_GROUPS.online.statuses, b.notion_status) || 
      hasBuildingOnlineDevice(b)
    ) || [];

    // OFFLINE: Prédios com device cadastrado que está OFFLINE (exclui os que já estão em onlineBuildings)
    const onlineBuildingIds = new Set(onlineBuildings.map(b => b.id));
    const offlineBuildings = buildings?.filter(b => 
      !onlineBuildingIds.has(b.id) && hasBuildingOfflineDevice(b)
    ) || [];

    // EM INSTALAÇÃO: Prédios em instalação SEM device online ainda
    const instalacaoBuildings = buildings?.filter(b => 
      !onlineBuildingIds.has(b.id) && 
      normalizeAndMatch(STATUS_GROUPS.instalacao.statuses, b.notion_status) &&
      !hasBuildingOnlineDevice(b)
    ) || [];

    // AGUARDANDO: Prédios em estágio inicial (sem device ainda)
    const aguardandoBuildings = buildings?.filter(b => 
      !onlineBuildingIds.has(b.id) &&
      normalizeAndMatch(STATUS_GROUPS.instalacaoInternet.statuses, b.notion_status) &&
      !hasBuildingDevice(b)
    ) || [];
    
    return {
      online: onlineBuildings,
      offline: offlineBuildings,
      instalacao: instalacaoBuildings,
      instalacaoInternet: aguardandoBuildings
    };
  }, [buildings, devices]);

  // Diagnostic panel data - shows why buildings might not appear in calendar
  const diagnosticData = useMemo(() => {
    if (!buildings) return null;
    
    const currentMonth = new Date();
    const currentMonthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    
    const withWorkDate = buildings.filter(b => b.notion_data_trabalho);
    const withWorkDateThisMonth = withWorkDate.filter(b => b.notion_data_trabalho?.startsWith(currentMonthStr));
    const withWorkDateNoTime = withWorkDate.filter(b => !b.notion_horario_trabalho);
    const notionBuildings = buildings.filter(b => b.notion_page_id);
    const missingNotionStatus = notionBuildings.filter(b => !b.notion_status);
    
    return {
      total: buildings.length,
      fromNotion: notionBuildings.length,
      withWorkDate: withWorkDate.length,
      withWorkDateThisMonth: withWorkDateThisMonth.length,
      missingTime: withWorkDateNoTime.length,
      missingStatus: missingNotionStatus.length,
      buildingsWithWorkDateNoTime: withWorkDateNoTime.slice(0, 5) // Show first 5
    };
  }, [buildings]);

  const lastSync = syncLogs?.[0];
  const totalBuildings = buildings?.length || 0;

  // Calculate time since last sync
  const getTimeSinceLastSync = () => {
    if (!lastSync?.sync_started_at) return null;
    const lastSyncDate = new Date(lastSync.sync_started_at);
    const now = new Date();
    const diffMs = now.getTime() - lastSyncDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${Math.floor(diffHours / 24)} dias`;
  };

  // Calculate next auto sync (every 10 min for Notion, every 5 min for AnyDesk)
  const getNextSyncTime = () => {
    const now = new Date();
    const mins = now.getMinutes();
    const nextNotionSync = 10 - (mins % 10);
    return `${nextNotionSync} min`;
  };

  return (
    <div className="p-4 md:p-6 space-y-5 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gray-100">
              <RefreshCw className="h-5 w-5 text-gray-700" />
            </div>
            Agenda Técnica
          </h1>
          <div className="flex items-center gap-3 mt-1 ml-11">
            <p className="text-xs text-gray-500">
              {totalBuildings} prédios
            </p>
            {/* Auto-sync indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-600 font-medium">Auto-sync ativo</span>
            </div>
            {getTimeSinceLastSync() && (
              <span className="text-[10px] text-gray-400">
                Última: {getTimeSinceLastSync()} • Próxima: {getNextSyncTime()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BuildingColumnVisibility />
          <Button
            onClick={() => syncDeviceStatusMutation.mutate()}
            disabled={syncDeviceStatusMutation.isPending}
            size="sm"
            variant="outline"
            className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          >
            {syncDeviceStatusMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4 mr-2" />
            )}
            Sync AnyDesk
          </Button>
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

      {/* Quick Stats - 4 metrics - LIGHT THEME */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <div className="bg-emerald-50 rounded-xl p-3 shadow-sm border border-emerald-200 text-center">
          <div className="text-xl md:text-2xl font-bold text-emerald-600">{groupedBuildings.online.length}</div>
          <div className="text-[10px] text-emerald-500">Online</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 shadow-sm border border-red-200 text-center">
          <div className="text-xl md:text-2xl font-bold text-red-600">{groupedBuildings.offline.length}</div>
          <div className="text-[10px] text-red-500">Offline</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 shadow-sm border border-amber-200 text-center">
          <div className="text-xl md:text-2xl font-bold text-amber-600">{groupedBuildings.instalacao.length}</div>
          <div className="text-[10px] text-amber-500">Instalação</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 shadow-sm border border-gray-200 text-center">
          <div className="text-xl md:text-2xl font-bold text-gray-600">{groupedBuildings.instalacaoInternet.length}</div>
          <div className="text-[10px] text-gray-500">Aguardando</div>
        </div>
      </div>

      {/* Loading State */}
      {loadingBuildings ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
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

          {/* Notion Style Calendar */}
          <div className="mt-6">
            <NotionStyleCalendar buildings={buildings || []} />
          </div>

          {/* Diagnostic Panel - LIGHT THEME */}
          {diagnosticData && (
            <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <h3 className="text-gray-900 font-semibold text-sm">Diagnóstico de Sincronização</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <div className="text-lg font-bold text-gray-900">{diagnosticData.fromNotion}</div>
                  <div className="text-[10px] text-gray-500">Do Notion</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                  <div className="text-lg font-bold text-blue-600">{diagnosticData.withWorkDate}</div>
                  <div className="text-[10px] text-gray-500">Com Data Trabalho</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                  <div className="text-lg font-bold text-emerald-600">{diagnosticData.withWorkDateThisMonth}</div>
                  <div className="text-[10px] text-gray-500">Este Mês</div>
                </div>
                <div className={`${diagnosticData.missingTime > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'} rounded-lg p-3 text-center border`}>
                  <div className={`text-lg font-bold ${diagnosticData.missingTime > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {diagnosticData.missingTime}
                  </div>
                  <div className="text-[10px] text-gray-500">Sem Horário</div>
                </div>
              </div>

              {/* Show buildings missing time */}
              {diagnosticData.buildingsWithWorkDateNoTime.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-xs text-amber-700 font-medium mb-2">
                    ⚠️ Prédios com data mas SEM horário definido no Notion:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {diagnosticData.buildingsWithWorkDateNoTime.map(b => (
                      <Badge key={b.id} className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                        {b.nome} ({b.notion_data_trabalho})
                      </Badge>
                    ))}
                    {diagnosticData.missingTime > 5 && (
                      <span className="text-[10px] text-gray-500">+{diagnosticData.missingTime - 5} mais...</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Sync Logs - Collapsible - LIGHT THEME */}
      <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Histórico de Sincronizações</span>
              {lastSync && (
                <span className="text-xs text-gray-400">
                  Última: {format(new Date(lastSync.sync_started_at), "dd/MM HH:mm", { locale: ptBR })}
                </span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${logsOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              syncLogs?.map((log) => (
                <div key={log.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : log.status === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    )}
                    <span className="text-sm text-gray-700">
                      {format(new Date(log.sync_started_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {log.buildings_created > 0 && (
                      <span className="text-emerald-600 font-medium">+{log.buildings_created}</span>
                    )}
                    {log.buildings_updated > 0 && (
                      <span className="text-blue-600 font-medium">↻{log.buildings_updated}</span>
                    )}
                    {log.duration_ms && (
                      <span className="text-gray-400">{(log.duration_ms / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              ))
            )}
            {syncLogs?.length === 0 && (
              <div className="p-6 text-center text-gray-400">
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

import { Device } from '../utils/devices';
import { humanizeDate } from '../utils/formatters';
import { useRealTimeCounter } from '../hooks/useRealTimeCounter';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Wifi, MapPin, Activity, Building2, Check, Unlink, AlertTriangle, ClipboardCheck, User, BellOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IncidentStatus } from '../hooks/useDeviceIncidentStatus';
import { DeviceIncident } from '../hooks/useDeviceIncidents';

interface PanelCardProps {
  device: Device & {
    building_id?: string | null;
    empresa_elevador_id?: string | null;
    device_group_id?: string | null;
  };
  onClick: () => void;
  periodEventsCount?: number;
  periodLabel?: string;
  incidentStatus?: IncidentStatus;
  incidentData?: DeviceIncident | null;
  groupSilenced?: boolean;
  groupName?: string;
}

export const PanelCard = ({
  device,
  onClick,
  periodEventsCount,
  periodLabel = 'hoje',
  incidentStatus,
  incidentData,
  groupSilenced = false,
  groupName,
}: PanelCardProps) => {
  const hasCriticalAlert = (device as any).has_critical_alert === true;
  const offlineCounter = useRealTimeCounter(device.status === 'offline' ? device.last_online_at : null);
  const [assignedBuildingName, setAssignedBuildingName] = useState<string | null>(null);
  const [assignedBuildingStatus, setAssignedBuildingStatus] = useState<string | null>(null);
  const [elevatorCompanyName, setElevatorCompanyName] = useState<string | null>(null);

  // Carregar nome do prédio atribuído e empresa de elevador
  useEffect(() => {
    const loadAssignedBuilding = async () => {
      if (!device.building_id) {
        setAssignedBuildingName(null);
        return;
      }

      const { data, error } = await supabase
        .from('buildings')
        .select('nome, status')
        .eq('id', device.building_id)
        .single();

      if (!error && data) {
        setAssignedBuildingName(data.nome);
        setAssignedBuildingStatus((data as any).status ?? null);
      }
    };

    const loadElevatorCompany = async () => {
      if (!device.empresa_elevador_id) {
        setElevatorCompanyName(null);
        return;
      }

      const { data, error } = await supabase
        .from('fornecedores')
        .select('nome_fantasia')
        .eq('id', device.empresa_elevador_id)
        .single();

      if (!error && data) {
        setElevatorCompanyName(data.nome_fantasia);
      }
    };

    loadAssignedBuilding();
    loadElevatorCompany();
  }, [device.building_id, device.empresa_elevador_id]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      default:
        return 'Desconhecido';
    }
  };

  // Calcular tempo offline em horas para determinar cor do card
  const getOfflineHours = () => {
    if (device.status !== 'offline' || !device.last_online_at) return 0;
    const now = new Date();
    const lastOnline = new Date(device.last_online_at);
    const diffMs = now.getTime() - lastOnline.getTime();
    return diffMs / (1000 * 60 * 60); // converter para horas
  };
  const offlineHours = getOfflineHours();

  // Determinar cor de fundo do card baseado no status
  const getCardBgClass = () => {
    if (hasCriticalAlert) return '';
    if (device.status === 'online') {
      return 'border-green-600';
    }
    if (device.status === 'offline') {
      return 'border-red-600 animate-pulse';
    }
    return '';
  };
  const lastOnline = humanizeDate(device.last_online_at);

  // Usar provedor parseado automaticamente
  const provider = device.provider || 'Sem provedor';

  // Nome principal: comments (local) > name
  const rawName = device.comments || device.name;

  // Extrair apenas o nome do prédio (primeira parte antes do " - ")
  // Fallback para AnyDesk ID se nome estiver vazio
  const displayName = rawName.split(' - ')[0].trim() || device.anydesk_client_id;

  // Cores por provedor
  const getProviderColor = (providerName: string) => {
    const upperProvider = providerName.toUpperCase();
    if (upperProvider.includes('VIVO')) return 'text-purple-400';
    if (upperProvider.includes('LIGGA')) return 'text-orange-400';
    if (upperProvider.includes('TELECOM FOZ')) return 'text-blue-400';
    return 'text-white/90';
  };

  // Use period events count if provided, otherwise fallback to offline_count
  const displayEventsCount = periodEventsCount !== undefined ? periodEventsCount : (device.offline_count || 0);
  const eventsLabel = periodEventsCount !== undefined ? `${displayEventsCount} quedas ${periodLabel}` : `${displayEventsCount} quedas`;

  // Render incident badge with hover card
  const renderIncidentBadge = () => {
    if (device.status !== 'offline') return null;
    
    if (incidentStatus === 'pendente') {
      return (
        <Badge className="text-[10px] sm:text-xs lg:text-xs gap-1 bg-red-100 text-red-700 border-red-400 px-1.5 sm:px-2 py-0.5 animate-pulse">
          <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          Sem causa
        </Badge>
      );
    }
    
    if (incidentStatus === 'causa_registrada' && incidentData) {
      return (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Badge className="text-[10px] sm:text-xs lg:text-xs gap-1 bg-amber-100 text-amber-700 border-amber-400 px-1.5 sm:px-2 py-0.5 cursor-pointer hover:bg-amber-200 transition-colors">
              <ClipboardCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Causa definida
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="w-72 p-0 border-amber-300 shadow-lg" side="top" sideOffset={8}>
            <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 rounded-t-md">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                📋 Detalhes do Incidente
              </p>
            </div>
            <div className="p-3 space-y-2">
              {incidentData.category && (
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-xs px-2 py-0.5"
                    style={{
                      backgroundColor: `${incidentData.category.color}20`,
                      color: incidentData.category.color,
                      borderColor: `${incidentData.category.color}40`,
                    }}
                  >
                    {incidentData.category.icon} {incidentData.category.label}
                  </Badge>
                </div>
              )}
              {incidentData.causa && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-700 mb-0.5">Causa:</p>
                  <p className="text-xs text-gray-700 line-clamp-3">{incidentData.causa}</p>
                </div>
              )}
              {incidentData.resolucao && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-700 mb-0.5">Resolução:</p>
                  <p className="text-xs text-gray-700 line-clamp-2">{incidentData.resolucao}</p>
                </div>
              )}
              {incidentData.registrado_por_nome && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 pt-1 border-t border-amber-100">
                  <User className="h-2.5 w-2.5" />
                  <span>por <strong>{incidentData.registrado_por_nome}</strong></span>
                </div>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }
    
    if (incidentStatus === 'causa_registrada') {
      return (
        <Badge className="text-[10px] sm:text-xs lg:text-xs gap-1 bg-amber-100 text-amber-700 border-amber-400 px-1.5 sm:px-2 py-0.5">
          <ClipboardCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          Causa definida
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <div 
      onClick={onClick} 
      className={`glass-card rounded-[14px] shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-2 overflow-hidden group hover:scale-[1.03] flex flex-col ${hasCriticalAlert ? 'border-red-600 animate-pulse shadow-lg shadow-red-200 glow-danger' : getCardBgClass()}`}
      style={{
        backgroundColor: hasCriticalAlert 
          ? undefined 
          : device.status === 'online' 
            ? '#d1f4e0' 
            : device.status === 'offline' 
              ? '#fde8e8' 
              : undefined
      }}
    >
      {/* Corpo do card */}
      <div className="p-2 sm:p-4 lg:p-6 text-center flex-1 flex flex-col">
        {/* Nome principal grande */}
        <div className="mb-1 sm:mb-2 lg:mb-3 min-h-[20px] sm:min-h-[28px] lg:min-h-[36px]">
          <div className="text-sm sm:text-lg lg:text-3xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors leading-tight line-clamp-1">
            {displayName}
          </div>
        </div>

        {/* Provedor - colorido */}
        <div className="mb-2 sm:mb-3 lg:mb-4 min-h-[16px] sm:min-h-[20px] lg:min-h-[28px]">
          <div className={`text-xs sm:text-sm lg:text-lg font-semibold tracking-wide ${getProviderColor(provider)}`}>
            {provider}
          </div>
        </div>

        {/* Nome do prédio (condomínio) - altura fixa */}
        <div className="mb-2 sm:mb-3 lg:mb-4 min-h-[16px] sm:min-h-[18px] lg:min-h-[20px]">
          {device.condominio_name && device.metadata?.torre && (
            <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600">
              Torre {device.metadata.torre}
              {device.metadata?.elevador && ` - Elevador ${device.metadata.elevador}`}
            </div>
          )}
        </div>

        {/* Badge: Eventos + Atribuição + Empresa Elevador */}
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center mb-2 sm:mb-3 lg:mb-4 min-h-[32px] lg:min-h-[40px] items-start">
          <Badge variant="secondary" className="text-[10px] sm:text-xs lg:text-xs gap-1 bg-gray-200 text-gray-900 border-gray-300 px-1.5 sm:px-2 py-0.5">
            <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {eventsLabel}
          </Badge>
          
          {/* Badge de Atribuição a Prédio da Loja */}
          {device.building_id && assignedBuildingName ? (
            <Badge className="text-[10px] sm:text-xs lg:text-xs gap-1 bg-emerald-100 text-emerald-700 border-emerald-300 px-1.5 sm:px-2 py-0.5">
              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{assignedBuildingName}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] sm:text-xs lg:text-xs gap-1 bg-gray-50 text-gray-500 border-gray-300 px-1.5 sm:px-2 py-0.5">
              <Unlink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Não atribuído
            </Badge>
          )}

          {/* Badge de Empresa de Elevador */}
          {device.empresa_elevador_id && elevatorCompanyName ? (
            <Badge className="text-[10px] sm:text-xs lg:text-xs gap-1 bg-blue-100 text-blue-700 border-blue-300 px-1.5 sm:px-2 py-0.5">
              🛗 <span className="truncate max-w-[60px] sm:max-w-[100px]">{elevatorCompanyName}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] sm:text-xs lg:text-xs gap-1 bg-gray-50 text-gray-400 border-gray-200 px-1.5 sm:px-2 py-0.5">
              🛗 Sem empresa
            </Badge>
          )}

          {/* Badge de Incidente Offline com HoverCard */}
          {renderIncidentBadge()}
        </div>

        {/* AnyDesk ID - Secundário e discreto - empurrado para baixo */}
        <div className="mt-auto mb-1 sm:mb-2 text-[10px] sm:text-xs lg:text-xs text-gray-600 font-mono">
          ID: {device.anydesk_client_id}
        </div>
      </div>

      {/* Rodapé com status */}
      <div className="bg-gray-100/80 backdrop-blur-sm px-2 sm:px-4 lg:px-6 py-2 lg:py-3 flex items-center justify-between border-t border-gray-300">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getStatusColor(device.status)}`} />
          <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-900 whitespace-nowrap">
            {getStatusLabel(device.status)}
          </span>
        </div>
        <div className="text-[10px] sm:text-xs lg:text-xs text-gray-700">
          {device.status === 'offline' ? (
            <span className="font-bold text-red-700 text-[10px] sm:text-xs lg:text-sm animate-pulse whitespace-nowrap">
              ⚠️ {offlineCounter}
            </span>
          ) : (
            <span className="whitespace-nowrap">{lastOnline}</span>
          )}
        </div>
      </div>
    </div>
  );
};

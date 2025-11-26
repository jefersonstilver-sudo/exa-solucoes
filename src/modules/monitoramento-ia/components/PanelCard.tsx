import { Device } from '../utils/devices';
import { humanizeDate } from '../utils/formatters';
import { useRealTimeCounter } from '../hooks/useRealTimeCounter';
import { Badge } from '@/components/ui/badge';
import { Wifi, MapPin, Activity } from 'lucide-react';
interface PanelCardProps {
  device: Device;
  onClick: () => void;
}
export const PanelCard = ({
  device,
  onClick
}: PanelCardProps) => {
  const hasCriticalAlert = (device as any).has_critical_alert === true;
  const offlineCounter = useRealTimeCounter(device.status === 'offline' ? device.last_online_at : null);
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
      return 'bg-[#1a2e1a] border-green-500/50';
    }
    if (device.status === 'offline') {
      return 'bg-[#2e1a1a] border-red-500/50 animate-pulse';
    }
    return '';
  };
  const lastOnline = humanizeDate(device.last_online_at);

  // Usar provedor parseado automaticamente
  const provider = device.provider || 'Sem provedor';

  // Nome principal: comments (local) > name
  const rawName = device.comments || device.name;

  // Extrair apenas o nome do prédio (primeira parte antes do " - ")
  const displayName = rawName.split(' - ')[0].trim();

  // Cores por provedor
  const getProviderColor = (providerName: string) => {
    const upperProvider = providerName.toUpperCase();
    if (upperProvider.includes('VIVO')) return 'text-purple-400';
    if (upperProvider.includes('LIGGA')) return 'text-orange-400';
    if (upperProvider.includes('TELECOM FOZ')) return 'text-blue-400';
    return 'text-white/90';
  };
  return <div 
    onClick={onClick} 
    className={`glass-card rounded-[14px] shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border overflow-hidden group hover:scale-[1.03] ${hasCriticalAlert ? 'border-red-600 border-2 animate-pulse shadow-lg shadow-red-200 glow-danger' : getCardBgClass()}`}
    style={{
      backgroundColor: hasCriticalAlert 
        ? undefined 
        : device.status === 'online' 
          ? '#1a2e1a' 
          : device.status === 'offline' 
            ? '#2e1a1a' 
            : undefined
    }}
  >
      {/* Corpo do card */}
      <div className="p-2 sm:p-4 lg:p-6 text-center">
        {/* Nome principal grande */}
        <div className="mb-1 sm:mb-2 lg:mb-3">
          <div className="text-sm sm:text-lg lg:text-3xl font-bold text-module-primary group-hover:text-module-accent transition-colors leading-tight">
            {displayName}
          </div>
        </div>

        {/* Provedor - colorido */}
        <div className="mb-2 sm:mb-3 lg:mb-4">
          <div className={`text-xs sm:text-sm lg:text-lg font-semibold tracking-wide ${getProviderColor(provider)}`}>
            {provider}
          </div>
        </div>

        {/* Nome do prédio (condomínio) */}
        {device.condominio_name && <div className="mb-2 sm:mb-3 lg:mb-4">
            
            {device.metadata?.torre && <div className="text-[10px] sm:text-xs lg:text-sm text-module-tertiary mt-1">
                Torre {device.metadata.torre}
                {device.metadata?.elevador && ` - Elevador ${device.metadata.elevador}`}
              </div>}
          </div>}

        {/* Badge: Eventos */}
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center mb-2 sm:mb-3 lg:mb-4">
          <Badge variant="secondary" className="text-[10px] sm:text-xs lg:text-xs gap-1 bg-module-secondary text-module-primary border-module px-1.5 sm:px-2 py-0.5">
            <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {device.total_events || 0} eventos
          </Badge>
        </div>

        {/* AnyDesk ID - Secundário e discreto */}
        <div className="mb-1 sm:mb-2 text-[10px] sm:text-xs lg:text-xs text-module-tertiary font-mono">
          ID: {device.anydesk_client_id}
        </div>
      </div>

      {/* Rodapé com status */}
      <div className="bg-module-tertiary/50 backdrop-blur-sm px-2 sm:px-4 lg:px-6 py-2 lg:py-3 flex items-center justify-between border-t border-module">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getStatusColor(device.status)}`} />
          <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-module-primary whitespace-nowrap">
            {getStatusLabel(device.status)}
          </span>
        </div>
        <div className="text-[10px] sm:text-xs lg:text-xs text-module-secondary">
          {device.status === 'offline' ? <span className="font-bold text-red-600 text-[10px] sm:text-xs lg:text-sm animate-pulse whitespace-nowrap">
              ⚠️ {offlineCounter}
            </span> : <span className="whitespace-nowrap">{lastOnline}</span>}
        </div>
      </div>
    </div>;
};
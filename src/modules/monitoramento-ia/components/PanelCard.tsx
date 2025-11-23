import { Device } from '../utils/devices';
import { humanizeDate } from '../utils/formatters';
import { useRealTimeCounter } from '../hooks/useRealTimeCounter';
import { Badge } from '@/components/ui/badge';
import { Wifi, MapPin, Activity } from 'lucide-react';

interface PanelCardProps {
  device: Device;
  onClick: () => void;
}

export const PanelCard = ({ device, onClick }: PanelCardProps) => {
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
    if (hasCriticalAlert) return 'border-red-500/50';
    if (device.status === 'online') {
      return 'border-green-500/30';
    }
    if (device.status === 'offline') {
      if (offlineHours > 1) {
        return 'border-red-500/40'; // vermelho forte
      } else {
        return 'border-red-400/30'; // vermelho leve
      }
    }
    return 'border-module-border';
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
    if (upperProvider.includes('VIVO')) return 'text-purple-400 dark:text-purple-400';
    if (upperProvider.includes('LIGGA')) return 'text-orange-400 dark:text-orange-400';
    if (upperProvider.includes('TELECOM FOZ')) return 'text-blue-400 dark:text-blue-400';
    return 'text-module-secondary';
  };

  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-[14px] shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer border overflow-hidden ${
        hasCriticalAlert 
          ? 'border-red-500 border-2 animate-pulse' 
          : getCardBgClass()
      }`}
    >
      {/* Corpo do card */}
      <div className="p-6 text-center">
        {/* Nome principal grande */}
        <div className="mb-3">
          <div className="text-3xl font-bold text-module-primary">
            {displayName}
          </div>
        </div>

        {/* Provedor - colorido */}
        <div className="mb-4">
          <div className={`text-lg font-semibold tracking-wide ${getProviderColor(provider)}`}>
            {provider}
          </div>
        </div>

        {/* Nome do prédio (condomínio) */}
        {device.condominio_name && (
          <div className="mb-4">
            <div className="text-base text-module-secondary font-medium">
              {device.condominio_name}
            </div>
            {device.metadata?.torre && (
              <div className="text-sm text-module-secondary/70 mt-1">
                Torre {device.metadata.torre}
                {device.metadata?.elevador && ` - Elevador ${device.metadata.elevador}`}
              </div>
            )}
          </div>
        )}

        {/* Badge: Eventos */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <Badge variant="secondary" className="text-xs gap-1 bg-module-accent/20 text-module-accent border-module-accent/30">
            <Activity className="h-3 w-3" />
            {device.total_events || 0} eventos
          </Badge>
        </div>

        {/* AnyDesk ID - Secundário e discreto */}
        <div className="mb-2 text-xs text-module-secondary/60 font-mono">
          ID: {device.anydesk_client_id}
        </div>
      </div>

      {/* Rodapé com status */}
      <div className="bg-module-accent/10 backdrop-blur-sm px-6 py-3 flex items-center justify-between border-t border-module-border">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
          <span className="text-sm font-medium text-module-primary">
            {getStatusLabel(device.status)}
          </span>
        </div>
        <div className="text-xs text-module-secondary">
          {device.status === 'offline' ? (
            <span className="font-semibold text-red-400">Offline há {offlineCounter}</span>
          ) : (
            lastOnline
          )}
        </div>
      </div>
    </div>
  );
};

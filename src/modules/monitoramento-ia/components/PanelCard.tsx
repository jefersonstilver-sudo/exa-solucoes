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

  const lastOnline = humanizeDate(device.last_online_at);
  
  // Usar provedor e endereço parseados automaticamente
  const provider = device.provider || 'Sem provedor';
  const address = device.address || 'Sem endereço';

  // Nome principal: comments (local) > name
  const displayName = device.comments || device.name;
  const hasLocation = !!device.comments;

  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-[14px] shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border overflow-hidden group hover:scale-105 ${
        hasCriticalAlert 
          ? 'border-red-600 border-2 animate-pulse shadow-lg shadow-red-200 glow-danger' 
          : 'border-module'
      }`}
    >
      {/* Corpo do card */}
      <div className="p-6 text-center">
        {/* Nome do Local/Painel com ícone */}
        <div className="mb-2">
          {hasLocation ? (
            <div className="flex items-center justify-center gap-2 mb-1">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="text-3xl font-bold text-primary group-hover:text-[#9C1E1E] transition-colors">
                {displayName}
              </div>
            </div>
          ) : (
            <div className="text-3xl font-bold text-module-primary group-hover:text-[#9C1E1E] transition-colors">
              {displayName}
            </div>
          )}
        </div>

        {/* Nome do prédio */}
        <div className="mb-4">
          <div className="text-base text-module-secondary font-medium">
            {device.condominio_name}
          </div>
          {device.metadata?.torre && (
            <div className="text-sm text-module-tertiary mt-1">
              Torre {device.metadata.torre}
              {device.metadata?.elevador && ` - Elevador ${device.metadata.elevador}`}
            </div>
          )}
        </div>

        {/* Badges: Provider, Address */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <Badge variant="outline" className="text-xs gap-1 bg-module-input/50">
            <Wifi className="h-3 w-3" />
            {provider}
          </Badge>
          {address && address !== 'Sem endereço' && (
            <Badge variant="outline" className="text-xs gap-1 bg-module-input/50">
              <MapPin className="h-3 w-3" />
              {address}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs gap-1">
            <Activity className="h-3 w-3" />
            {device.total_events || 0} eventos
          </Badge>
        </div>

        {/* AnyDesk ID - Secundário e discreto */}
        <div className="mb-2 text-xs text-module-tertiary/70 font-mono">
          ID: {device.anydesk_client_id}
        </div>
      </div>

      {/* Rodapé com status */}
      <div className="bg-module-input px-6 py-3 flex items-center justify-between border-t border-module">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
          <span className="text-sm font-medium text-module-secondary">
            {getStatusLabel(device.status)}
          </span>
        </div>
        <div className="text-xs text-module-tertiary">
          {device.status === 'offline' ? (
            <span className="font-semibold text-red-500">Offline há {offlineCounter}</span>
          ) : (
            lastOnline
          )}
        </div>
      </div>
    </div>
  );
};

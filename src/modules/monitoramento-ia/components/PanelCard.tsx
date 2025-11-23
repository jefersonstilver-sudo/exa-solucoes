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
  
  // Detectar provedor de internet nas tags
  const provider = device.tags?.find((tag: string) => 
    ['LIGGA', 'TELECOM FOZ', 'VIVO'].some(p => tag.toUpperCase().includes(p))
  ) || 'Sem provedor';
  
  // Extrair endereço das tags ou comentários
  const address = device.address || 'Sem endereço';

  return (
    <div
      onClick={onClick}
      className={`bg-module-card rounded-[14px] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border overflow-hidden group ${
        hasCriticalAlert 
          ? 'border-red-600 border-2 animate-pulse shadow-lg shadow-red-200' 
          : 'border-module'
      }`}
    >
      {/* Corpo do card */}
      <div className="p-6 text-center">
        {/* Nome do painel (comments ou name) */}
        <div className="mb-2">
          <div className="text-3xl font-bold text-module-primary group-hover:text-[#9C1E1E] transition-colors">
            {device.comments || device.name}
          </div>
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

        {/* Badges: Provider, Address, Total Events */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <Badge variant="outline" className="text-xs gap-1">
            <Wifi className="h-3 w-3" />
            {provider}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <MapPin className="h-3 w-3" />
            {address}
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1">
            <Activity className="h-3 w-3" />
            {device.total_events || 0} eventos
          </Badge>
        </div>

        {/* AnyDesk ID */}
        <div className="mb-2 text-xs text-module-tertiary font-mono">
          {device.anydesk_client_id}
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

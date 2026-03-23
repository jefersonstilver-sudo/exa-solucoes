import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, CircleSlash } from 'lucide-react';
import { DeviceStatus } from '@/hooks/useBuildingDeviceStatus';
import BuildingOutageHistory from './BuildingOutageHistory';
import { cn } from '@/lib/utils';

interface BuildingPanelStatusBadgeProps {
  deviceId: string | null;
  status: DeviceStatus;
  buildingStatus?: string;
  lastOnlineAt?: string | null;
  showOutageHistory?: boolean;
  className?: string;
}

const BuildingPanelStatusBadge: React.FC<BuildingPanelStatusBadgeProps> = ({
  deviceId,
  status,
  buildingStatus,
  lastOnlineAt,
  showOutageHistory = true,
  className
}) => {
  // Regra de negócio: prédio ativo = Online, exceto se device real está offline
  const effectiveStatus: DeviceStatus = 
    (buildingStatus === 'ativo' && status !== 'online' && status !== 'offline') ? 'online' : status;

  const getStatusConfig = () => {
    switch (effectiveStatus) {
      case 'online':
        return {
          label: 'Online',
          icon: Wifi,
          className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
          dotClass: 'bg-green-500'
        };
      case 'offline':
        return {
          label: 'Offline',
          icon: WifiOff,
          className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 cursor-pointer',
          dotClass: 'bg-red-500 animate-pulse'
        };
      case 'not_connected':
      default:
        return {
          label: 'Não conectado',
          icon: CircleSlash,
          className: 'bg-gray-100 text-gray-500 border-gray-200',
          dotClass: 'bg-gray-400'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium transition-colors",
        config.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );

  // Se for offline ou online e showOutageHistory, permite clique para ver histórico
  if (showOutageHistory && deviceId && (effectiveStatus === 'offline' || effectiveStatus === 'online')) {
    return (
      <BuildingOutageHistory deviceId={deviceId}>
        {badgeContent}
      </BuildingOutageHistory>
    );
  }

  return badgeContent;
};

export default BuildingPanelStatusBadge;

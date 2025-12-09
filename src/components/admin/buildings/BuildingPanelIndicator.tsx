import React, { useState } from 'react';
import { Circle, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BuildingPanelsStatus } from '@/hooks/useBuildingPanelsStatus';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BuildingPanelIndicatorProps {
  panelsStatus: BuildingPanelsStatus | undefined;
  isLoading?: boolean;
  compact?: boolean;
}

export const BuildingPanelIndicator: React.FC<BuildingPanelIndicatorProps> = ({
  panelsStatus,
  isLoading = false,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-muted animate-pulse">
        <Circle className="h-2 w-2 mr-1" />
        ...
      </Badge>
    );
  }

  if (!panelsStatus || panelsStatus.status === 'not_connected') {
    return (
      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 bg-muted/30">
        <Circle className="h-2 w-2 mr-1 fill-muted-foreground" />
        {compact ? '--' : 'Não conectado'}
      </Badge>
    );
  }

  const getStatusConfig = () => {
    switch (panelsStatus.status) {
      case 'all_online':
        return {
          icon: <Wifi className="h-3 w-3" />,
          label: compact ? `${panelsStatus.percentage}%` : `${panelsStatus.onlineCount}/${panelsStatus.totalPanels}`,
          className: 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20',
          dotColor: 'bg-green-500',
        };
      case 'all_offline':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: compact ? '0%' : `0/${panelsStatus.totalPanels}`,
          className: 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20',
          dotColor: 'bg-red-500',
        };
      case 'partial':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          label: compact ? `${panelsStatus.percentage}%` : `${panelsStatus.onlineCount}/${panelsStatus.totalPanels}`,
          className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20',
          dotColor: 'bg-yellow-500',
        };
      default:
        return {
          icon: <Circle className="h-3 w-3" />,
          label: '--',
          className: 'text-muted-foreground border-muted',
          dotColor: 'bg-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();

  const indicatorContent = (
    <Badge 
      variant="outline" 
      className={`cursor-pointer transition-colors ${config.className}`}
    >
      <span className={`h-2 w-2 rounded-full mr-1.5 ${config.dotColor} animate-pulse`} />
      {config.icon}
      <span className="ml-1 font-medium">{config.label}</span>
    </Badge>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {indicatorContent}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Status dos Painéis</h4>
            <Badge variant="outline" className={config.className}>
              {panelsStatus.percentage}% Online
            </Badge>
          </div>

          <div className="space-y-2">
            {panelsStatus.devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {device.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {device.status === 'online' ? (
                    'Online'
                  ) : device.lastOnlineAt ? (
                    `Offline há ${formatDistanceToNow(new Date(device.lastOnlineAt), { locale: ptBR })}`
                  ) : (
                    'Offline'
                  )}
                </span>
              </div>
            ))}
          </div>

          {panelsStatus.totalPanels > 0 && (
            <div className="pt-2 border-t">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total: {panelsStatus.totalPanels} painéis</span>
                <span>
                  {panelsStatus.onlineCount} online • {panelsStatus.offlineCount} offline
                </span>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

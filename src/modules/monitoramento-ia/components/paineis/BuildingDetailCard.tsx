import React, { useState } from 'react';
import { X, MapPin, Wifi, WifiOff, Navigation, AlertTriangle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BuildingWithDeviceStatus, PROVIDER_COLORS } from '../../hooks/useBuildingsWithDeviceStatus';
import { RouteOptionsDialog } from './RouteOptionsDialog';

interface BuildingDetailCardProps {
  building: BuildingWithDeviceStatus;
  onClose: () => void;
  periodLabel?: string;
}

export const BuildingDetailCard: React.FC<BuildingDetailCardProps> = ({
  building,
  onClose,
  periodLabel = 'hoje',
}) => {
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);

  // Get coordinates (prefer manual, fallback to auto)
  const lat = building.manual_latitude || building.latitude || 0;
  const lng = building.manual_longitude || building.longitude || 0;

  const statusConfig = {
    online: {
      label: 'Todos Online',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    partial: {
      label: 'Parcial',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    },
    offline: {
      label: 'Todos Offline',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950',
    },
    unknown: {
      label: 'Desconhecido',
      color: 'bg-gray-400',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900',
    },
  };

  const config = statusConfig[building.status];

  return (
    <>
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
        {/* Header */}
        <div className={`p-4 ${config.bgColor} border-b border-border`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                <h3 className="font-bold text-foreground truncate">{building.nome}</h3>
              </div>
              {building.endereco && (
                <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{building.endereco}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge className={`${config.color} text-white`}>
              {config.label}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Wifi className="w-3 h-3 text-green-500" />
              {building.onlineCount}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <WifiOff className="w-3 h-3 text-red-500" />
              {building.offlineCount}
            </Badge>
            {building.eventsCount > 0 && (
              <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300">
                <AlertTriangle className="w-3 h-3" />
                {building.eventsCount} {periodLabel}
              </Badge>
            )}
            {building.provider && (
              <Badge 
                variant="outline"
                style={{ 
                  borderColor: PROVIDER_COLORS[building.provider] || PROVIDER_COLORS.default,
                  color: PROVIDER_COLORS[building.provider] || PROVIDER_COLORS.default,
                }}
              >
                {building.provider}
              </Badge>
            )}
          </div>
        </div>

        {/* Devices list */}
        <ScrollArea className="max-h-48">
          <div className="p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Painéis ({building.totalDevices})
            </p>
            {building.devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {device.status === 'online' ? (
                    <Wifi className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-sm truncate">{device.alias}</span>
                </div>
                {device.provider && (
                  <span 
                    className="text-xs font-medium px-1.5 py-0.5 rounded"
                    style={{ 
                      backgroundColor: `${PROVIDER_COLORS[device.provider] || PROVIDER_COLORS.default}20`,
                      color: PROVIDER_COLORS[device.provider] || PROVIDER_COLORS.default,
                    }}
                  >
                    {device.provider}
                  </span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Action button */}
        <div className="p-3 border-t border-border">
          <Button
            onClick={() => setRouteDialogOpen(true)}
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            <Navigation className="w-4 h-4" />
            Rotas até lá
          </Button>
        </div>
      </div>

      <RouteOptionsDialog
        isOpen={routeDialogOpen}
        onClose={() => setRouteDialogOpen(false)}
        buildingName={building.nome}
        latitude={lat}
        longitude={lng}
        address={building.endereco}
      />
    </>
  );
};

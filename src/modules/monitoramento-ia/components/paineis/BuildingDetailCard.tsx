import React, { useState } from 'react';
import { X, MapPin, Wifi, WifiOff, Navigation, AlertTriangle, Building2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BuildingWithDeviceStatus, PROVIDER_COLORS } from '../../hooks/useBuildingsWithDeviceStatus';
import { RouteOptionsDialog } from './RouteOptionsDialog';
import { BuildingAddressEditor } from './BuildingAddressEditor';

interface BuildingDetailCardProps {
  building: BuildingWithDeviceStatus;
  onClose: () => void;
  onAddressUpdate?: () => void;
  periodLabel?: string;
}

export const BuildingDetailCard: React.FC<BuildingDetailCardProps> = ({
  building,
  onClose,
  onAddressUpdate,
  periodLabel = 'hoje',
}) => {
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(building.endereco);

  // Get coordinates (prefer manual, fallback to auto)
  const lat = building.manual_latitude || building.latitude || 0;
  const lng = building.manual_longitude || building.longitude || 0;

  const statusConfig = {
    online: {
      label: 'Todos Online',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50/80 dark:bg-green-950/50',
    },
    partial: {
      label: 'Parcial',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50/80 dark:bg-yellow-950/50',
    },
    offline: {
      label: 'Todos Offline',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50/80 dark:bg-red-950/50',
    },
    unknown: {
      label: 'Desconhecido',
      color: 'bg-gray-400',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50/80 dark:bg-gray-900/50',
    },
  };

  const config = statusConfig[building.status];

  const handleAddressSave = (newAddress: string, newLat: number, newLng: number) => {
    setCurrentAddress(newAddress);
    setEditingAddress(false);
    onAddressUpdate?.();
  };

  return (
    <>
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-2xl z-20 overflow-hidden">
        {/* Header */}
        <div className={`p-4 ${config.bgColor} backdrop-blur-sm border-b border-white/10`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                <h3 className="font-bold text-foreground truncate">{building.nome}</h3>
              </div>
              
              {/* Address with edit capability */}
              {editingAddress ? (
                <BuildingAddressEditor
                  buildingId={building.id}
                  currentAddress={currentAddress}
                  onSave={handleAddressSave}
                  onCancel={() => setEditingAddress(false)}
                />
              ) : (
                <div className="flex items-start gap-1.5 group">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                    {currentAddress || 'Endereço não definido'}
                  </p>
                  <button
                    onClick={() => setEditingAddress(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-all"
                    title="Editar endereço"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge className={`${config.color} text-white shadow-sm`}>
              {config.label}
            </Badge>
            <Badge variant="outline" className="gap-1 bg-white/50 dark:bg-gray-800/50">
              <Wifi className="w-3 h-3 text-green-500" />
              {building.onlineCount}
            </Badge>
            <Badge variant="outline" className="gap-1 bg-white/50 dark:bg-gray-800/50">
              <WifiOff className="w-3 h-3 text-red-500" />
              {building.offlineCount}
            </Badge>
            {building.eventsCount > 0 && (
              <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300 bg-orange-50/50 dark:bg-orange-900/30">
                <AlertTriangle className="w-3 h-3" />
                {building.eventsCount} {periodLabel}
              </Badge>
            )}
            {building.provider && (
              <Badge 
                variant="outline"
                className="bg-white/50 dark:bg-gray-800/50"
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
                className="flex items-center justify-between p-2.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/20"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {device.status === 'online' ? (
                    <div className="relative">
                      <Wifi className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30" />
                    </div>
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

        {/* Action buttons */}
        <div className="p-3 border-t border-white/10 dark:border-gray-700/20 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingAddress(true)}
            className="flex-1 gap-2 bg-white/50 dark:bg-gray-800/50"
          >
            <Edit3 className="w-4 h-4" />
            Editar Local
          </Button>
          <Button
            onClick={() => setRouteDialogOpen(true)}
            size="sm"
            className="flex-1 gap-2 bg-primary hover:bg-primary/90"
          >
            <Navigation className="w-4 h-4" />
            Rotas
          </Button>
        </div>
      </div>

      <RouteOptionsDialog
        isOpen={routeDialogOpen}
        onClose={() => setRouteDialogOpen(false)}
        buildingName={building.nome}
        latitude={lat}
        longitude={lng}
        address={currentAddress || building.endereco}
      />
    </>
  );
};

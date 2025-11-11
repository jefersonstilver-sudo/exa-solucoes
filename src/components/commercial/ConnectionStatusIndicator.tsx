import React from 'react';
import { Wifi, WifiOff, Activity, Database, AlertTriangle } from 'lucide-react';
import { RealtimeConnectionStatus } from '@/hooks/useRealtimeConnection';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatusIndicatorProps {
  status: RealtimeConnectionStatus;
  showDetailed?: boolean;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ 
  status,
  showDetailed = false 
}) => {
  const isFullyConnected = status.isNetworkOnline && status.isRealtimeConnected;
  
  // Calcular tempo desde último update
  const getTimeSinceUpdate = () => {
    if (!status.lastUpdate) return null;
    const seconds = Math.floor((Date.now() - status.lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s atrás`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min atrás`;
  };

  // Verificar se heartbeat está ativo (últimos 5 segundos)
  const isHeartbeatAlive = status.lastHeartbeat && 
    (Date.now() - status.lastHeartbeat.getTime() < 5000);

  if (showDetailed) {
    return (
      <div className="flex flex-col gap-2">
        {/* Status principal */}
        <div className="flex items-center gap-2">
          {isFullyConnected ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
                <Wifi className="h-4 w-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Online</span>
                {isHeartbeatAlive && (
                  <Activity className="h-3 w-3 text-green-400 animate-pulse" />
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-500/30 animate-pulse">
                <WifiOff className="h-4 w-4 text-red-400" />
                <span className="text-red-400 text-sm font-medium">Desconectado</span>
                <AlertTriangle className="h-3 w-3 text-red-400" />
              </div>
            </>
          )}
        </div>

        {/* Detalhes */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Rede */}
          <Badge variant={status.isNetworkOnline ? "default" : "destructive"} className="text-xs">
            {status.isNetworkOnline ? '🌐 Internet OK' : '🌐 Sem Internet'}
          </Badge>

          {/* Realtime */}
          <Badge 
            variant={status.isRealtimeConnected ? "default" : "destructive"} 
            className="text-xs bg-blue-600"
          >
            <Database className="h-3 w-3 mr-1" />
            {status.channelStatus === 'connected' ? 'Sync ON' : 'Sync OFF'}
          </Badge>

          {/* Último update */}
          {status.lastUpdate && (
            <Badge variant="outline" className="text-xs">
              📡 {getTimeSinceUpdate()}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Versão compacta para header
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {isFullyConnected ? (
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30 relative">
          <Wifi className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-green-400" />
          <span className="text-green-400 text-xs sm:text-sm font-medium hidden sm:inline">Online</span>
          {isHeartbeatAlive && (
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30 animate-pulse">
          <WifiOff className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-red-400" />
          <span className="text-red-400 text-xs sm:text-sm font-medium hidden sm:inline">Offline</span>
        </div>
      )}
    </div>
  );
};

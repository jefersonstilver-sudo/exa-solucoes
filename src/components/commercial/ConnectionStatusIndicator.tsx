import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { RealtimeConnectionStatus } from '@/hooks/useRealtimeConnection';

interface ConnectionStatusIndicatorProps {
  status: RealtimeConnectionStatus;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ status }) => {
  const [downloadSpeed, setDownloadSpeed] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const lastTestRef = useRef<number>(0);
  const downloadTestRef = useRef<AbortController | null>(null);

  // Calcular taxa de transmissão real
  useEffect(() => {
    const calculateSpeed = async () => {
      const now = Date.now();
      
      // Testar a cada 10 segundos
      if (now - lastTestRef.current < 10000 || isCalculating) {
        return;
      }

      lastTestRef.current = now;
      setIsCalculating(true);

      try {
        // Cancelar teste anterior se existir
        if (downloadTestRef.current) {
          downloadTestRef.current.abort();
        }

        downloadTestRef.current = new AbortController();

        // Fazer download de um pequeno arquivo para testar velocidade
        // Usando um arquivo de imagem pública do Supabase como teste
        const testUrl = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/videos/test-file.jpg?' + Date.now();
        const startTime = performance.now();
        
        const response = await fetch(testUrl, {
          method: 'GET',
          cache: 'no-store',
          signal: downloadTestRef.current.signal
        });

        if (!response.ok) {
          // Se falhar, tentar com um endpoint alternativo
          const altResponse = await fetch('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', {
            method: 'GET',
            cache: 'no-store',
            signal: downloadTestRef.current.signal
          });
          
          if (altResponse.ok) {
            const blob = await altResponse.blob();
            const endTime = performance.now();
            const durationSeconds = (endTime - startTime) / 1000;
            const fileSizeBytes = blob.size;
            const speedBps = fileSizeBytes / durationSeconds;
            const speedMbps = (speedBps * 8) / 1_000_000;

            console.log('📊 [SPEED TEST]', {
              fileSizeKB: (fileSizeBytes / 1024).toFixed(2),
              durationMs: (endTime - startTime).toFixed(0),
              speedMbps: speedMbps.toFixed(2)
            });

            setDownloadSpeed(Math.max(speedMbps, 0.1));
          }
        } else {
          const blob = await response.blob();
          const endTime = performance.now();
          const durationSeconds = (endTime - startTime) / 1000;
          const fileSizeBytes = blob.size;
          const speedBps = fileSizeBytes / durationSeconds;
          const speedMbps = (speedBps * 8) / 1_000_000;

          console.log('📊 [SPEED TEST]', {
            fileSizeKB: (fileSizeBytes / 1024).toFixed(2),
            durationMs: (endTime - startTime).toFixed(0),
            speedMbps: speedMbps.toFixed(2)
          });

          setDownloadSpeed(Math.max(speedMbps, 0.1));
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('❌ [SPEED TEST] Erro:', error);
          // Manter velocidade anterior em caso de erro
        }
      } finally {
        setIsCalculating(false);
        downloadTestRef.current = null;
      }
    };

    // Calcular velocidade inicial
    calculateSpeed();

    // Recalcular periodicamente
    const interval = setInterval(calculateSpeed, 15000);

    return () => {
      clearInterval(interval);
      if (downloadTestRef.current) {
        downloadTestRef.current.abort();
      }
    };
  }, [isCalculating]);

  const isConnected = status.isNetworkOnline && status.isRealtimeConnected;
  const timeSinceLastHeartbeat = status.lastHeartbeat 
    ? Date.now() - status.lastHeartbeat.getTime() 
    : 999999;

  // Considerar desconectado se não houver heartbeat há mais de 10 segundos
  const isRecentlyActive = timeSinceLastHeartbeat < 10000;

  // Determinar qualidade da conexão baseado na velocidade
  const getConnectionQuality = () => {
    if (!isConnected || !isRecentlyActive) return 'disconnected';
    if (downloadSpeed >= 5) return 'excellent';
    if (downloadSpeed >= 2) return 'good';
    if (downloadSpeed >= 1) return 'fair';
    return 'poor';
  };

  const quality = getConnectionQuality();

  const getStatusColor = () => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (!isConnected || !isRecentlyActive) return 'Desconectado';
    return 'Conectado';
  };

  const formatSpeed = (mbps: number) => {
    if (mbps >= 1) {
      return `${mbps.toFixed(1)} Mbps`;
    } else {
      return `${(mbps * 1000).toFixed(0)} Kbps`;
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Status visual */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-black/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
        <div className="relative">
          {isConnected && isRecentlyActive ? (
            <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          ) : (
            <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-300" />
          )}
          <div 
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusColor()} ${
              isConnected && isRecentlyActive ? 'animate-pulse' : ''
            }`}
          />
        </div>
        
        <div className="flex flex-col items-start min-w-0">
          <span className="text-white text-[10px] sm:text-xs font-medium leading-none whitespace-nowrap">
            {getStatusText()}
          </span>
          
          {isConnected && isRecentlyActive && downloadSpeed > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Activity className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white/70" />
              <span className="text-white/70 text-[9px] sm:text-[10px] leading-none whitespace-nowrap">
                {formatSpeed(downloadSpeed)}
              </span>
            </div>
          )}

          {(!isConnected || !isRecentlyActive) && (
            <span className="text-red-300 text-[9px] sm:text-[10px] leading-none whitespace-nowrap mt-0.5">
              Sem conexão
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

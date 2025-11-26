import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Device } from '../utils/devices';
import { cn } from '@/lib/utils';
import { useRealTimeCounter } from '../hooks/useRealTimeCounter';

interface FullscreenMonitorProps {
  devices: Device[];
  onClose: () => void;
}

const MonitorCard = ({ device, compact }: { device: Device; compact: boolean }) => {
  const displayName = (device.comments || device.name).split(' - ')[0].trim();
  const provider = device.provider || 'Sem provedor';
  const elapsed = useRealTimeCounter(device.last_online_at);
  
  const getProviderColor = (providerName: string) => {
    const upperProvider = providerName.toUpperCase();
    if (upperProvider.includes('VIVO')) return 'text-purple-400';
    if (upperProvider.includes('LIGGA')) return 'text-orange-400';
    if (upperProvider.includes('TELECOM FOZ')) return 'text-blue-400';
    return 'text-white/90';
  };

  const isOnline = device.status === 'online';
  const nameSize = compact ? 'text-base' : 'text-xl';
  const providerSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className={cn(
      "bg-gradient-to-br from-gray-900/90 to-gray-800/80",
      "backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden",
      "transition-all duration-300 hover:scale-[1.02]",
      isOnline 
        ? "border-2 border-green-500/80 shadow-green-500/20" 
        : "border-2 border-red-500/80 shadow-red-500/20"
    )}>
      <div className="p-4 flex flex-col justify-between h-full">
        <div className="space-y-2">
          <div className={cn(
            "font-bold mb-1",
            nameSize,
            isOnline ? "text-white" : "text-white uppercase"
          )}>
            {displayName}
          </div>
          
          <div className={cn(
            "font-semibold",
            providerSize,
            getProviderColor(provider)
          )}>
            {provider}
          </div>

          {!compact && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">
                <Zap className="w-3 h-3" />
                <span>{device.total_events || 0}</span>
              </div>
            </div>
          )}

          {!compact && device.id && (
            <div className="text-xs text-gray-500 mt-1">
              ID: {device.id.substring(0, 8)}
            </div>
          )}
        </div>
        
        <div className="mt-auto pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isOnline ? "text-green-400" : "text-red-400"
              )}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className={cn(
              "text-xs",
              isOnline ? "text-gray-400" : "text-red-400"
            )}>
              {isOnline ? (
                device.last_online_at 
                  ? formatDistanceToNow(new Date(device.last_online_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })
                  : 'agora'
              ) : (
                `⚠ ${elapsed}`
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FullscreenMonitor = ({ devices, onClose }: FullscreenMonitorProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const getGridCols = (count: number) => {
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    if (count <= 25) return 'grid-cols-5';
    return 'grid-cols-6';
  };

  const onlineCount = devices.filter(d => d.status === 'online').length;

  return (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-black via-gray-950 to-black overflow-auto">
      {/* Header com Data/Hora Moderno */}
      <div className="sticky top-0 bg-black/60 backdrop-blur-xl border-b border-gray-800/50 z-10">
        <div className="px-8 py-6 flex justify-between items-center">
          <div className="relative">
            <p className="text-7xl font-black tabular-nums tracking-tighter bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              {format(currentTime, 'HH:mm:ss')}
            </p>
            <p className="text-xl text-gray-400 mt-2 font-light">
              {format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Painéis Conectados</p>
            <p className="text-4xl font-bold">
              <span className="text-green-400">{onlineCount}</span>
              <span className="text-gray-600"> / </span>
              <span className="text-white">{devices.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Cards - TODOS os dispositivos */}
      <div className={`p-8 grid ${getGridCols(devices.length)} gap-6 auto-rows-fr`}>
        {devices.map(device => (
          <MonitorCard 
            key={device.id} 
            device={device} 
            compact={devices.length > 9} 
          />
        ))}
      </div>

      {/* Hint discreto para sair */}
      <p className="text-xs text-gray-700 fixed bottom-6 right-6 bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
        Pressione <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">ESPAÇO</kbd> para sair
      </p>

      {/* Mensagem se não houver dispositivos */}
      {devices.length === 0 && (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-600 mb-4">
              Nenhum dispositivo encontrado
            </p>
            <p className="text-xl text-gray-700">
              Aguardando dados...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

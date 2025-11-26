import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Wifi, WifiOff, Zap } from 'lucide-react';
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
  const isOnline = device.status === 'online';
  
  const getProviderColor = (providerName: string) => {
    const upperProvider = providerName.toUpperCase();
    if (upperProvider.includes('VIVO')) return 'text-purple-400';
    if (upperProvider.includes('LIGGA')) return 'text-orange-400';
    if (upperProvider.includes('TELECOM FOZ')) return 'text-blue-400';
    return 'text-white/90';
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl h-full",
      "bg-gradient-to-br from-white/10 to-white/5",
      "backdrop-blur-xl border border-white/10",
      "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
      "transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
    )}>
      {/* Glow lateral (efeito lâmpada) */}
      <div className={cn(
        "absolute top-0 bottom-0 w-1.5 left-0",
        isOnline 
          ? "bg-gradient-to-b from-green-400 via-green-500 to-green-400 shadow-[0_0_20px_rgba(34,197,94,0.8)]" 
          : "bg-gradient-to-b from-red-400 via-red-500 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)]"
      )} />
      
      {/* LED pulsante */}
      <div className={cn(
        "absolute top-3 right-3 w-3 h-3 rounded-full",
        isOnline 
          ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,1)] animate-pulse" 
          : "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]"
      )} />
      
      {/* Conteúdo */}
      <div className="p-4 pl-5 h-full flex flex-col justify-between">
        <div className="space-y-2 flex-1">
          <h3 className={cn(
            "font-bold text-white line-clamp-2",
            !isOnline && "uppercase",
            compact ? "text-sm" : "text-lg"
          )}>
            {displayName}
          </h3>
          
          <p className={cn(
            "font-semibold",
            compact ? "text-xs" : "text-sm",
            getProviderColor(provider)
          )}>
            {provider}
          </p>

          {!compact && (
            <>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">
                  <Zap className="w-3 h-3" />
                  <span>{device.total_events || 0}</span>
                </div>
              </div>

              {device.id && (
                <p className="text-xs text-white/40 font-mono truncate">
                  ID: {device.id.substring(0, 8)}
                </p>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-white/10">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className={cn(
                "text-xs font-semibold",
                isOnline ? "text-green-400" : "text-red-400"
              )}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className={cn(
              "text-xs truncate",
              isOnline ? "text-white/50" : "text-red-400/80"
            )}>
              {isOnline 
                ? (device.last_online_at 
                    ? formatDistanceToNow(new Date(device.last_online_at), { addSuffix: true, locale: ptBR })
                    : 'agora')
                : `⚠ ${elapsed}`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FullscreenMonitor = ({ devices, onClose }: FullscreenMonitorProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar relógio
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sair com ESPAÇO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Separar online/offline
  const onlineDevices = useMemo(() => devices.filter(d => d.status === 'online'), [devices]);
  const offlineDevices = useMemo(() => 
    devices
      .filter(d => d.status !== 'online')
      .sort((a, b) => {
        const dateA = new Date(a.last_online_at || 0).getTime();
        const dateB = new Date(b.last_online_at || 0).getTime();
        return dateB - dateA; // Mais recente primeiro
      }), 
    [devices]
  );

  // Grid adaptativo
  const gridConfig = useMemo(() => {
    const count = devices.length;
    if (count === 0) return { cols: 1, compact: false };
    if (count <= 2) return { cols: 2, compact: false };
    if (count <= 6) return { cols: 3, compact: false };
    if (count <= 12) return { cols: 4, compact: false };
    if (count <= 20) return { cols: 5, compact: true };
    return { cols: 6, compact: true };
  }, [devices.length]);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999999] overflow-hidden bg-black">
      {/* Background gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900" />
      
      {/* Shapes decorativos */}
      <div 
        className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] 
                   bg-gradient-radial from-red-900/20 to-transparent 
                   rounded-full blur-[100px] animate-pulse" 
        style={{ animationDuration: '8s' }} 
      />
      <div 
        className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] 
                   bg-gradient-radial from-blue-900/15 to-transparent 
                   rounded-full blur-[100px] animate-pulse" 
        style={{ animationDuration: '10s', animationDirection: 'reverse' }} 
      />
      
      {/* Conteúdo principal */}
      <div className="relative z-10 flex h-full">
        
        {/* Área Principal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Header */}
          <header className="shrink-0 p-6 flex justify-between items-center 
                             bg-gradient-to-r from-white/5 to-transparent 
                             backdrop-blur-xl border-b border-white/10">
            
            {/* Logo/Título */}
            <div>
              <h1 className="text-2xl font-bold text-white">Monitor em Tempo Real</h1>
              <p className="text-sm text-white/50">Sistema de Monitoramento EXA</p>
            </div>
            
            {/* Relógio Moderno */}
            <div className="relative flex flex-col items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 
                              blur-3xl rounded-full scale-150 opacity-50" />
              
              <div className="relative flex items-baseline gap-1">
                <p className="text-7xl font-black tracking-tight tabular-nums
                              bg-gradient-to-b from-white via-white to-gray-400 
                              bg-clip-text text-transparent
                              drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  {format(currentTime, 'HH:mm')}
                </p>
                <span className="text-3xl font-light text-white/50 animate-pulse tabular-nums self-start pt-2">
                  :{format(currentTime, 'ss')}
                </span>
              </div>
              
              <p className="mt-2 text-sm text-white/60 font-light tracking-widest uppercase">
                {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            
            {/* Contador */}
            <div className="text-right">
              <p className="text-sm text-white/50 uppercase tracking-wide">Painéis Conectados</p>
              <p className="text-4xl font-black tabular-nums">
                <span className="text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                  {onlineDevices.length}
                </span>
                <span className="text-white/30 mx-1">/</span>
                <span className="text-white">{devices.length}</span>
              </p>
            </div>
          </header>
          
          {/* Grid de Cards */}
          <main className="flex-1 p-6 overflow-auto">
            {devices.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white/60 mb-4">
                    Nenhum dispositivo encontrado
                  </p>
                  <p className="text-xl text-white/40">Aguardando dados...</p>
                </div>
              </div>
            ) : (
              <div 
                className="grid gap-4 auto-rows-fr mx-auto max-w-full"
                style={{ 
                  gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
                  maxWidth: `${gridConfig.cols * 280}px`
                }}
              >
                {devices.map(device => (
                  <MonitorCard 
                    key={device.id} 
                    device={device} 
                    compact={gridConfig.compact}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
        
        {/* Sidebar de Alertas */}
        <aside className="w-80 h-full flex flex-col shrink-0
                          bg-gradient-to-b from-white/5 to-transparent 
                          backdrop-blur-2xl border-l border-white/10">
          
          {/* Header da sidebar */}
          <div className="p-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse 
                                shadow-[0_0_8px_rgba(239,68,68,1)]" />
                <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full 
                                animate-ping opacity-75" />
              </div>
              <h3 className="text-white font-bold">Alertas em Tempo Real</h3>
            </div>
            <p className="text-xs text-white/50 mt-1">
              {offlineDevices.length} {offlineDevices.length === 1 ? 'dispositivo offline' : 'dispositivos offline'}
            </p>
          </div>
          
          {/* Lista de alertas */}
          <div className="flex-1 overflow-y-auto">
            {offlineDevices.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 
                                flex items-center justify-center">
                  <Wifi className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-white/60 text-sm">
                  Todos os dispositivos estão online
                </p>
              </div>
            ) : (
              offlineDevices.map((device, index) => {
                const isNewest = index === 0;
                const displayName = (device.comments || device.name).split(' - ')[0].trim();
                const timeAgo = device.last_online_at 
                  ? formatDistanceToNow(new Date(device.last_online_at), { addSuffix: true, locale: ptBR })
                  : 'Sem informação';
                
                return (
                  <div 
                    key={device.id} 
                    className={cn(
                      "p-3 border-b border-white/5",
                      "hover:bg-white/5 transition-colors",
                      isNewest && "bg-red-500/10 border-l-4 border-l-red-500"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={cn(
                        "w-4 h-4 mt-0.5 shrink-0",
                        isNewest ? "text-red-400 animate-pulse" : "text-red-400/60"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5 truncate">
                          {device.provider || 'Provedor desconhecido'}
                        </p>
                        <p className="text-xs text-red-400/80 mt-1">
                          {timeAgo}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
      
      {/* Hint para sair */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 
                      text-xs text-white/30 bg-white/5 px-4 py-2 rounded-full 
                      backdrop-blur-sm border border-white/10">
        Pressione <kbd className="px-2 py-0.5 bg-white/10 rounded mx-1 font-mono text-white/50">ESPAÇO</kbd> para sair
      </div>
    </div>
  );
};
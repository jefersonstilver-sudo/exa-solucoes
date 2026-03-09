import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Wifi, WifiOff, Zap, AlertTriangle, ClipboardCheck, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Device } from '../utils/devices';
import { IncidentStatus } from '../hooks/useDeviceIncidentStatus';
import { cn } from '@/lib/utils';
import { useRealTimeCounter } from '../hooks/useRealTimeCounter';
import { usePeriodAlerts } from '../hooks/usePeriodAlerts';
import { usePeriodDeviceEvents } from '../hooks/usePeriodDeviceEvents';
import { PeriodSelector, PeriodType } from './PeriodSelector';

interface FullscreenMonitorProps {
  devices: Device[];
  onClose: () => void;
  incidentStatusMap?: Map<string, IncidentStatus>;
}

interface MonitorCardProps {
  device: Device;
  compact: boolean;
  periodEventsCount?: number;
  incidentStatus?: IncidentStatus;
}

const MonitorCard = ({ device, compact, periodEventsCount, incidentStatus }: MonitorCardProps) => {
  const displayName = (device.comments || device.name).split(' - ')[0].trim();
  const provider = device.provider || 'Sem provedor';
  const elapsed = useRealTimeCounter(device.last_online_at);
  const isOnline = device.status === 'online';
  
  // Use period events count if provided, otherwise fallback to total_events
  const displayEventsCount = periodEventsCount !== undefined ? periodEventsCount : (device.total_events || 0);
  
  const getProviderColor = (providerName: string) => {
    const upperProvider = providerName.toUpperCase();
    if (upperProvider.includes('VIVO')) return 'text-purple-400';
    if (upperProvider.includes('LIGGA')) return 'text-orange-400';
    if (upperProvider.includes('TELECOM FOZ')) return 'text-blue-400';
    return 'text-white/90';
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl h-full transition-all duration-300",
        isOnline 
          ? "bg-green-950/90 border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
          : "bg-red-950/90 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse"
      )}
      style={{
        backgroundColor: isOnline ? 'rgba(5, 46, 22, 0.9)' : 'rgba(69, 10, 10, 0.9)'
      }}
    >
      
      {/* LED Status (canto superior direito) */}
      <div className={cn(
        "absolute top-3 right-3 w-4 h-4 rounded-full shadow-lg",
        isOnline 
          ? "bg-green-500 shadow-[0_0_16px_rgba(34,197,94,1)] animate-pulse" 
          : "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] animate-ping"
      )} />
      
      {/* Conteúdo */}
      <div className="p-5 h-full flex flex-col justify-between">
        <div className="space-y-2 flex-1">
          {/* Nome do Prédio/Painel - Grande e Branco */}
          <h3 className={cn(
            "font-bold text-white line-clamp-2 leading-tight",
            compact ? "text-base" : "text-2xl"
          )}>
            {displayName}
          </h3>
          
          {/* Provedor - Colorido */}
          <p className={cn(
            "font-semibold",
            compact ? "text-xs" : "text-sm",
            getProviderColor(provider)
          )}>
            {provider}
          </p>

          {!compact && (
            <div className="flex items-center gap-2 mt-3">
              {/* Badge de Eventos */}
              <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-md">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-sm font-semibold">{displayEventsCount}</span>
              </div>
            </div>
          )}

          {!compact && device.id && (
            <p className="text-xs text-white/40 font-mono truncate mt-2">
              ID: {device.id.substring(0, 8)}
            </p>
          )}
        </div>
        
        {/* Footer - Status */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className={cn(
                "text-sm font-bold",
                isOnline ? "text-green-400" : "text-red-400"
              )}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {/* Incident status indicator */}
              {!isOnline && incidentStatus === 'pendente' && (
                <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              )}
              {!isOnline && incidentStatus === 'causa_registrada' && (
                <CheckCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <span className={cn(
              "text-xs truncate",
              isOnline ? "text-white/50" : "text-red-400"
            )}>
              {isOnline 
                ? (device.last_online_at 
                    ? formatDistanceToNow(new Date(device.last_online_at), { addSuffix: true, locale: ptBR })
                    : 'agora')
                : elapsed
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FullscreenMonitor = ({ devices, onClose, incidentStatusMap }: FullscreenMonitorProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPortrait, setIsPortrait] = useState(false);
  const [showAlertsSidebar, setShowAlertsSidebar] = useState(true);
  
  // Estado do período
  const [period, setPeriod] = useState<PeriodType>('hoje');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  
  // Hook com período dinâmico e realtime
  const { alerts } = usePeriodAlerts(period, customStartDate, customEndDate);
  
  // Hook to get events count per device for the selected period
  const { eventsMap: periodEventsMap } = usePeriodDeviceEvents(period, customStartDate, customEndDate);

  const handlePeriodChange = (newPeriod: PeriodType, customStart?: Date, customEnd?: Date) => {
    setPeriod(newPeriod);
    if (customStart) setCustomStartDate(customStart);
    if (customEnd) setCustomEndDate(customEnd);
  };

  // Atualizar relógio
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Detectar orientação mobile
  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      // Ocultar sidebar em mobile
      if (window.innerWidth < 1024) {
        setShowAlertsSidebar(false);
      }
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Sair com ESPAÇO ou ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Sort devices: 1. Offline first, 2. By period events count (descending)
  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      // 1. Offline devices always first
      if (a.status === 'offline' && b.status !== 'offline') return -1;
      if (a.status !== 'offline' && b.status === 'offline') return 1;
      
      // 2. Among same status, sort by period events count (more events first)
      const eventsA = periodEventsMap.get(a.id) || 0;
      const eventsB = periodEventsMap.get(b.id) || 0;
      return eventsB - eventsA;
    });
  }, [devices, periodEventsMap]);

  // Separar online/offline (usando sortedDevices para manter consistência)
  const onlineDevices = useMemo(() => sortedDevices.filter(d => d.status === 'online'), [sortedDevices]);
  const offlineDevices = useMemo(() => sortedDevices.filter(d => d.status !== 'online'), [sortedDevices]);

  // Grid Dinâmico - Desktop e Mobile
  const gridConfig = useMemo(() => {
    const count = devices.length;
    const isMobile = window.innerWidth < 1024;
    
    if (count === 0) return { cols: 1, compact: false };
    
    // Mobile Portrait
    if (isMobile && isPortrait) {
      if (count <= 2) return { cols: 1, compact: false };
      return { cols: 2, compact: true };
    }
    
    // Mobile Landscape
    if (isMobile && !isPortrait) {
      if (count <= 3) return { cols: 3, compact: false };
      if (count <= 8) return { cols: 4, compact: true };
      return { cols: 5, compact: true };
    }
    
    // Desktop
    if (count <= 2) return { cols: 2, compact: false };
    if (count <= 4) return { cols: 2, compact: false };
    if (count <= 9) return { cols: 3, compact: false };
    if (count <= 16) return { cols: 4, compact: false };
    if (count <= 30) return { cols: 5, compact: true };
    if (count <= 50) return { cols: 6, compact: true };
    return { cols: 7, compact: true };
  }, [devices.length, isPortrait]);

  // Formatar duração em horas/minutos
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const isMobile = window.innerWidth < 1024;

  // Obter label do período para exibição
  const getPeriodLabel = () => {
    switch (period) {
      case 'hoje': return 'Hoje';
      case 'ontem': return 'Ontem';
      case 'esta-semana': return 'Esta Semana';
      case '7dias': return 'Últimos 7 dias';
      case '30dias': return 'Últimos 30 dias';
      case 'personalizado': 
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, 'dd/MM')} - ${format(customEndDate, 'dd/MM')}`;
        }
        return 'Personalizado';
      default: return 'Hoje';
    }
  };

  // Usar createPortal para renderizar fora da hierarquia DOM (esconder sidebar)
  return createPortal(
    <div className="fixed inset-0 w-screen h-screen z-[9999999] overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900" />
      
      {/* Conteúdo principal */}
      <div className="relative z-10 flex h-full">
        
        {/* Área Principal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Header - Responsivo */}
          <header className={cn(
            "shrink-0 flex items-center bg-gradient-to-r from-white/5 to-transparent backdrop-blur-xl border-b border-white/10",
            isMobile ? "px-3 py-2" : "px-8 py-5"
          )}>
            
            {/* Mobile: Layout compacto */}
            {isMobile ? (
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex flex-col">
                  <p className={cn(
                    "font-black tracking-tight tabular-nums bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent",
                    isPortrait ? "text-3xl" : "text-4xl"
                  )}>
                    {format(currentTime, 'HH:mm:ss')}
                  </p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">
                    {format(currentTime, "dd/MM", { locale: ptBR })}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">Online</p>
                  <p className={cn("font-black tabular-nums", isPortrait ? "text-2xl" : "text-3xl")}>
                    <span className="text-green-400">{onlineDevices.length}</span>
                    <span className="text-white/30 mx-1">/</span>
                    <span className="text-white">{devices.length}</span>
                  </p>
                </div>
                
                {/* Botão Alertas Mobile */}
                {alerts.length > 0 && (
                  <button
                    onClick={() => setShowAlertsSidebar(!showAlertsSidebar)}
                    className="relative p-2 bg-red-500/20 rounded-lg border border-red-500/50"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                      {alerts.length}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              /* Desktop: Layout com seletor de período */
              <>
                <div className="flex-1 flex justify-center">
                  <div className="flex flex-col items-center">
                    <p className="text-7xl font-black tracking-tight tabular-nums bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                      {format(currentTime, 'HH:mm:ss')}
                    </p>
                    <p className="mt-2 text-sm text-white/60 font-light tracking-widest uppercase">
                      {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                {/* NOVO: Seletor de Período */}
                <div className="mx-6">
                  <PeriodSelector
                    value={period}
                    onChange={handlePeriodChange}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                  />
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Conectados</p>
                  <p className="text-4xl font-black tabular-nums">
                    <span className="text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                      {onlineDevices.length}
                    </span>
                    <span className="text-white/30 mx-1">/</span>
                    <span className="text-white">{devices.length}</span>
                  </p>
                </div>
              </>
            )}
          </header>
          
          {/* Grid de Cards - Mobile Responsivo */}
          <main className={cn(
            "flex-1 overflow-auto",
            isMobile ? "p-2" : "p-6"
          )}>
            {devices.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className={cn(
                    "font-bold text-white/60 mb-2",
                    isMobile ? "text-xl" : "text-4xl"
                  )}>
                    Nenhum dispositivo
                  </p>
                  <p className={cn(
                    "text-white/40",
                    isMobile ? "text-sm" : "text-xl"
                  )}>
                    Aguardando dados...
                  </p>
                </div>
              </div>
            ) : (
              <div 
                className={cn(
                  "grid auto-rows-fr mx-auto",
                  isMobile ? "gap-2" : "gap-4"
                )}
                style={{ 
                  gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`
                }}
              >
                {sortedDevices.map(device => (
                  <MonitorCard 
                    key={device.id} 
                    device={device} 
                    compact={gridConfig.compact}
                    periodEventsCount={periodEventsMap.get(device.id) || 0}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
        
        {/* Sidebar de Alertas - Sempre visível em Desktop */}
        <aside className="hidden lg:flex w-80 h-full flex-col shrink-0 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-2xl border-l border-white/10">
            <div className="p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
                </div>
                <h3 className="text-white font-bold text-lg">Alertas - {getPeriodLabel()}</h3>
              </div>
              <p className="text-xs text-white/50">
                {alerts.length} {alerts.length === 1 ? 'queda' : 'quedas'}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Wifi className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-white/60 text-sm">Nenhuma queda no período</p>
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div 
                    key={alert.id} 
                    className={cn(
                      "p-4 border-b border-white/5 hover:bg-white/5 transition-colors",
                      index === 0 && "bg-red-500/10 border-l-4 border-l-red-500"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={cn(
                        "w-4 h-4 mt-0.5 shrink-0",
                        index === 0 ? "text-red-400 animate-pulse" : "text-red-400/60"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">
                          📍 {alert.device_name}
                        </p>
                        <p className="text-xs text-purple-400 mt-0.5 truncate font-medium">
                          {alert.provider}
                        </p>
                        <p className="text-xs text-red-400/90 mt-1.5 font-medium">
                          ⏱️ {formatDuration(alert.duration_seconds)} offline
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          {format(new Date(alert.started_at), "HH:mm", { locale: ptBR })} - {alert.ended_at ? format(new Date(alert.ended_at), "HH:mm", { locale: ptBR }) : 'em andamento'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

        {/* Modal Alertas Mobile */}
        {showAlertsSidebar && alerts.length > 0 && (
          <div 
            className="lg:hidden absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowAlertsSidebar(false)}
          >
            <div 
              className="w-full bg-gradient-to-b from-white/10 to-transparent backdrop-blur-2xl border-t border-white/20 rounded-t-3xl max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <h3 className="text-white font-bold">Alertas - {getPeriodLabel()}</h3>
                  </div>
                  <button 
                    onClick={() => setShowAlertsSidebar(false)}
                    className="text-white/50 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {alerts.map((alert, index) => (
                  <div 
                    key={alert.id}
                    className={cn(
                      "p-3 rounded-lg bg-white/5 border border-white/10",
                      index === 0 && "bg-red-500/20 border-red-500/50"
                    )}
                  >
                    <p className="text-sm text-white font-semibold truncate">
                      📍 {alert.device_name}
                    </p>
                    <p className="text-xs text-purple-400 mt-1">
                      {alert.provider}
                    </p>
                    <p className="text-xs text-red-400 mt-1">
                      ⏱️ {formatDuration(alert.duration_seconds)} offline
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      {format(new Date(alert.started_at), "HH:mm", { locale: ptBR })} - {alert.ended_at ? format(new Date(alert.ended_at), "HH:mm", { locale: ptBR }) : 'em andamento'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hint para sair - Oculto no mobile */}
      {!isMobile && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/30 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
          <kbd className="px-2 py-0.5 bg-white/10 rounded mx-1 font-mono text-white/50">ESPAÇO</kbd> ou <kbd className="px-2 py-0.5 bg-white/10 rounded mx-1 font-mono text-white/50">ESC</kbd> para sair
        </div>
      )}
    </div>,
    document.body
  );
};

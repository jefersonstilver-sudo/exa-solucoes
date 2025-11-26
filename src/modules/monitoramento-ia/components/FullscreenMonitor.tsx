import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Device } from '../utils/devices';
import { Badge } from '@/components/ui/badge';

interface FullscreenMonitorProps {
  devices: Device[];
  onClose: () => void;
}

const MonitorCard = ({ device, compact }: { device: Device; compact: boolean }) => {
  const displayName = (device.comments || device.name).split(' - ')[0].trim();
  const provider = device.provider || 'Sem provedor';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getProviderColor = (providerName: string) => {
    const upperProvider = providerName.toUpperCase();
    if (upperProvider.includes('VIVO')) return 'text-purple-400';
    if (upperProvider.includes('LIGGA')) return 'text-orange-400';
    if (upperProvider.includes('TELECOM FOZ')) return 'text-blue-400';
    return 'text-white/90';
  };

  const cardSize = compact ? 'text-sm' : 'text-base';
  const nameSize = compact ? 'text-lg' : 'text-2xl';
  const providerSize = compact ? 'text-sm' : 'text-lg';

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden ${device.status === 'offline' ? 'border-red-500 border-2' : ''}`}>
      <div className="p-4 text-center flex flex-col justify-between h-full">
        <div>
          <div className={`font-bold text-white mb-2 ${nameSize}`}>
            {displayName}
          </div>
          <div className={`font-semibold mb-3 ${providerSize} ${getProviderColor(provider)}`}>
            {provider}
          </div>
          {device.condominio_name && !compact && (
            <div className="text-sm text-gray-400 mb-2">
              {device.condominio_name}
            </div>
          )}
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)} animate-pulse`} />
            <span className={`font-medium text-white ${cardSize}`}>
              {device.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
          {!compact && (
            <Badge variant="secondary" className="text-xs">
              {device.total_events || 0} eventos
            </Badge>
          )}
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
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getGridCols = (count: number) => {
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    if (count <= 25) return 'grid-cols-5';
    return 'grid-cols-6';
  };

  // Filtrar apenas dispositivos online
  const onlineDevices = devices.filter(d => d.status === 'online');

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-black via-gray-900 to-black overflow-auto">
      {/* Header com Data/Hora */}
      <div className="sticky top-0 bg-black/50 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="px-8 py-6 flex justify-between items-center">
          <div className="text-white">
            <p className="text-5xl font-bold tabular-nums tracking-tight">
              {format(currentTime, 'HH:mm:ss')}
            </p>
            <p className="text-xl mt-1 text-gray-300">
              {format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-400">Painéis Conectados</p>
              <p className="text-3xl font-bold text-green-400">
                {onlineDevices.length} / {devices.length}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 bg-red-500 hover:bg-red-600 rounded-xl transition-colors group"
              title="Fechar (ESC)"
            >
              <X className="w-8 h-8 text-white group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className={`p-8 grid ${getGridCols(onlineDevices.length)} gap-6 auto-rows-fr`}>
        {onlineDevices.map(device => (
          <MonitorCard 
            key={device.id} 
            device={device} 
            compact={onlineDevices.length > 9} 
          />
        ))}
      </div>

      {/* Mensagem se não houver dispositivos online */}
      {onlineDevices.length === 0 && (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-400 mb-4">
              Nenhum painel online no momento
            </p>
            <p className="text-xl text-gray-500">
              Aguardando conexões...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OfflineDevice {
  id: string;
  name: string;
  comments: string;
  timestamp: string;
}

export const useOfflineAlerts = () => {
  const [offlineDevices, setOfflineDevices] = useState<OfflineDevice[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousOfflineIds = useRef<Set<string>>(new Set());

  // Inicializar áudio de alerta
  useEffect(() => {
    // Criar áudio de beep usando Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const createBeep = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequência do beep
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    audioRef.current = { play: createBeep } as any;
  }, []);

  // Monitorar dispositivos offline em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('device-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
        },
        (payload) => {
          const device = payload.new as any;
          
          // Detectar quando dispositivo fica offline
          if (device && device.status === 'offline') {
            const deviceId = device.id;
            
            // Se não estava offline antes, é uma nova queda
            if (!previousOfflineIds.current.has(deviceId)) {
              const deviceInfo: OfflineDevice = {
                id: deviceId,
                name: (device.comments || device.name || '').split(' - ')[0].trim(),
                comments: device.comments || device.name || 'Dispositivo',
                timestamp: new Date().toISOString(),
              };

              setOfflineDevices(prev => [...prev, deviceInfo]);
              setActiveAlerts(prev => new Set([...prev, deviceId]));
              previousOfflineIds.current.add(deviceId);

              // Tocar som de alerta
              if (audioRef.current) {
                try {
                  (audioRef.current as any).play();
                } catch (error) {
                  console.error('Erro ao tocar áudio:', error);
                }
              }

              // Mostrar toast de alerta
              toast.error(`⚠️ ${deviceInfo.name} ficou OFFLINE`, {
                duration: 5000,
                className: 'bg-red-50 border-red-200',
              });
            }
          }
          
          // Remover da lista quando voltar online
          if (device && device.status === 'online') {
            const deviceId = device.id;
            previousOfflineIds.current.delete(deviceId);
            setOfflineDevices(prev => prev.filter(d => d.id !== deviceId));
            setActiveAlerts(prev => {
              const newSet = new Set(prev);
              newSet.delete(deviceId);
              return newSet;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Buscar dispositivos offline iniciais
  useEffect(() => {
    const fetchOfflineDevices = async () => {
      const { data } = await supabase
        .from('devices')
        .select('id, name, comments, status')
        .eq('status', 'offline');

      if (data) {
        const offlineIds = new Set(data.map(d => d.id));
        previousOfflineIds.current = offlineIds;
        
        const devices: OfflineDevice[] = data.map(d => ({
          id: d.id,
          name: (d.comments || d.name || '').split(' - ')[0].trim(),
          comments: d.comments || d.name || 'Dispositivo',
          timestamp: new Date().toISOString(),
        }));
        
        setOfflineDevices(devices);
      }
    };

    fetchOfflineDevices();
  }, []);

  const dismissAlert = (deviceId: string) => {
    setActiveAlerts(prev => {
      const newSet = new Set(prev);
      newSet.delete(deviceId);
      return newSet;
    });
  };

  return {
    offlineDevices,
    activeAlerts: Array.from(activeAlerts),
    dismissAlert,
    totalOffline: offlineDevices.length,
  };
};

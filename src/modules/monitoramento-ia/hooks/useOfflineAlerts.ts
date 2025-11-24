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
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousOfflineIds = useRef<Set<string>>(new Set());
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Inicializar áudio de alerta com interação do usuário
  useEffect(() => {
    const initAudio = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        setAudioEnabled(true);
        console.log('🔊 Áudio de alertas inicializado');
      } catch (error) {
        console.error('❌ Erro ao inicializar áudio:', error);
      }
    };

    // Tentar inicializar com interação do usuário
    const handleUserInteraction = () => {
      if (!audioContextRef.current) {
        initAudio();
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      }
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  const playBeep = () => {
    if (!audioContextRef.current) {
      console.warn('⚠️ AudioContext não inicializado');
      return;
    }

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      const now = audioContextRef.current.currentTime;
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      oscillator.start(now);
      oscillator.stop(now + 0.5);
      
      console.log('🔊 Beep tocado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao tocar beep:', error);
    }
  };

  // Monitorar dispositivos offline em tempo real
  useEffect(() => {
    console.log('📡 Iniciando monitoramento realtime de devices...');
    
    const channel = supabase
      .channel('device-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
        },
        (payload) => {
          console.log('🔄 Mudança detectada na tabela devices:', payload);
          const device = payload.new as any;
          const oldDevice = payload.old as any;
          
          // Detectar quando dispositivo fica offline
          if (device && device.status === 'offline' && oldDevice?.status !== 'offline') {
            const deviceId = device.id;
            console.log('🔴 Dispositivo ficou OFFLINE:', deviceId, device.name);
            
            const deviceInfo: OfflineDevice = {
              id: deviceId,
              name: (device.comments || device.name || '').split(' - ')[0].trim(),
              comments: device.comments || device.name || 'Dispositivo',
              timestamp: new Date().toISOString(),
            };

            setOfflineDevices(prev => {
              if (prev.find(d => d.id === deviceId)) return prev;
              console.log('➕ Adicionando device offline:', deviceInfo.name);
              return [...prev, deviceInfo];
            });
            
            setActiveAlerts(prev => new Set([...prev, deviceId]));
            previousOfflineIds.current.add(deviceId);

            // Tocar som de alerta
            playBeep();

            // Mostrar toast de alerta
            toast.error(`⚠️ ${deviceInfo.name} ficou OFFLINE`, {
              duration: 5000,
              className: 'bg-red-50 border-red-200',
            });
          }
          
          // Remover da lista quando voltar online
          if (device && device.status === 'online' && oldDevice?.status !== 'online') {
            const deviceId = device.id;
            console.log('🟢 Dispositivo voltou ONLINE:', deviceId, device.name);
            
            previousOfflineIds.current.delete(deviceId);
            setOfflineDevices(prev => prev.filter(d => d.id !== deviceId));
            setActiveAlerts(prev => {
              const newSet = new Set(prev);
              newSet.delete(deviceId);
              return newSet;
            });
            
            toast.success(`✅ ${device.name} voltou ONLINE`, {
              duration: 3000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status do canal realtime:', status);
      });

    return () => {
      console.log('📡 Fechando canal realtime');
      supabase.removeChannel(channel);
    };
  }, []);

  // Buscar dispositivos offline iniciais
  useEffect(() => {
    const fetchOfflineDevices = async () => {
      console.log('🔍 Buscando dispositivos offline iniciais...');
      const { data, error } = await supabase
        .from('devices')
        .select('id, name, comments, status')
        .eq('status', 'offline');

      if (error) {
        console.error('❌ Erro ao buscar devices offline:', error);
        return;
      }

      if (data) {
        console.log(`📊 Encontrados ${data.length} dispositivos offline`);
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
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchOfflineDevices, 30000);
    return () => clearInterval(interval);
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

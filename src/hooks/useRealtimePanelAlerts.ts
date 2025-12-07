import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Device {
  id: string;
  name: string;
  status: string;
  condominio_name?: string;
  last_online_at?: string;
}

/**
 * Hook que escuta mudanças em tempo real na tabela devices
 * e exibe toasts quando um painel fica offline/online
 */
export const useRealtimePanelAlerts = () => {
  const previousStatusRef = useRef<Map<string, string>>(new Map());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // Load initial device statuses
    const loadInitialStatuses = async () => {
      const { data: devices } = await supabase
        .from('devices')
        .select('id, name, status, condominio_name')
        .eq('is_active', true);

      if (devices) {
        devices.forEach((device: Device) => {
          previousStatusRef.current.set(device.id, device.status);
        });
      }
      initialLoadDone.current = true;
      console.log('🔔 [REALTIME] Status inicial dos devices carregado:', previousStatusRef.current.size);
    };

    loadInitialStatuses();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('device-status-monitor')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
        },
        (payload) => {
          if (!initialLoadDone.current) return;

          const newDevice = payload.new as Device;
          const previousStatus = previousStatusRef.current.get(newDevice.id);

          console.log(`🔔 [REALTIME] Device ${newDevice.name}: ${previousStatus} → ${newDevice.status}`);

          // Detect status change
          if (previousStatus && previousStatus !== newDevice.status) {
            const deviceName = newDevice.condominio_name || newDevice.name;

            if (newDevice.status === 'offline' && previousStatus === 'online') {
              // Went offline
              toast.error(`🔴 ${deviceName} ficou OFFLINE`, {
                description: 'Verifique a conexão do painel',
                duration: 10000,
                action: {
                  label: 'Ver Painéis',
                  onClick: () => window.location.href = '/super_admin/paineis-exa',
                },
              });
            } else if (newDevice.status === 'online' && previousStatus === 'offline') {
              // Came back online
              toast.success(`🟢 ${deviceName} voltou ONLINE`, {
                description: 'Conexão restabelecida',
                duration: 5000,
              });
            }
          }

          // Update previous status
          previousStatusRef.current.set(newDevice.id, newDevice.status);
        }
      )
      .subscribe((status) => {
        console.log('🔔 [REALTIME] Subscription status:', status);
      });

    return () => {
      console.log('🔔 [REALTIME] Desconectando do canal de alertas');
      supabase.removeChannel(channel);
    };
  }, []);
};

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface PanelAlert {
  id: string;
  device_id: string;
  alert_type: 'offline' | 'online';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata: any;
  resolved: boolean;
  created_at: string;
}

interface NotificationPreferences {
  panel_alerts_enabled: boolean;
  panel_alerts_sound: boolean;
  panel_alerts_volume: number;
}

/**
 * GlobalNotificationProvider - Provider de notificações que funciona em QUALQUER página do app
 * Escuta realtime de panel_alerts e exibe toasts com som
 */
export const GlobalNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin, isLoggedIn, user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    panel_alerts_enabled: true,
    panel_alerts_sound: true,
    panel_alerts_volume: 0.5,
  });
  const [notifiedAlerts, setNotifiedAlerts] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Carregar preferências do usuário
  useEffect(() => {
    if (!isLoggedIn || !user || !isSuperAdmin) return;

    const loadPreferences = async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences({
          panel_alerts_enabled: data.panel_alerts_enabled,
          panel_alerts_sound: data.panel_alerts_sound,
          panel_alerts_volume: data.panel_alerts_volume,
        });
      }
    };

    loadPreferences();
  }, [isLoggedIn, user, isSuperAdmin]);

  // Criar elemento de áudio para beep
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = preferences.panel_alerts_volume;
  }, [preferences.panel_alerts_volume]);

  useEffect(() => {
    // Só ativar para super admins logados E com notificações habilitadas
    if (!isLoggedIn || !isSuperAdmin || !preferences.panel_alerts_enabled) {
      return;
    }

    console.log('🔔 [GlobalNotifications] Ativando monitoramento global de alertas');

    // Buscar alertas não resolvidos existentes - FILTRAR por dispositivos que ainda estão offline
    const fetchExistingAlerts = async () => {
      // Primeiro buscar dispositivos online para filtrar alertas órfãos
      const { data: onlineDevices } = await supabase
        .from('devices')
        .select('id')
        .eq('status', 'online');
      
      const onlineDeviceIds = new Set(onlineDevices?.map(d => d.id) || []);

      const { data: existingAlerts } = await supabase
        .from('panel_alerts')
        .select('*')
        .eq('resolved', false)
        .eq('alert_type', 'offline')
        .order('created_at', { ascending: false })
        .limit(10);

      if (existingAlerts && existingAlerts.length > 0) {
        // Filtrar alertas de dispositivos que JÁ estão online (alertas órfãos)
        const realOfflineAlerts = existingAlerts.filter(a => !onlineDeviceIds.has(a.device_id));
        
        // Auto-resolver alertas órfãos silenciosamente
        const orphanAlerts = existingAlerts.filter(a => onlineDeviceIds.has(a.device_id));
        if (orphanAlerts.length > 0) {
          console.log(`🧹 [GlobalNotifications] Resolvendo ${orphanAlerts.length} alertas órfãos`);
          await supabase
            .from('panel_alerts')
            .update({ resolved: true, resolved_at: new Date().toISOString() })
            .in('id', orphanAlerts.map(a => a.id));
        }

        // Só notificar sobre alertas reais (dispositivos ainda offline)
        if (realOfflineAlerts.length > 0) {
          console.log(`⚠️ [GlobalNotifications] ${realOfflineAlerts.length} painéis realmente offline`);
          
          const deviceNames = realOfflineAlerts
            .map(a => (a.metadata as any)?.device_name || 'Painel')
            .join(', ');
          
          toast.error(`${realOfflineAlerts.length} painel(is) offline`, {
            description: deviceNames,
            duration: 10000,
            icon: <AlertTriangle className="h-5 w-5" />,
          });

          if (preferences.panel_alerts_sound && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }

          realOfflineAlerts.forEach(alert => notifiedAlerts.add(alert.id));
          setNotifiedAlerts(new Set(notifiedAlerts));
        }
      }
    };

    fetchExistingAlerts();

    // Configurar realtime subscription para novos alertas
    const channel = supabase
      .channel('global_panel_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'panel_alerts',
        },
        (payload) => {
          const alert = payload.new as PanelAlert;
          
          // Evitar notificações duplicadas
          if (notifiedAlerts.has(alert.id)) {
            return;
          }

          console.log('🆕 [GlobalNotifications] Novo alerta recebido:', alert);

          const metadata = alert.metadata as any;
          const deviceName = metadata?.device_name || metadata?.anydesk_id || 'Painel';

          // Alertas de painéis offline/online
          if (alert.alert_type === 'offline') {
            toast.error(`🔴 Painel OFFLINE: ${deviceName}`, {
              description: alert.message,
              duration: 15000,
              icon: <AlertTriangle className="h-5 w-5" />,
              action: {
                label: 'Ver Painéis',
                onClick: () => {
                  window.location.href = '/admin/monitoramento-ia/paineis';
                },
              },
            });

            if (preferences.panel_alerts_sound && audioRef.current) {
              audioRef.current.volume = preferences.panel_alerts_volume;
              audioRef.current.play().catch(() => {
                console.log('🔇 [GlobalNotifications] Não foi possível tocar som de alerta');
              });
            }
          } else if (alert.alert_type === 'online') {
            toast.success(`🟢 Painel voltou online: ${deviceName}`, {
              description: 'Sistema recuperado com sucesso',
              duration: 5000,
              icon: <CheckCircle className="h-5 w-5" />,
            });
          }
          
          // Alertas de desconexão Z-API
          else if (alert.alert_type === 'zapi_disconnected') {
            const agentName = alert.message.replace('Z-API desconectado: ', '');
            toast.error(`⚠️ Z-API: ${agentName} desconectou`, {
              description: `Desconectado às ${new Date(metadata?.timestamp || alert.created_at).toLocaleTimeString('pt-BR')}`,
              duration: 15000,
              icon: <AlertTriangle className="h-5 w-5" />,
              action: {
                label: 'Ver Logs',
                onClick: () => {
                  window.location.href = '/admin/monitoramento-ia/agentes';
                },
              },
            });

            if (preferences.panel_alerts_sound && audioRef.current) {
              audioRef.current.volume = preferences.panel_alerts_volume;
              audioRef.current.play().catch(() => {
                console.log('🔇 [GlobalNotifications] Não foi possível tocar som');
              });
            }
          }

          // Marcar como notificado
          setNotifiedAlerts(prev => new Set(prev).add(alert.id));
        }
      )
      .subscribe((status) => {
        console.log('🔌 [GlobalNotifications] Status do canal Realtime:', status);
      });

    // Cleanup
    return () => {
      console.log('🔌 [GlobalNotifications] Desconectando do monitoramento global');
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, isSuperAdmin, preferences.panel_alerts_enabled, preferences.panel_alerts_sound, preferences.panel_alerts_volume]);

  return <>{children}</>;
};

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

    // Buscar alertas não resolvidos existentes (apenas na inicialização)
    const fetchExistingAlerts = async () => {
      const { data: existingAlerts } = await supabase
        .from('panel_alerts')
        .select('*')
        .eq('resolved', false)
        .eq('alert_type', 'offline')
        .order('created_at', { ascending: false })
        .limit(5);

      if (existingAlerts && existingAlerts.length > 0) {
        console.log(`⚠️ [GlobalNotifications] ${existingAlerts.length} painéis offline detectados`);
        
        // Mostrar apenas um toast resumido
        const deviceNames = existingAlerts
          .map(a => (a.metadata as any)?.device_name || 'Painel')
          .join(', ');
        
        toast.error(`${existingAlerts.length} painel(is) offline detectado(s)`, {
          description: deviceNames,
          duration: 10000,
          icon: <AlertTriangle className="h-5 w-5" />,
        });

        // Tocar som se habilitado
        if (preferences.panel_alerts_sound && audioRef.current) {
          audioRef.current.play().catch(() => {
            console.log('🔇 [GlobalNotifications] Não foi possível tocar som');
          });
        }

        // Marcar todos como notificados
        existingAlerts.forEach(alert => {
          notifiedAlerts.add(alert.id);
        });
        setNotifiedAlerts(new Set(notifiedAlerts));
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

          if (alert.alert_type === 'offline') {
            // Painel ficou offline
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

            // Tocar som de alerta se habilitado
            if (preferences.panel_alerts_sound && audioRef.current) {
              audioRef.current.volume = preferences.panel_alerts_volume;
              audioRef.current.play().catch(() => {
                console.log('🔇 [GlobalNotifications] Não foi possível tocar som de alerta');
              });
            }
          } else if (alert.alert_type === 'online') {
            // Painel voltou online
            toast.success(`🟢 Painel voltou online: ${deviceName}`, {
              description: 'Sistema recuperado com sucesso',
              duration: 5000,
              icon: <CheckCircle className="h-5 w-5" />,
            });
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

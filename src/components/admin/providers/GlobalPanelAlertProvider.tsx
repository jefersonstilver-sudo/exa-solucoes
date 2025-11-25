import React, { useEffect, useState } from 'react';
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

export const GlobalPanelAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin, isLoggedIn } = useAuth();
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);
  const [notifiedAlerts, setNotifiedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Só ativar para super admins logados
    if (!isLoggedIn || !isSuperAdmin) {
      return;
    }

    console.log('🔔 [GlobalAlerts] Ativando monitoramento de alertas para super admin');

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
        console.log(`⚠️ [GlobalAlerts] ${existingAlerts.length} painéis offline detectados`);
        
        // Mostrar apenas um toast resumido
        const deviceNames = existingAlerts
          .map(a => (a.metadata as any)?.device_name || 'Painel')
          .join(', ');
        
        toast.error(`${existingAlerts.length} painel(is) offline detectado(s)`, {
          description: deviceNames,
          duration: 10000,
          icon: <AlertTriangle className="h-5 w-5" />,
        });

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
      .channel('panel_alerts_monitor')
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

          console.log('🆕 [GlobalAlerts] Novo alerta recebido:', alert);

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

            // Tocar som de alerta (opcional)
            try {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {
                console.log('🔇 [GlobalAlerts] Não foi possível tocar som de alerta');
              });
            } catch (e) {
              // Silencioso se não houver suporte
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
        console.log('🔌 [GlobalAlerts] Status do canal Realtime:', status);
      });

    // Cleanup
    return () => {
      console.log('🔌 [GlobalAlerts] Desconectando do monitoramento de alertas');
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, isSuperAdmin]);

  return <>{children}</>;
};

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ZAPIAlert {
  id: string;
  agent_key: string;
  display_name: string;
  instance_id: string;
  timestamp: string;
}

export const ZAPIDisconnectAlert: React.FC = () => {
  const [alerts, setAlerts] = useState<ZAPIAlert[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Inscrever em alertas de desconexão Z-API
    const channel = supabase
      .channel('zapi_disconnect_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'panel_alerts',
          filter: 'alert_type=eq.zapi_disconnected',
        },
        (payload) => {
          const alert = payload.new as any;
          const details = alert.details;

          if (details && !alert.resolved) {
            const newAlert: ZAPIAlert = {
              id: alert.id,
              agent_key: details.agent_key,
              display_name: alert.message.replace('Z-API desconectado: ', ''),
              instance_id: details.instance_id,
              timestamp: details.timestamp,
            };

            setAlerts((prev) => {
              // Evitar duplicatas
              if (prev.find((a) => a.id === newAlert.id)) {
                return prev;
              }
              return [newAlert, ...prev].slice(0, 3); // Máximo 3 alertas
            });

            // Auto-remover após 15 segundos
            setTimeout(() => {
              dismissAlert(newAlert.id);
            }, 15000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleViewLogs = () => {
    navigate('/admin/monitoramento-ia/agentes');
    setAlerts([]);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-destructive/10 border border-destructive/30 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg min-w-[400px]"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Agente {alert.display_name} desconectou
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    às {new Date(alert.timestamp).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleViewLogs}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Ver Logs
                  </button>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

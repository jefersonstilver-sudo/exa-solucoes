import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ZAPIStatus {
  status: 'connected' | 'disconnected' | 'pending';
  last_check: string;
  phone?: string;
}

export const useZAPIRealtimeMonitor = () => {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, ZAPIStatus>>({});

  const checkAllAgents = useCallback(async () => {
    try {
      const { data: agents } = await supabase
        .from('agents')
        .select('key, display_name, zapi_config')
        .eq('whatsapp_provider', 'zapi')
        .eq('is_active', true);

      if (agents) {
        // Verificar status real de cada agente via API do Z-API
        const statusPromises = agents.map(async (agent) => {
          const zapiConfig = agent.zapi_config as any;
          if (!zapiConfig?.instance_id) {
            return {
              key: agent.key,
              status: {
                status: 'pending' as const,
                last_check: new Date().toISOString(),
              }
            };
          }

          try {
            // Chamar edge function para verificar status real
            const { data: statusData, error } = await supabase.functions.invoke('check-zapi-status', {
              body: { instanceId: zapiConfig.instance_id }
            });

            if (error) throw error;

            return {
              key: agent.key,
              status: {
                status: statusData?.status?.connected ? 'connected' as const : 'disconnected' as const,
                last_check: new Date().toISOString(),
                phone: statusData?.status?.phone,
              }
            };
          } catch (error) {
            console.error(`[useZAPIRealtimeMonitor] Erro ao verificar ${agent.key}:`, error);
            return {
              key: agent.key,
              status: {
                status: 'disconnected' as const,
                last_check: new Date().toISOString(),
              }
            };
          }
        });

        const results = await Promise.all(statusPromises);
        const statuses: Record<string, ZAPIStatus> = {};
        
        results.forEach(({ key, status }) => {
          statuses[key] = status;
        });

        setAgentStatuses(statuses);
      }
    } catch (error) {
      console.error('[useZAPIRealtimeMonitor] Erro ao verificar agentes:', error);
    }
  }, []);

  useEffect(() => {
    // Subscription realtime para mudanças em agents.zapi_config
    const agentsChannel = supabase
      .channel('zapi_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: 'whatsapp_provider=eq.zapi',
        },
        (payload) => {
          const agent = payload.new as any;
          const zapiConfig = agent.zapi_config as any;
          
          if (zapiConfig) {
            const newStatus: ZAPIStatus = {
              status: zapiConfig.status || 'pending',
              last_check: zapiConfig.last_check || new Date().toISOString(),
              phone: zapiConfig.phone,
            };

            setAgentStatuses((prev) => {
              const previousStatus = prev[agent.key];
              
              // Notificação de desconexão
              if (zapiConfig.status === 'disconnected') {
                toast.error(`⚠️ ${agent.display_name} desconectou`, {
                  description: `Conexão perdida às ${new Date(zapiConfig.last_check).toLocaleTimeString('pt-BR')}`,
                  duration: 10000,
                });
              }

              // Notificação de reconexão
              if (zapiConfig.status === 'connected' && previousStatus?.status === 'disconnected') {
                toast.success(`✅ ${agent.display_name} reconectou`, {
                  description: 'Sistema normalizado',
                  duration: 5000,
                });
              }

              return {
                ...prev,
                [agent.key]: newStatus,
              };
            });
          }
        }
      )
      .subscribe();

    // Subscription para novos logs de conexão
    const logsChannel = supabase
      .channel('zapi_connection_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'zapi_connection_logs',
        },
        () => {
          // Atualizar statuses quando houver novo log
          checkAllAgents();
        }
      )
      .subscribe();

    // Verificação periódica a cada 30 segundos
    const interval = setInterval(() => {
      checkAllAgents();
    }, 30000);

    // Verificação inicial
    checkAllAgents();

    return () => {
      supabase.removeChannel(agentsChannel);
      supabase.removeChannel(logsChannel);
      clearInterval(interval);
    };
  }, [checkAllAgents]);

  return { agentStatuses, refreshStatuses: checkAllAgents };
};

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ZAPIStatus {
  status: 'connected' | 'disconnected' | 'pending';
  last_check: string;
  phone?: string;
}

export const useZAPIRealtimeMonitor = () => {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, ZAPIStatus>>({});

  useEffect(() => {
    // Inscrever no realtime para mudanças em agents.zapi_config
    const channel = supabase
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

            setAgentStatuses((prev) => ({
              ...prev,
              [agent.key]: newStatus,
            }));

            // Notificação de desconexão
            if (zapiConfig.status === 'disconnected') {
              toast.error(`⚠️ ${agent.display_name} desconectou`, {
                description: `Conexão perdida às ${new Date(zapiConfig.last_check).toLocaleTimeString('pt-BR')}`,
                duration: 10000,
              });
            }

            // Notificação de reconexão
            const previousAgentStatus = agentStatuses[agent.key];
            if (zapiConfig.status === 'connected' && previousAgentStatus?.status === 'disconnected') {
              toast.success(`✅ ${agent.display_name} reconectou`, {
                description: 'Sistema normalizado',
                duration: 5000,
              });
            }
          }
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
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const checkAllAgents = async () => {
    try {
      const { data: agents } = await supabase
        .from('agents')
        .select('key, display_name, zapi_config')
        .eq('whatsapp_provider', 'zapi')
        .eq('is_active', true);

      if (agents) {
        const statuses: Record<string, ZAPIStatus> = {};
        
        agents.forEach((agent) => {
          const zapiConfig = agent.zapi_config as any;
          if (zapiConfig) {
            statuses[agent.key] = {
              status: zapiConfig.status || 'pending',
              last_check: zapiConfig.last_check || new Date().toISOString(),
              phone: zapiConfig.phone,
            };
          }
        });

        setAgentStatuses(statuses);
      }
    } catch (error) {
      console.error('[useZAPIRealtimeMonitor] Erro ao verificar agentes:', error);
    }
  };

  return { agentStatuses, refreshStatuses: checkAllAgents };
};

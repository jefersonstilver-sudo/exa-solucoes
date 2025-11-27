import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgentStatus {
  agentKey: string;
  displayName: string;
  status: 'online' | 'offline' | 'pending';
  provider: 'zapi' | 'manychat' | 'none';
  lastCheck: string | null;
  errorMessage?: string;
  latency?: number;
  credentialsPresent?: boolean;
  instanceStatus?: string;
  instanceId?: string;
  phone?: string;
}

export const useAgentStatus = () => {
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const testAgent = async (agentKey: string, displayName: string) => {
    setTesting(prev => ({ ...prev, [agentKey]: true }));
    
    try {
      console.log('🔍 [DEBUG] Testando agente:', { agentKey, displayName });
      
      const startTime = Date.now();
      
      // Verificar sessão do usuário
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 [DEBUG] Sessão:', session ? 'Ativa' : 'Inativa');
      
      console.log('📤 [DEBUG] Invocando edge function test-agent-status...');
      const { data, error } = await supabase.functions.invoke('test-agent-status', {
        body: { agentKey }
      });

      const latency = Date.now() - startTime;
      console.log('📥 [DEBUG] Resposta recebida:', { data, error, latency });

      if (error) throw error;

      const success = data?.success !== false;

      setStatuses(prev => ({
        ...prev,
        [agentKey]: {
          agentKey,
          displayName,
          status: data?.status || 'pending',
          provider: data?.provider || 'none',
          lastCheck: new Date().toISOString(),
          latency: data?.latency || latency,
          errorMessage: data?.message,
          credentialsPresent: data?.credentialsPresent,
          instanceStatus: data?.instanceStatus,
          instanceId: data?.instanceId,
          phone: data?.phone
        }
      }));

      if (!success && data?.credentialsPresent === false) {
        toast.warning(`${displayName}: Credenciais não configuradas`);
      } else if (!success) {
        toast.error(`${displayName}: ${data?.message || 'Erro na conexão'}`);
      } else {
        toast.success(`${displayName}: Conexão OK`);
      }

      return { success, latency, data };
    } catch (error: any) {
      setStatuses(prev => ({
        ...prev,
        [agentKey]: {
          agentKey,
          displayName,
          status: 'offline',
          provider: 'none',
          lastCheck: new Date().toISOString(),
          errorMessage: error.message,
          credentialsPresent: false
        }
      }));

      toast.error(`${displayName}: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setTesting(prev => ({ ...prev, [agentKey]: false }));
    }
  };

  const testAllAgents = async (agents: Array<{ key: string; display_name: string; is_active: boolean }>) => {
    const activeAgents = agents.filter(a => a.is_active);
    
    if (activeAgents.length === 0) {
      toast.info('Nenhum agente ativo para testar');
      return;
    }

    toast.info('Testando todos os agentes ativos...');
    
    await Promise.all(
      activeAgents.map(agent => testAgent(agent.key, agent.display_name))
    );

    toast.success('Testes de agentes concluídos');
  };

  return {
    statuses,
    testing,
    testAgent,
    testAllAgents
  };
};

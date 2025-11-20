import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Agent {
  id: string;
  key: string;
  display_name: string;
  description: string;
  type: 'ai' | 'human' | 'notification';
  whatsapp_number: string | null;
  whatsapp_provider: string | null;
  zapi_config: any;
  openai_config: any;
  manychat_connected: boolean;
  manychat_config: any;
  routing_rules: any[];
  kb_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAgentConfig = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;
      
      setAgents((data || []) as Agent[]);
    } catch (err: any) {
      setError(err.message);
      toast.error('Erro ao carregar agentes');
      console.error('[useAgentConfig] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAgent = async (key: string, updates: Partial<Agent>) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update(updates)
        .eq('key', key);

      if (error) throw error;
      
      await fetchAgents();
      toast.success('Agente atualizado com sucesso');
    } catch (err: any) {
      toast.error('Erro ao atualizar agente');
      console.error('[useAgentConfig] Update error:', err);
      throw err;
    }
  };

  const toggleAgentStatus = async (key: string) => {
    const agent = agents.find(a => a.key === key);
    if (!agent) return;

    await updateAgent(key, { is_active: !agent.is_active });
  };

  const getAgentByKey = (key: string) => {
    return agents.find(a => a.key === key);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return {
    agents,
    loading,
    error,
    fetchAgents,
    updateAgent,
    toggleAgentStatus,
    getAgentByKey
  };
};

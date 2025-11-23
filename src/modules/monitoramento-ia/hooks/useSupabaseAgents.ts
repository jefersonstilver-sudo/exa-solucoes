import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Agent, AgentFormData } from '../types/multiAgentTypes';
import { toast } from 'sonner';

export const useSupabaseAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedAgents: Agent[] = await Promise.all((data || []).map(async (agent: any) => {
        // Fetch agent sections
        const { data: sectionsData } = await supabase
          .from('agent_sections')
          .select('*')
          .eq('agent_id', agent.id)
          .order('section_number');

        // Fetch agent knowledge items
        const { data: knowledgeData } = await supabase
          .from('agent_knowledge_items')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('active', true);

        return {
          id: agent.id,
          key: agent.key,
          name: agent.display_name,
          type: agent.type as any,
          avatar: '',
          description: agent.description,
          phoneNumber: agent.whatsapp_number || '',
          provider: agent.whatsapp_provider === 'manychat' ? 'manychat' : (agent.whatsapp_provider === 'zapi' ? 'string' : 'none'),
          whatsappProvider: agent.whatsapp_provider,
          whatsappNumber: agent.whatsapp_number,
          zapiConfig: agent.zapi_config,
          status: agent.is_active ? 'active' : 'inactive',
          createdAt: agent.created_at,
          updatedAt: agent.updated_at,
          config: agent.openai_config || {
            model: 'EXA Virtual Assistant',
            temperature: 0.7,
            maxTokens: 2000,
            tone: 'friendly',
            creativity: 'medium',
            formality: 'medium',
          },
          prompt: {
            masterPrompt: agent.openai_config?.system_prompt || '',
            conditionalInstructions: [],
            forbiddenWords: [],
          },
          knowledge: [],
          sections: sectionsData || [],
          knowledgeItems: (knowledgeData || []).map((item: any) => ({
            id: item.id,
            agent_id: item.agent_id,
            title: item.title,
            description: item.description,
            content: item.content,
            content_type: item.content_type as 'text' | 'pdf' | 'link',
            keywords: item.keywords || [],
            instruction: item.instruction,
            active: item.active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
        rules: agent.routing_rules || [],
        integrationSettings: {
          manychat: agent.manychat_config,
          zapi: agent.zapi_config,
        },
      };}));

      setAgents(mappedAgents);
    } catch (error) {
      console.error('Erro ao buscar agentes:', error);
      toast.error('Erro ao carregar agentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const getAgentById = (id: string): Agent | undefined => {
    return agents.find(agent => agent.id === id);
  };

  const createAgent = async (data: AgentFormData): Promise<Agent | undefined> => {
    try {
      const key = data.name.toLowerCase().replace(/\s+/g, '_');
      const { data: newAgent, error } = await supabase
        .from('agents')
        .insert({
          key,
          display_name: data.name,
          type: data.type,
          description: data.description,
          whatsapp_number: data.phoneNumber,
          whatsapp_provider: data.provider === 'manychat' ? 'manychat' : (data.provider === 'string' ? 'zapi' : 'none'),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Agente ${data.name} criado com sucesso!`);
      await fetchAgents();
      return getAgentById(newAgent.id);
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      toast.error('Erro ao criar agente');
      return undefined;
    }
  };

  const updateAgent = async (id: string, updates: Partial<Agent>): Promise<void> => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name) updateData.display_name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.whatsappNumber) updateData.whatsapp_number = updates.whatsappNumber;
      if (updates.whatsappProvider) updateData.whatsapp_provider = updates.whatsappProvider;
      if (updates.zapiConfig) updateData.zapi_config = updates.zapiConfig;
      if (updates.config) updateData.openai_config = updates.config;
      if (updates.prompt?.masterPrompt) {
        updateData.openai_config = {
          ...(updateData.openai_config || {}),
          system_prompt: updates.prompt.masterPrompt,
        };
      }

      const { error } = await supabase
        .from('agents')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Agente atualizado com sucesso!');
      await fetchAgents();
    } catch (error) {
      console.error('Erro ao atualizar agente:', error);
      toast.error('Erro ao atualizar agente');
    }
  };

  const deleteAgent = async (id: string): Promise<void> => {
    try {
      const agent = getAgentById(id);
      if (!agent) return;

      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(`Agente ${agent.name} excluído com sucesso!`);
      await fetchAgents();
    } catch (error) {
      console.error('Erro ao excluir agente:', error);
      toast.error('Erro ao excluir agente');
    }
  };

  const duplicateAgent = async (id: string): Promise<Agent | undefined> => {
    try {
      const agent = getAgentById(id);
      if (!agent) return undefined;

      const { data: duplicated, error } = await supabase
        .from('agents')
        .insert({
          key: `${agent.key}_copy_${Date.now()}`,
          display_name: `Cópia de ${agent.name}`,
          type: agent.type,
          description: agent.description,
          whatsapp_number: agent.whatsappNumber,
          whatsapp_provider: agent.whatsappProvider,
          zapi_config: agent.zapiConfig,
          openai_config: agent.config,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Agente duplicado com sucesso!');
      await fetchAgents();
      return getAgentById(duplicated.id);
    } catch (error) {
      console.error('Erro ao duplicar agente:', error);
      toast.error('Erro ao duplicar agente');
      return undefined;
    }
  };

  return {
    agents,
    loading,
    getAgentById,
    createAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
    refetch: fetchAgents,
  };
};

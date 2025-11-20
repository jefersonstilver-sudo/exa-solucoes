import { useState, useEffect } from 'react';
import type { Agent, AgentFormData } from '../types/multiAgentTypes';
import agentsData from '../data/agents.json';
import { toast } from 'sonner';

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    setAgents(agentsData.agents as Agent[]);
  }, []);

  const getAgentById = (id: string): Agent | undefined => {
    return agents.find(agent => agent.id === id);
  };

  const createAgent = (data: AgentFormData): Agent => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      ...data,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: {
        model: 'EXA Virtual Assistant',
        temperature: 0.7,
        maxTokens: 2000,
        tone: 'friendly',
        creativity: 'medium',
        formality: 'medium',
      },
      prompt: {
        masterPrompt: '',
        conditionalInstructions: [],
        forbiddenWords: [],
      },
      knowledge: [],
      rules: [],
      integrationSettings: {},
    };

    setAgents(prev => [...prev, newAgent]);
    toast.success(`Agente ${data.name} criado com sucesso!`);
    
    return newAgent;
  };

  const updateAgent = (id: string, updates: Partial<Agent>): void => {
    setAgents(prev =>
      prev.map(agent =>
        agent.id === id
          ? { ...agent, ...updates, updatedAt: new Date().toISOString() }
          : agent
      )
    );
    toast.success('Agente atualizado com sucesso!');
  };

  const deleteAgent = (id: string): void => {
    const agent = getAgentById(id);
    if (!agent) return;

    setAgents(prev => prev.filter(a => a.id !== id));
    toast.success(`Agente ${agent.name} excluído com sucesso!`);
  };

  const duplicateAgent = (id: string): Agent | undefined => {
    const agent = getAgentById(id);
    if (!agent) return undefined;

    const duplicated: Agent = {
      ...agent,
      id: `agent-${Date.now()}`,
      name: `Cópia de ${agent.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAgents(prev => [...prev, duplicated]);
    toast.success(`Agente duplicado com sucesso!`);
    
    return duplicated;
  };

  return {
    agents,
    getAgentById,
    createAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
  };
};

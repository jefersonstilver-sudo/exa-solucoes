import { useState } from 'react';
import { useAgentConfig } from '../hooks/useAgentConfig';
import { useAPIStatus } from '../hooks/useAPIStatus';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { APIStatusGrid } from '../components/agents/APIStatusGrid';
import { ManyChatConfigSection } from '../components/agents/ManyChatConfigSection';
import { AgentConfigSection } from '../components/agents/AgentConfigSection';
import { AIConsole } from '../components/agents/AIConsole';
import { KnowledgeBaseSection } from '../components/agents/KnowledgeBaseSection';

export const Agentes = () => {
  const { agents, loading, updateAgent, toggleAgentStatus, getAgentByKey } = useAgentConfig();
  const { statuses, testing, testAPI, testAllAPIs } = useAPIStatus();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <p className="text-white">Carregando agentes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-[#1A1A1A] rounded-[14px] border border-[#2A2A2A] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              🤖 Agentes Inteligentes
            </h1>
            <p className="text-[#A0A0A0] mt-2">
              Configuração unificada dos agentes de IA avançada
            </p>
          </div>
          <Button 
            onClick={testAllAPIs}
            disabled={Object.values(testing).some(t => t)}
            className="bg-[#9C1E1E] hover:bg-[#7A1616]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Testar Integridade
          </Button>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1A1A1A] border border-[#2A2A2A]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sofia">Sofia 🟣</TabsTrigger>
          <TabsTrigger value="iris">IRIS 💼</TabsTrigger>
          <TabsTrigger value="exa_alert">EXA Alert 🔔</TabsTrigger>
          <TabsTrigger value="eduardo">Eduardo 👨‍💼</TabsTrigger>
          <TabsTrigger value="console">Console IA</TabsTrigger>
          <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <APIStatusGrid statuses={statuses} testing={testing} onTest={testAPI} />
          <ManyChatConfigSection />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(agent => (
              <div key={agent.key} className="bg-[#1A1A1A] rounded-[14px] border border-[#2A2A2A] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {agent.key === 'sofia' ? '🟣' : agent.key === 'iris' ? '💼' : agent.key === 'exa_alert' ? '🔔' : '👨‍💼'}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{agent.display_name}</h3>
                      <p className="text-xs text-[#A0A0A0]">{agent.type.toUpperCase()}</p>
                    </div>
                  </div>
                  <Button
                    variant={agent.is_active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleAgentStatus(agent.key)}
                  >
                    {agent.is_active ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <p className="text-[#A0A0A0] text-sm">{agent.description}</p>
                {agent.whatsapp_number && (
                  <p className="text-[#A0A0A0] text-xs mt-2">📱 {agent.whatsapp_number}</p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sofia">
          <AgentConfigSection agent={getAgentByKey('sofia')} onUpdate={updateAgent} />
        </TabsContent>

        <TabsContent value="iris">
          <AgentConfigSection agent={getAgentByKey('iris')} onUpdate={updateAgent} />
        </TabsContent>

        <TabsContent value="exa_alert">
          <AgentConfigSection agent={getAgentByKey('exa_alert')} onUpdate={updateAgent} />
        </TabsContent>

        <TabsContent value="eduardo">
          {getAgentByKey('eduardo') && (
            <div className="bg-[#1A1A1A] rounded-[14px] border border-[#2A2A2A] p-6">
              <h2 className="text-2xl font-bold text-white mb-4">👨‍💼 Eduardo (Comercial)</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[#A0A0A0]">Tipo</p>
                  <p className="text-white font-medium">HUMANO</p>
                </div>
                <div>
                  <p className="text-[#A0A0A0]">WhatsApp</p>
                  <p className="text-white font-medium">+55 45 99141-5856</p>
                </div>
                <div>
                  <p className="text-[#A0A0A0]">Notificações</p>
                  <ul className="text-white list-disc list-inside">
                    <li>Leads com score ≥ 75</li>
                    <li>Tags: potential_sale, hot_lead</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="console">
          <AIConsole agents={agents} />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeBaseSection agents={agents} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

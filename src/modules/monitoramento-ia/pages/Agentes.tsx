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
import { MonitorAPIs } from './MonitorAPIs';

export const Agentes = () => {
  const { agents, loading, updateAgent, toggleAgentStatus, getAgentByKey } = useAgentConfig();
  const { statuses, testing, testAPI, testAllAPIs } = useAPIStatus();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-module-primary">
        <p className="text-module-primary">Carregando agentes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-module-primary p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-module-primary flex items-center gap-3">
              🤖 Agentes Inteligentes
            </h1>
            <p className="text-module-secondary mt-2">
              Configuração unificada dos agentes de IA avançada
            </p>
          </div>
          <Button 
            onClick={testAllAPIs}
            disabled={Object.values(testing).some(t => t)}
            className="bg-[#9C1E1E] hover:bg-[#7A1616] text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Testar Integridade
          </Button>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-module-card border border-module">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="apis" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white">
            Monitor de APIs
          </TabsTrigger>
          <TabsTrigger value="sofia" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white">
            Sofia 🟣
          </TabsTrigger>
          <TabsTrigger value="iris" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white">
            IRIS 💼
          </TabsTrigger>
          <TabsTrigger value="exa_alert" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white">
            EXA Alert 🔔
          </TabsTrigger>
          <TabsTrigger value="eduardo" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white">
            Eduardo 👨‍💼
          </TabsTrigger>
          <TabsTrigger value="console" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white">
            Console IA
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white">
            Base de Conhecimento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <APIStatusGrid statuses={statuses} testing={testing} onTest={testAPI} />
          <ManyChatConfigSection />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(agent => (
              <div key={agent.key} className="bg-module-card rounded-[14px] border border-module p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {agent.key === 'sofia' ? '🟣' : agent.key === 'iris' ? '💼' : agent.key === 'exa_alert' ? '🔔' : '👨‍💼'}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-module-primary">{agent.display_name}</h3>
                      <p className="text-xs text-module-tertiary">{agent.type.toUpperCase()}</p>
                    </div>
                  </div>
                  <Button
                    variant={agent.is_active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleAgentStatus(agent.key)}
                    className={agent.is_active ? 'bg-[#9C1E1E] hover:bg-[#7A1616] text-white' : ''}
                  >
                    {agent.is_active ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <p className="text-module-secondary text-sm">{agent.description}</p>
                {agent.whatsapp_number && (
                  <p className="text-sm text-module-primary mt-2">📱 {agent.whatsapp_number}</p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="apis">
          <MonitorAPIs />
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
          <AgentConfigSection agent={getAgentByKey('eduardo')} onUpdate={updateAgent} />
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

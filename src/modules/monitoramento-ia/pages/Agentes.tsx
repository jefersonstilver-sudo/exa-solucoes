import { useState } from 'react';
import { useAgentConfig } from '../hooks/useAgentConfig';
import { useAgentStatus } from '../hooks/useAgentStatus';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Bot, Sparkles, Building2, Bell, UserCircle } from 'lucide-react';
import { APIStatusGrid } from '../components/agents/APIStatusGrid';
import { AgentConfigSection } from '../components/agents/AgentConfigSection';
import { AIConsole } from '../components/agents/AIConsole';
import { KnowledgeBaseSection } from '../components/agents/KnowledgeBaseSection';
import { MonitorAPIs } from './MonitorAPIs';
export const Agentes = () => {
  const {
    agents,
    loading,
    updateAgent,
    toggleAgentStatus,
    getAgentByKey
  } = useAgentConfig();
  const {
    statuses,
    testing,
    testAgent,
    testAllAgents
  } = useAgentStatus();
  const [activeTab, setActiveTab] = useState('overview');
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-module-primary">
        <p className="text-module-primary">Carregando agentes...</p>
      </div>;
  }
  return <div className="min-h-screen bg-module-primary p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="bg-module-card rounded-[14px] border border-module p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9C1E1E] to-[#7A1616] flex items-center justify-center shadow-lg shadow-[#9C1E1E]/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              Agentes Inteligentes
            </h1>
            <p className="text-module-secondary mt-2">
              Configuração unificada dos agentes de IA avançada
            </p>
          </div>
          <Button onClick={() => testAllAgents(agents)} disabled={Object.values(testing).some(t => t)} className="bg-[#9C1E1E] hover:bg-[#7A1616] text-white whitespace-nowrap">
            <RefreshCw className="w-4 h-4 mr-2" />
            Testar Todos os Agentes
          </Button>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6 overflow-x-auto pb-2">
          <TabsList className="bg-module-card border border-module inline-flex min-w-full lg:min-w-0 flex-nowrap gap-1 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white data-[state=inactive]:text-module-secondary whitespace-nowrap px-4">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="apis" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white data-[state=inactive]:text-module-secondary whitespace-nowrap px-4">
              Monitor de APIs
            </TabsTrigger>
            <TabsTrigger value="sofia" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white data-[state=inactive]:text-module-secondary whitespace-nowrap px-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Sofia
            </TabsTrigger>
            <TabsTrigger value="iris" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white data-[state=inactive]:text-module-secondary whitespace-nowrap px-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              IRIS
            </TabsTrigger>
            <TabsTrigger value="exa_alert" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white data-[state=inactive]:text-module-secondary whitespace-nowrap px-4 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              EXA Alert
            </TabsTrigger>
            <TabsTrigger value="eduardo" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white data-[state=inactive]:text-module-secondary whitespace-nowrap px-4 flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              Eduardo
            </TabsTrigger>
            <TabsTrigger value="console" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white data-[state=inactive]:text-module-secondary whitespace-nowrap px-4">
              Console IA
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-[#9C1E1E] data-[state=active]:text-white data-[state=inactive]:text-module-secondary whitespace-nowrap px-4">
              Base de Conhecimento
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <APIStatusGrid agents={agents} statuses={statuses} testing={testing} onTest={testAgent} />
          
          
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
    </div>;
};
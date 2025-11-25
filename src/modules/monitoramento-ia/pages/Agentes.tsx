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
    return <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-foreground">Carregando agentes...</p>
      </div>;
  }
  return <div className="min-h-screen bg-background p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER - Apple-like Mobile-First */}
      <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3 tracking-tight">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                <Bot className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <span className="truncate">Agentes Inteligentes</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              Configuração unificada dos agentes de IA
            </p>
          </div>
          <Button 
            onClick={() => testAllAgents(agents)} 
            disabled={Object.values(testing).some(t => t)} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto min-h-[44px] shadow-md"
          >
            <RefreshCw className={`w-4 h-4 sm:mr-2 ${Object.values(testing).some(t => t) ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Testar Todos os Agentes</span>
            <span className="sm:hidden">Testar</span>
          </Button>
        </div>
      </div>

      {/* TABS - Apple-like Scrollable Mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-4 sm:mb-6 relative">
          {/* Scrollable container with hidden scrollbar */}
          <div className="overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-card backdrop-blur-xl border border-border inline-flex min-w-max gap-1 sm:gap-2 p-1 rounded-full shadow-sm">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium min-h-[44px] touch-manipulation transition-all duration-[var(--duration-normal)]"
              >
                📊 Overview
              </TabsTrigger>
              <TabsTrigger 
                value="apis" 
                className="data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=inactive]:text-gray-600 whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium min-h-[44px] touch-manipulation transition-all duration-[var(--duration-normal)]"
              >
                🔌 APIs
              </TabsTrigger>
              <TabsTrigger 
                value="sofia" 
                className="data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=inactive]:text-gray-600 whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium flex items-center gap-2 min-h-[44px] touch-manipulation transition-all duration-[var(--duration-normal)]"
              >
                <Sparkles className="w-4 h-4" />
                Sofia
              </TabsTrigger>
              <TabsTrigger 
                value="iris" 
                className="data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=inactive]:text-gray-600 whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium flex items-center gap-2 min-h-[44px] touch-manipulation transition-all duration-[var(--duration-normal)]"
              >
                <Building2 className="w-4 h-4" />
                IRIS
              </TabsTrigger>
              <TabsTrigger 
                value="exa_alert" 
                className="data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=inactive]:text-gray-600 whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium flex items-center gap-2 min-h-[44px] touch-manipulation transition-all duration-[var(--duration-normal)]"
              >
                <Bell className="w-4 h-4" />
                Alert
              </TabsTrigger>
              <TabsTrigger 
                value="eduardo" 
                className="data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=inactive]:text-gray-600 whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium flex items-center gap-2 min-h-[44px] touch-manipulation transition-all duration-[var(--duration-normal)]"
              >
                <UserCircle className="w-4 h-4" />
                Eduardo
              </TabsTrigger>
              <TabsTrigger 
                value="console" 
                className="data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=inactive]:text-gray-600 whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium min-h-[44px] touch-manipulation transition-all duration-[var(--duration-normal)]"
              >
                🤖 Console
              </TabsTrigger>
              <TabsTrigger 
                value="knowledge" 
                className="data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=inactive]:text-gray-600 whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium min-h-[44px] touch-manipulation transition-all duration-[var(--duration-normal)]"
              >
                📚 Base
              </TabsTrigger>
            </TabsList>
          </div>
          {/* Fade indicator on right for mobile */}
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[hsl(var(--apple-gray-50))] pointer-events-none sm:hidden" />
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
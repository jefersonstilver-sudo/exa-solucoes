import { useState } from 'react';
import { useAgentConfig } from '../hooks/useAgentConfig';
import { useAgentStatus } from '../hooks/useAgentStatus';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Bot, Sparkles, Building2, Bell, UserCircle, Menu } from 'lucide-react';
import { APIStatusGrid } from '../components/agents/APIStatusGrid';
import { AgentConfigSection } from '../components/agents/AgentConfigSection';
import { AIConsole } from '../components/agents/AIConsole';
import { KnowledgeBaseSection } from '../components/agents/KnowledgeBaseSection';
import { MonitorAPIs } from './MonitorAPIs';
import { Sidebar } from '../components/Sidebar';
import { useModuleTheme } from '../hooks/useModuleTheme';

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme } = useModuleTheme();
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-foreground">Carregando agentes...</p>
      </div>;
  }
  return <>
      {/* Sidebar - Apenas mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden transition-transform duration-300 ease-in-out`}>
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <div className="min-h-screen bg-background space-y-4 lg:space-y-6">
        {/* Header Mobile - Gradiente Vermelho EXA */}
        <div className="lg:hidden sticky top-0 z-20 bg-gradient-to-r from-[#9C1E1E] via-[#B02424] to-[#9C1E1E] shadow-lg">
          <div className="relative flex items-center justify-between p-3">
            {/* Botão Hambúrguer */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>

            {/* Logo EXA no Centro */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <img 
                src={EXA_LOGO_URL}
                alt="EXA"
                className="h-10 w-auto brightness-0 invert"
              />
            </div>

            {/* Espaço à direita para manter simetria */}
            <div className="w-10" />
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4 lg:space-y-6">
          {/* HEADER - Desktop */}
          <div className="hidden lg:block bg-card backdrop-blur-xl border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
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
      </div>
    </div>
  </>;
};
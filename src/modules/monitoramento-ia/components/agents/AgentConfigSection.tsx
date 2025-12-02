import { useState, useEffect } from 'react';
import { Agent } from '../../hooks/useAgentConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Building2, Bell, UserCircle, Bot as BotIcon, Eye, Download, ChevronLeft } from 'lucide-react';
import { AgentChatPreview } from './AgentChatPreview';
import { exportKnowledgeBase } from '../../utils/exportKnowledgeBase';
import { AgentAPIStatus } from './AgentAPIStatus';
import { AgentAPIToolsSection } from './AgentAPIToolsSection';
import { AgentLogsSection } from './AgentLogsSection';
import { AgentSections } from './AgentSections';
import { KnowledgeItems } from './KnowledgeItems';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAgentStatus } from '../../hooks/useAgentStatus';
import { useSupabaseAgents } from '../../hooks/useSupabaseAgents';
import { cn } from '@/lib/utils';

interface AgentConfigSectionProps {
  agent: Agent | undefined;
  onUpdate: (key: string, updates: Partial<Agent>) => Promise<void>;
}

export const AgentConfigSection = ({ agent, onUpdate }: AgentConfigSectionProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  
  // Hook para testar status real da API
  const { statuses, testing, testAgent } = useAgentStatus();
  const agentStatus = statuses[agent?.key];
  
  // Hook para buscar dados do agente (seções e knowledge items)
  const { agents: supabaseAgents, loading: supabaseLoading } = useSupabaseAgents();
  // CRITICAL FIX: Match by KEY not ID, since agent comes from JSON and supabaseAgents from DB
  const supabaseAgent = supabaseAgents.find(a => a.key === agent?.key);

  // Realtime sync - detectar mudanças na base de conhecimento
  useEffect(() => {
    if (!agent) return;
    
    // Canal para agent_sections
    const sectionsChannel = supabase
      .channel(`agent-sections-${agent.key}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_sections',
          filter: `agent_id=eq.${agent.id}`
        },
        () => {
          setPreviewKey(prev => prev + 1);
          toast.success('Preview atualizado', { description: 'Seção sincronizada' });
        }
      )
      .subscribe();

    // Canal para agent_knowledge_items
    const itemsChannel = supabase
      .channel(`agent-knowledge-items-${agent.key}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_knowledge_items',
          filter: `agent_id=eq.${agent.id}`
        },
        () => {
          setPreviewKey(prev => prev + 1);
          toast.success('Preview atualizado', { description: 'Base de conhecimento sincronizada' });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sectionsChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [agent?.key, agent?.id]);

  if (!agent) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <p className="text-muted-foreground">Agente não encontrado</p>
      </div>
    );
  }

  const getAgentIcon = (): JSX.Element => {
    switch (agent.key) {
      case 'sofia': return <Sparkles className="w-5 h-5" />;
      case 'iris': return <Building2 className="w-5 h-5" />;
      case 'exa_alert': return <Bell className="w-5 h-5" />;
      case 'eduardo': return <UserCircle className="w-5 h-5" />;
      default: return <BotIcon className="w-5 h-5" />;
    }
  };

  const handleTestConnection = async () => {
    await testAgent(agent.key, agent.display_name);
  };

  const sections = supabaseAgent?.sections || [];
  const knowledgeItems = supabaseAgent?.knowledgeItems || [];

  const handleExportAll = () => {
    try {
      exportKnowledgeBase(agent.display_name, sections, knowledgeItems);
      toast.success('Base de conhecimento exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar base de conhecimento');
    }
  };

  return (
    <div className="bg-card rounded-2xl border-0 p-4 sm:p-6 max-w-full">
      {/* HEADER MOBILE-FIRST APPLE STYLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/30">
        {/* Agent Info */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {getAgentIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-semibold text-foreground truncate">{agent.display_name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                agentStatus?.status === 'online' ? 'bg-green-500/20 text-green-600' :
                agentStatus?.status === 'offline' ? 'bg-red-500/20 text-red-600' :
                'bg-muted text-muted-foreground'
              )}>
                {agentStatus?.status === 'online' ? '● Online' : 
                 agentStatus?.status === 'offline' ? '● Offline' : '● Não testado'}
              </span>
              {agentStatus?.latency && (
                <span className="text-xs text-muted-foreground">{agentStatus.latency}ms</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Row - Inline on mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {agent.key !== 'eduardo' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPreview(true)}
              className="h-10 px-3 sm:px-4 rounded-full touch-manipulation"
            >
              <Eye className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          )}
          <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-muted/30">
            <span className="text-xs sm:text-sm text-muted-foreground">Ativo</span>
            <Switch
              checked={agent.is_active}
              onCheckedChange={async (checked) => {
                try {
                  await onUpdate(agent.key, { is_active: checked });
                  toast.success(checked ? 'Agente ativado' : 'Agente desativado');
                } catch (error) {
                  toast.error('Erro ao atualizar status');
                }
              }}
            />
          </div>
        </div>
      </div>

      <AgentChatPreview
        key={previewKey}
        agent={agent}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />

      {/* MAIN TABS - Apple-like Scrollable Pills */}
      <Tabs defaultValue="api-status" className="w-full">
        {/* Scrollable Tabs Container */}
        <div className="relative mb-6">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            <TabsList className="inline-flex min-w-max gap-2 p-1 bg-muted/50 rounded-full">
              <TabsTrigger 
                value="api-status" 
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap",
                  "min-h-[44px] touch-manipulation transition-all duration-200",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted"
                )}
              >
                Status
              </TabsTrigger>
              <TabsTrigger 
                value="tools" 
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap",
                  "min-h-[44px] touch-manipulation transition-all duration-200",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted"
                )}
              >
                Ferramentas
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap",
                  "min-h-[44px] touch-manipulation transition-all duration-200",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted"
                )}
              >
                Logs
              </TabsTrigger>
              <TabsTrigger 
                value="knowledge" 
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap",
                  "min-h-[44px] touch-manipulation transition-all duration-200",
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted"
                )}
              >
                Conhecimento
              </TabsTrigger>
            </TabsList>
          </div>
          {/* Fade indicator */}
          <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none sm:hidden" />
        </div>

        {/* ABA 1: API STATUS */}
        <TabsContent value="api-status" className="space-y-6 mt-0">
          <AgentAPIStatus
            agent={agent}
            status={agentStatus}
            testing={testing[agent.key] || false}
            onTest={handleTestConnection}
          />
        </TabsContent>

        {/* ABA 2: FERRAMENTAS & PERMISSÕES */}
        <TabsContent value="tools" className="space-y-6 mt-0">
          <AgentAPIToolsSection agent={agent} />
        </TabsContent>

        {/* ABA 3: LOGS & HISTÓRICO */}
        <TabsContent value="logs" className="space-y-6 mt-0">
          <AgentLogsSection agent={agent} />
        </TabsContent>

        {/* ABA 4: BASE DE CONHECIMENTO */}
        <TabsContent value="knowledge" className="space-y-6 mt-0">
          <div className="space-y-6">
            {/* Header da seção - Mobile optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Base de Conhecimento</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Seções do prompt e itens de conhecimento</p>
              </div>
              <Button 
                onClick={handleExportAll} 
                variant="outline" 
                size="sm"
                className="h-10 px-4 rounded-full touch-manipulation self-start sm:self-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>

            {/* SUB-TABS - Apple-like Scrollable Pills */}
            <Tabs defaultValue="section1" className="w-full">
              <div className="relative mb-4">
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                  <TabsList className="inline-flex min-w-max gap-2 p-1 bg-muted/50 rounded-full">
                    <TabsTrigger 
                      value="section1" 
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                        "min-h-[40px] touch-manipulation transition-all duration-200",
                        "data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=active]:shadow-md",
                        "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted"
                      )}
                    >
                      1. Identidade
                    </TabsTrigger>
                    <TabsTrigger 
                      value="section2" 
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                        "min-h-[40px] touch-manipulation transition-all duration-200",
                        "data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=active]:shadow-md",
                        "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted"
                      )}
                    >
                      2. Operacional
                    </TabsTrigger>
                    <TabsTrigger 
                      value="section3" 
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                        "min-h-[40px] touch-manipulation transition-all duration-200",
                        "data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=active]:shadow-md",
                        "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted"
                      )}
                    >
                      3. Limites
                    </TabsTrigger>
                    <TabsTrigger 
                      value="section4" 
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                        "min-h-[40px] touch-manipulation transition-all duration-200",
                        "data-[state=active]:bg-[hsl(var(--exa-red))] data-[state=active]:text-white data-[state=active]:shadow-md",
                        "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted"
                      )}
                    >
                      4. Conhecimentos
                    </TabsTrigger>
                  </TabsList>
                </div>
                {/* Fade indicator */}
                <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none sm:hidden" />
              </div>

              {/* Sections 1-3: Use AgentSections */}
              <TabsContent value="section1" className="mt-4">
                <AgentSections 
                  sections={sections.filter(s => s.section_number === 1)} 
                  agentId={agent.key}
                />
              </TabsContent>

              <TabsContent value="section2" className="mt-4">
                <AgentSections 
                  sections={sections.filter(s => s.section_number === 2)} 
                  agentId={agent.key}
                />
              </TabsContent>

              <TabsContent value="section3" className="mt-4">
                <AgentSections 
                  sections={sections.filter(s => s.section_number === 3)} 
                  agentId={agent.key}
                />
              </TabsContent>

              {/* Section 4: Use KnowledgeItems - FIXED: Pass KEY not UUID */}
              <TabsContent value="section4" className="mt-4">
                <KnowledgeItems  
                  items={knowledgeItems}
                  agentId={agent.key}
                  agentKey={agent.key}
                  agentName={agent.display_name}
                />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

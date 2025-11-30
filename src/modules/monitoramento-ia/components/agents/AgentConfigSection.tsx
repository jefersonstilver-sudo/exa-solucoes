import { useState, useEffect } from 'react';
import { Agent } from '../../hooks/useAgentConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Building2, Bell, UserCircle, Bot as BotIcon, Eye, Download } from 'lucide-react';
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
  const { agents: supabaseAgents } = useSupabaseAgents();
  const supabaseAgent = supabaseAgents.find(a => a.id === agent?.id);

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
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <p className="text-module-secondary">Agente não encontrado</p>
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
    <div className="bg-module-card rounded-[14px] border-0 p-6 max-w-full">
      {/* HEADER SIMPLIFICADO E MINIMALISTA */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-module/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-module-accent/10 flex items-center justify-center text-2xl">
            {getAgentIcon()}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-module-primary">{agent.display_name}</h2>
            <p className="text-sm text-module-secondary mt-0.5">{agent.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                agentStatus?.status === 'online' ? 'bg-green-500/20 text-green-500' :
                agentStatus?.status === 'offline' ? 'bg-red-500/20 text-red-500' :
                'bg-gray-500/20 text-gray-500'
              }`}>
                {agentStatus?.status === 'online' ? '● Online' : 
                 agentStatus?.status === 'offline' ? '● Offline' : '● Não testado'}
              </span>
              {agent.whatsapp_provider && (
                <span className="text-xs text-module-tertiary">
                  {agent.whatsapp_provider === 'zapi' ? 'Z-API' : 'ManyChat'}
                </span>
              )}
              {agentStatus?.latency && (
                <span className="text-xs text-module-tertiary">{agentStatus.latency}ms</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {agent.key !== 'eduardo' && (
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-module bg-module-input">
            <span className="text-sm text-module-secondary">Ativo</span>
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

      {/* TABS SIMPLIFICADAS - 4 ABAS */}
      <Tabs defaultValue="api-status" className="w-full">
        <TabsList className="bg-module-primary/5 border-0 gap-2 p-1 mb-6">
          <TabsTrigger 
            value="api-status" 
            className="data-[state=active]:bg-module-accent data-[state=active]:text-white data-[state=inactive]:text-module-secondary px-6"
          >
            API Status
          </TabsTrigger>
          <TabsTrigger 
            value="tools" 
            className="data-[state=active]:bg-module-accent data-[state=active]:text-white data-[state=inactive]:text-module-secondary px-6"
          >
            Ferramentas
          </TabsTrigger>
          <TabsTrigger 
            value="logs" 
            className="data-[state=active]:bg-module-accent data-[state=active]:text-white data-[state=inactive]:text-module-secondary px-6"
          >
            Logs
          </TabsTrigger>
          <TabsTrigger 
            value="knowledge" 
            className="data-[state=active]:bg-module-accent data-[state=active]:text-white data-[state=inactive]:text-module-secondary px-6"
          >
            Base de Conhecimento
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: API STATUS */}
        <TabsContent value="api-status" className="space-y-6">
          <AgentAPIStatus
            agent={agent}
            status={agentStatus}
            testing={testing[agent.key] || false}
            onTest={handleTestConnection}
          />
        </TabsContent>

        {/* ABA 2: FERRAMENTAS & PERMISSÕES */}
        <TabsContent value="tools" className="space-y-6">
          <AgentAPIToolsSection agent={agent} />
        </TabsContent>

        {/* ABA 3: LOGS & HISTÓRICO */}
        <TabsContent value="logs" className="space-y-6">
          <AgentLogsSection agent={agent} />
        </TabsContent>

        {/* ABA 4: BASE DE CONHECIMENTO */}
        <TabsContent value="knowledge" className="space-y-6">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-module-primary mb-1">Base de Conhecimento</h3>
                <p className="text-sm text-module-secondary">Configure as 4 seções fundamentais e itens dinâmicos</p>
              </div>
              <Button onClick={handleExportAll} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Tudo
              </Button>
            </div>

            <Tabs defaultValue="section1" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-module-primary/10">
                <TabsTrigger value="section1" className="data-[state=active]:!bg-[#9C1E1E] data-[state=active]:!text-white">1. Identidade</TabsTrigger>
                <TabsTrigger value="section2" className="data-[state=active]:!bg-[#9C1E1E] data-[state=active]:!text-white">2. Operacional</TabsTrigger>
                <TabsTrigger value="section3" className="data-[state=active]:!bg-[#9C1E1E] data-[state=active]:!text-white">3. Limites</TabsTrigger>
                <TabsTrigger value="section4" className="data-[state=active]:!bg-[#9C1E1E] data-[state=active]:!text-white">4. Conhecimentos</TabsTrigger>
              </TabsList>

              <TabsContent value="section1" className="mt-6">
                <AgentSections 
                  sections={sections.filter(s => s.section_number === 1)} 
                  agentId={agent.key}
                />
              </TabsContent>

              <TabsContent value="section2" className="mt-6">
                <AgentSections 
                  sections={sections.filter(s => s.section_number === 2)} 
                  agentId={agent.key}
                />
              </TabsContent>

              <TabsContent value="section3" className="mt-6">
                <AgentSections 
                  sections={sections.filter(s => s.section_number === 3)} 
                  agentId={agent.key}
                />
              </TabsContent>

              <TabsContent value="section4" className="mt-6">
                <AgentSections 
                  sections={sections.filter(s => s.section_number === 4)} 
                  agentId={agent.key}
                />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

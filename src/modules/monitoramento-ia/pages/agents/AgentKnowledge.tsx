import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseAgents } from '../../hooks/useSupabaseAgents';
import { AgentSections } from '../../components/agents/AgentSections';
import { KnowledgeItems } from '../../components/agents/KnowledgeItems';

export const AgentKnowledge = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgentById, refetch } = useSupabaseAgents();
  
  const [agent, setAgent] = useState<ReturnType<typeof getAgentById>>(undefined);
  const [loading, setLoading] = useState(true);

  const loadAgent = async () => {
    if (!id) return;
    
    setLoading(true);
    await refetch();
    const foundAgent = getAgentById(id);
    if (foundAgent) {
      setAgent(foundAgent);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAgent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!agent) return null;

  const sections = agent.sections || [];
  const knowledgeItems = agent.knowledgeItems || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              {agent.avatar} Base de Conhecimento: {agent.name}
            </h1>
            <p className="text-module-secondary">
              Configure as 4 seções fundamentais do agente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/monitoramento-ia/agentes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for 4 Sections */}
      <Tabs defaultValue="section1" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="section1">1. Identidade</TabsTrigger>
          <TabsTrigger value="section2">2. Operacional</TabsTrigger>
          <TabsTrigger value="section3">3. Limites</TabsTrigger>
          <TabsTrigger value="section4">4. Base</TabsTrigger>
        </TabsList>

        <TabsContent value="section1" className="mt-6">
          <AgentSections 
            sections={sections.filter(s => s.section_number === 1)} 
            onRefresh={loadAgent}
          />
        </TabsContent>

        <TabsContent value="section2" className="mt-6">
          <AgentSections 
            sections={sections.filter(s => s.section_number === 2)} 
            onRefresh={loadAgent}
          />
        </TabsContent>

        <TabsContent value="section3" className="mt-6">
          <AgentSections 
            sections={sections.filter(s => s.section_number === 3)} 
            onRefresh={loadAgent}
          />
        </TabsContent>

        <TabsContent value="section4" className="mt-6">
          <KnowledgeItems 
            items={knowledgeItems} 
            agentKey={agent.key}
            onRefresh={loadAgent}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

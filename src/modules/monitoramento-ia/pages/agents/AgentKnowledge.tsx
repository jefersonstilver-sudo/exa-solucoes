import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAgents } from '../../hooks/useSupabaseAgents';
import { AgentSections } from '../../components/agents/AgentSections';
import { KnowledgeItems } from '../../components/agents/KnowledgeItems';
import { exportKnowledgeBase } from '../../utils/exportKnowledgeBase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'section1', label: '1. Identidade', shortLabel: 'Identidade' },
  { id: 'section2', label: '2. Operacional', shortLabel: 'Operacional' },
  { id: 'section3', label: '3. Limites', shortLabel: 'Limites' },
  { id: 'section4', label: '4. Conhecimentos', shortLabel: 'Conhecimentos' },
];

export const AgentKnowledge = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agents, loading: agentsLoading } = useSupabaseAgents();
  const [activeTab, setActiveTab] = useState('section1');
  const [loading, setLoading] = useState(true);

  const agent = agents.find(a => a.id === id);

  useEffect(() => {
    setLoading(agentsLoading);
  }, [agentsLoading]);

  // Debug log para verificar dados
  useEffect(() => {
    if (agent) {
      console.log('📊 Agent Data:', {
        id: agent.id,
        key: agent.key,
        name: agent.name,
        sectionsCount: agent.sections?.length || 0,
        knowledgeItemsCount: agent.knowledgeItems?.length || 0,
        knowledgeItems: agent.knowledgeItems
      });
    }
  }, [agent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-module-accent" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-module-secondary">Agente não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/admin/monitoramento-ia/agentes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const sections = agent.sections || [];
  const knowledgeItems = agent.knowledgeItems || [];

  const handleExport = () => {
    try {
      exportKnowledgeBase(agent.name, sections, knowledgeItems);
      toast.success('Base de conhecimento exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar base de conhecimento');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'section1':
        return <AgentSections sections={sections.filter(s => s.section_number === 1)} agentId={agent.key} />;
      case 'section2':
        return <AgentSections sections={sections.filter(s => s.section_number === 2)} agentId={agent.key} />;
      case 'section3':
        return <AgentSections sections={sections.filter(s => s.section_number === 3)} agentId={agent.key} />;
      case 'section4':
        // Tab 4 SEMPRE usa KnowledgeItems (14 cards), nunca AgentSections
        return (
          <KnowledgeItems 
            items={knowledgeItems} 
            agentId={agent.id}
            agentKey={agent.key}
            agentName={agent.name}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-20 lg:pb-6">
      {/* Header - Mobile Optimized */}
      <div className="bg-module-card rounded-xl lg:rounded-[14px] border border-module p-4 lg:p-8">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between mb-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/monitoramento-ia/agentes')}
              className="text-module-secondary hover:text-module-primary -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              className="border-module text-module-primary"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-module-primary flex items-center justify-center gap-2">
              {agent.avatar} {agent.name}
            </h1>
            <p className="text-sm text-module-secondary mt-1">
              Base de Conhecimento
            </p>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              {agent.avatar} Base de Conhecimento: {agent.name}
            </h1>
            <p className="text-module-secondary">
              Configure as 4 seções fundamentais do agente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport} className="border-module">
              <Download className="w-4 h-4 mr-2" />
              Exportar Tudo
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/monitoramento-ia/agentes')} className="border-module">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs - Apple Style Scrollable Pills */}
      <div className="relative">
        {/* Mobile: Horizontal Scrollable Pills */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap",
                  "transition-all duration-300 ease-out",
                  "touch-manipulation active:scale-95",
                  "min-h-[44px] min-w-[44px]",
                  activeTab === tab.id
                    ? "bg-[#9C1E1E] text-white shadow-lg shadow-[#9C1E1E]/30"
                    : "bg-module-card text-module-secondary border border-module hover:bg-module-secondary/50"
                )}
              >
                {tab.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Grid Tabs */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-2 bg-module-primary/10 p-1.5 rounded-xl border border-module">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 rounded-lg text-sm font-medium",
                "transition-all duration-200 ease-out",
                activeTab === tab.id
                  ? "bg-[#9C1E1E] text-white shadow-md"
                  : "text-module-primary hover:bg-module-secondary/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Fade indicator for mobile scroll */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background pointer-events-none lg:hidden" />
      </div>

      {/* Tab Content */}
      <div className="mt-4 lg:mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

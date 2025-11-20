import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KnowledgeCard } from '../../components/KnowledgeCard';
import { useSupabaseAgents } from '../../hooks/useSupabaseAgents';
import { toast } from 'sonner';

export const AgentKnowledge = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgentById } = useSupabaseAgents();
  
  const [agent, setAgent] = useState<ReturnType<typeof getAgentById>>(undefined);

  useEffect(() => {
    if (!id) return;
    
    const foundAgent = getAgentById(id);
    if (foundAgent) {
      setAgent(foundAgent);
    } else {
      toast.error('Agente não encontrado');
      navigate('/admin/monitoramento-ia/agentes');
    }
  }, [id, getAgentById, navigate]);

  if (!agent) return null;

  const documents = agent.knowledge.filter(k => k.type === 'document');
  const faqs = agent.knowledge.filter(k => k.type === 'faq');
  const policies = agent.knowledge.filter(k => k.type === 'policy');

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
              Gerencie documentos e informações do agente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/monitoramento-ia/agentes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button className="bg-module-accent hover:bg-module-accent-hover">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Documento
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-module-tertiary text-sm mb-1">Documentos</p>
              <p className="text-3xl font-bold text-module-primary">{documents.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-module-accent" />
          </div>
        </div>

        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-module-tertiary text-sm mb-1">FAQs</p>
              <p className="text-3xl font-bold text-module-primary">{faqs.length}</p>
            </div>
            <span className="text-3xl">❓</span>
          </div>
        </div>

        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-module-tertiary text-sm mb-1">Políticas</p>
              <p className="text-3xl font-bold text-module-primary">{policies.length}</p>
            </div>
            <span className="text-3xl">📋</span>
          </div>
        </div>
      </div>

      {/* Knowledge List */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Documentos da Base de Conhecimento</h2>
        
        {agent.knowledge.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-module-tertiary mx-auto mb-4" />
            <p className="text-module-secondary mb-2">Nenhum documento adicionado ainda</p>
            <p className="text-module-tertiary text-sm mb-4">
              Adicione documentos para enriquecer o conhecimento do agente
            </p>
            <Button className="bg-module-accent hover:bg-module-accent-hover">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Documento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {agent.knowledge.map((doc) => (
              <KnowledgeCard
                key={doc.id}
                title={doc.title}
                type={doc.type}
                tags={doc.tags}
                updatedAt={doc.updatedAt}
                onEdit={() => toast.info('Edição de documento em desenvolvimento')}
                onDelete={() => toast.info('Exclusão de documento em desenvolvimento')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

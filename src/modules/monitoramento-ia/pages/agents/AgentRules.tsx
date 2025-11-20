import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RuleCard } from '../../components/RuleCard';
import { useAgents } from '../../hooks/useAgents';
import { toast } from 'sonner';

export const AgentRules = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgentById } = useAgents();
  
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

  const activeRules = agent.rules.filter(r => r.active);
  const inactiveRules = agent.rules.filter(r => !r.active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              {agent.avatar} Regras de Ação: {agent.name}
            </h1>
            <p className="text-module-secondary">
              Configure comportamentos automáticos do agente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/monitoramento-ia/agentes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button className="bg-module-accent hover:bg-module-accent-hover">
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-module-tertiary text-sm mb-1">Regras Ativas</p>
              <p className="text-3xl font-bold text-green-500">{activeRules.length}</p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-module-tertiary text-sm mb-1">Total de Regras</p>
              <p className="text-3xl font-bold text-module-primary">{agent.rules.length}</p>
            </div>
            <Zap className="w-8 h-8 text-module-accent" />
          </div>
        </div>
      </div>

      {/* Active Rules */}
      {activeRules.length > 0 && (
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <h2 className="text-lg font-bold text-module-primary mb-4">Regras Ativas</h2>
          <div className="space-y-3">
            {activeRules.map((rule) => (
              <RuleCard
                key={rule.id}
                name={rule.name}
                trigger={rule.trigger}
                action={rule.action}
                priority={rule.priority}
                active={rule.active}
                onEdit={() => toast.info('Edição de regras em desenvolvimento')}
                onToggle={() => toast.info('Toggle de regras em desenvolvimento')}
                onDelete={() => toast.info('Exclusão de regras em desenvolvimento')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Rules */}
      {inactiveRules.length > 0 && (
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <h2 className="text-lg font-bold text-module-primary mb-4">Regras Inativas</h2>
          <div className="space-y-3">
            {inactiveRules.map((rule) => (
              <RuleCard
                key={rule.id}
                name={rule.name}
                trigger={rule.trigger}
                action={rule.action}
                priority={rule.priority}
                active={rule.active}
                onEdit={() => toast.info('Edição de regras em desenvolvimento')}
                onToggle={() => toast.info('Toggle de regras em desenvolvimento')}
                onDelete={() => toast.info('Exclusão de regras em desenvolvimento')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {agent.rules.length === 0 && (
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-module-tertiary mx-auto mb-4" />
            <p className="text-module-secondary mb-2">Nenhuma regra configurada ainda</p>
            <p className="text-module-tertiary text-sm mb-4">
              Crie regras para automatizar ações do agente
            </p>
            <Button className="bg-module-accent hover:bg-module-accent-hover">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Regra
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

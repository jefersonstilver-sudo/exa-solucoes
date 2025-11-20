/**
 * Page: Regras de Ação
 * Mock UI para gerenciar regras de automação
 */

import { useState } from 'react';
import { Zap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RuleCard } from '../components/RuleCard';
import { mockActionRules, mockRuleExecutions } from '../utils/mockAIData';
import { toast } from 'sonner';

export const RegrasAcaoPage = () => {
  const [rules] = useState(mockActionRules);
  const [executions] = useState(mockRuleExecutions);

  const handleEdit = (id: number) => {
    toast.info(`Editando regra ${id}...`);
  };

  const handleToggle = (id: number) => {
    toast.success(`Status da regra ${id} alterado!`);
  };

  const handleDelete = (id: number) => {
    toast.success(`Regra ${id} removida!`);
  };

  const activeRulesCount = rules.filter(r => r.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              <Zap className="w-7 h-7" />
              Regras de Ação (Automação)
            </h1>
            <p className="text-module-secondary">
              Configure ações automáticas baseadas em eventos e condições
            </p>
          </div>
          <Button className="bg-module-accent hover:bg-module-accent-hover">
            <Plus className="w-4 h-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-module-card border border-module rounded-lg p-6">
          <p className="text-3xl font-bold text-green-500 mb-1">
            {activeRulesCount}
          </p>
          <p className="text-module-secondary text-sm">Regras Ativas</p>
        </div>
        <div className="bg-module-card border border-module rounded-lg p-6">
          <p className="text-3xl font-bold text-module-accent mb-1">
            {rules.length}
          </p>
          <p className="text-module-secondary text-sm">Total de Regras</p>
        </div>
        <div className="bg-module-card border border-module rounded-lg p-6">
          <p className="text-3xl font-bold text-module-accent mb-1">
            {executions.length}
          </p>
          <p className="text-module-secondary text-sm">Execuções Hoje</p>
        </div>
      </div>

      {/* Regras Ativas */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">
          Regras Ativas ({activeRulesCount})
        </h2>
        <div className="space-y-3">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              name={rule.name}
              trigger={rule.trigger}
              action={rule.action}
              priority={rule.priority}
              active={rule.active}
              onEdit={() => handleEdit(rule.id)}
              onToggle={() => handleToggle(rule.id)}
              onDelete={() => handleDelete(rule.id)}
            />
          ))}
        </div>
      </div>

      {/* Logs de Execução */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-module-primary">
            Logs de Execução (últimas 10)
          </h2>
          <Button variant="ghost" size="sm" className="text-module-accent">
            Ver Todos
          </Button>
        </div>
        <div className="space-y-2">
          {executions.map((execution) => (
            <div 
              key={execution.id}
              className="flex items-center justify-between p-3 bg-module-input rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  execution.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="text-module-primary text-sm font-medium">
                    {execution.ruleName}
                  </p>
                  <p className="text-module-tertiary text-xs">
                    {new Date(execution.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-medium ${
                execution.status === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
                {execution.status === 'success' ? '✓ Sucesso' : '✗ Erro'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

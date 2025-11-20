import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgents } from '../../hooks/useAgents';
import type { AgentFormData, AgentType, IntegrationProvider } from '../../types/multiAgentTypes';

export const CreateAgent = () => {
  const navigate = useNavigate();
  const { createAgent } = useAgents();
  
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    type: 'personalizado',
    avatar: '🤖',
    description: '',
    phoneNumber: null,
    provider: 'none',
  });

  const agentTypes: Array<{ value: AgentType; label: string; avatar: string }> = [
    { value: 'vendas', label: 'Sofia (Vendas)', avatar: '🟣' },
    { value: 'diretoria', label: 'Iris (Diretoria)', avatar: '💼' },
    { value: 'notificacao', label: 'EXA Alert (Notificações)', avatar: '🔔' },
    { value: 'personalizado', label: 'Personalizado', avatar: '🤖' },
  ];

  const providers: Array<{ value: IntegrationProvider; label: string }> = [
    { value: 'none', label: 'Nenhum' },
    { value: 'manychat', label: 'ManyChat' },
    { value: 'string', label: 'STRING.com' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.name.length < 3) {
      return;
    }

    const newAgent = createAgent(formData);
    navigate(`/admin/monitoramento-ia/agentes/${newAgent.id}/configuracoes`);
  };

  const handleTypeChange = (type: AgentType) => {
    const selectedType = agentTypes.find(t => t.value === type);
    setFormData({
      ...formData,
      type,
      avatar: selectedType?.avatar || '🤖',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2">
              ➕ Criar Novo Agente
            </h1>
            <p className="text-module-secondary">
              Configure um novo agente de IA para o sistema
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/monitoramento-ia/agentes')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <h2 className="text-lg font-bold text-module-primary mb-4">Informações Básicas</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">
                Nome do Agente *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome do agente..."
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary placeholder-module-muted focus:outline-none focus:ring-2 focus:ring-module-accent"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">
                Tipo de Agente *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      formData.type === type.value
                        ? 'border-module-accent bg-module-accent/10'
                        : 'border-module hover:border-module-accent/50'
                    }`}
                  >
                    <span className="text-2xl">{type.avatar}</span>
                    <span className="text-module-primary font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">
                Avatar/Emoji
              </label>
              <input
                type="text"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="🤖"
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary placeholder-module-muted focus:outline-none focus:ring-2 focus:ring-module-accent"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a função deste agente..."
                rows={3}
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary placeholder-module-muted focus:outline-none focus:ring-2 focus:ring-module-accent"
              />
            </div>
          </div>
        </div>

        {/* Integração (Opcional) */}
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <h2 className="text-lg font-bold text-module-primary mb-4">Integração (Opcional)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">
                Número de WhatsApp
              </label>
              <input
                type="text"
                value={formData.phoneNumber || ''}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value || null })}
                placeholder="+55 (11) 99999-9999"
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary placeholder-module-muted focus:outline-none focus:ring-2 focus:ring-module-accent"
              />
            </div>

            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">
                Provider de Integração
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as IntegrationProvider })}
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              >
                {providers.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.provider !== 'none' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-500 text-sm">
                  ⚠️ As credenciais de integração poderão ser configuradas após a criação do agente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/admin/monitoramento-ia/agentes')}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            className="bg-module-accent hover:bg-module-accent-hover"
            disabled={!formData.name.trim() || formData.name.length < 3}
          >
            <Save className="w-4 h-4 mr-2" />
            Criar Agente
          </Button>
        </div>
      </form>
    </div>
  );
};

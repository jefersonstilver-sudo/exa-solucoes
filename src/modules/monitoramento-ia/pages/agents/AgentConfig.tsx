import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgents } from '../../hooks/useAgents';
import { toast } from 'sonner';
import type { Agent, AgentType, IntegrationProvider } from '../../types/multiAgentTypes';

export const AgentConfig = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgentById, updateAgent } = useAgents();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: '',
    type: 'personalizado' as AgentType,
    status: 'active' as 'active' | 'inactive',
    model: '',
    temperature: 0.7,
    maxTokens: 2000,
    tone: 'friendly' as 'formal' | 'friendly' | 'technical',
    creativity: 'medium' as 'low' | 'medium' | 'high',
    formality: 'medium' as 'low' | 'medium' | 'high',
    phoneNumber: '',
    provider: 'none' as IntegrationProvider,
  });

  useEffect(() => {
    if (!id) return;
    
    const foundAgent = getAgentById(id);
    if (foundAgent) {
      setAgent(foundAgent);
      setFormData({
        name: foundAgent.name,
        description: foundAgent.description,
        avatar: foundAgent.avatar,
        type: foundAgent.type,
        status: foundAgent.status,
        model: foundAgent.config.model,
        temperature: foundAgent.config.temperature,
        maxTokens: foundAgent.config.maxTokens,
        tone: foundAgent.config.tone,
        creativity: foundAgent.config.creativity,
        formality: foundAgent.config.formality,
        phoneNumber: foundAgent.phoneNumber || '',
        provider: foundAgent.provider,
      });
    } else {
      toast.error('Agente não encontrado');
      navigate('/admin/monitoramento-ia/agentes');
    }
  }, [id, getAgentById, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !agent) return;

    updateAgent(id, {
      name: formData.name,
      description: formData.description,
      avatar: formData.avatar,
      type: formData.type,
      status: formData.status,
      phoneNumber: formData.phoneNumber || null,
      provider: formData.provider,
      config: {
        model: formData.model,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
        tone: formData.tone,
        creativity: formData.creativity,
        formality: formData.formality,
      },
    });
  };

  if (!agent) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2">
              ⚙ Configurações: {agent.name}
            </h1>
            <p className="text-module-secondary">
              Ajuste as configurações do agente
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
        {/* Informações Gerais */}
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <h2 className="text-lg font-bold text-module-primary mb-4">Informações Gerais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              />
            </div>

            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">Avatar</label>
              <input
                type="text"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
                maxLength={2}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-module-primary text-sm font-medium mb-2">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              />
            </div>

            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AgentType })}
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              >
                <option value="vendas">Vendas</option>
                <option value="diretoria">Diretoria</option>
                <option value="notificacao">Notificação</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Configurações de IA */}
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <h2 className="text-lg font-bold text-module-primary mb-4">Configurações de IA</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">Modelo LLM</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              />
            </div>

            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">
                Temperatura: {formData.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">Max Tokens</label>
              <input
                type="number"
                value={formData.maxTokens}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-module-primary text-sm font-medium mb-2">Tom</label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value as any })}
                  className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
                >
                  <option value="formal">Formal</option>
                  <option value="friendly">Amigável</option>
                  <option value="technical">Técnico</option>
                </select>
              </div>

              <div>
                <label className="block text-module-primary text-sm font-medium mb-2">Criatividade</label>
                <select
                  value={formData.creativity}
                  onChange={(e) => setFormData({ ...formData, creativity: e.target.value as any })}
                  className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-module-primary text-sm font-medium mb-2">Formalidade</label>
                <select
                  value={formData.formality}
                  onChange={(e) => setFormData({ ...formData, formality: e.target.value as any })}
                  className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Integração WhatsApp */}
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <h2 className="text-lg font-bold text-module-primary mb-4">Integração WhatsApp</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">Número</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+55 (11) 99999-9999"
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              />
            </div>

            <div>
              <label className="block text-module-primary text-sm font-medium mb-2">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as IntegrationProvider })}
                className="w-full bg-module-input border border-module rounded-lg p-3 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              >
                <option value="none">Nenhum</option>
                <option value="manychat">ManyChat</option>
                <option value="string">STRING.com</option>
                <option value="whatsapp-api">WhatsApp API</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-4 bg-module-input rounded-lg">
            <p className="text-module-tertiary text-sm">
              Status: {formData.provider === 'none' ? '🟡 Pendente de configuração' : '🟢 Configurado'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button type="submit" className="bg-module-accent hover:bg-module-accent-hover">
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
};

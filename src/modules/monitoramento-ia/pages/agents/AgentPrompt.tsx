import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Menu, X, Bot, Brain, Settings, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AgentChatPreview } from '../../components/agents/AgentChatPreview';
import { useSupabaseAgents } from '../../hooks/useSupabaseAgents';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const AgentPrompt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgentById, updateAgent } = useSupabaseAgents();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [config, setConfig] = useState<any>({});

  const agent = id ? getAgentById(id) : null;

  useEffect(() => {
    if (!id || !agent) {
      toast.error('Agente não encontrado');
      navigate('/admin/monitoramento-ia/agentes');
      return;
    }
    
    setConfig({
      display_name: agent.name,
      description: agent.description,
      is_active: agent.status === 'active',
      openai_config: {
        model: agent.config?.model || 'gpt-4o-mini',
        temperature: agent.config?.temperature || 0.7,
        max_tokens: agent.config?.maxTokens || 2000,
        tone: agent.config?.tone || 'friendly',
        creativity: agent.config?.creativity || 'medium',
        formality: agent.config?.formality || 'medium'
      },
      whatsapp_number: agent.phoneNumber,
      manychat_config: agent.integrationSettings?.manychat || {}
    });
  }, [id, agent, navigate]);

  const handleSave = async () => {
    if (!id) return;

    try {
      await updateAgent(id, {
        name: config.display_name,
        description: config.description,
        status: config.is_active ? 'active' : 'inactive',
        phoneNumber: config.whatsapp_number,
        config: {
          model: config.openai_config.model,
          temperature: config.openai_config.temperature,
          maxTokens: config.openai_config.max_tokens,
          tone: config.openai_config.tone,
          creativity: config.openai_config.creativity,
          formality: config.openai_config.formality
        },
        integrationSettings: {
          ...agent?.integrationSettings,
          manychat: config.manychat_config
        }
      });
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  if (!agent) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              {agent.avatar} Configuração: {agent.name}
            </h1>
            <p className="text-module-secondary">
              Configure todos os aspectos do comportamento e inteligência do agente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/monitoramento-ia/agentes')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={() => setShowPreview(true)}
              className="bg-module-accent hover:bg-module-accent-hover"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Testar Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-module-primary/10 border-module">
          <TabsTrigger value="info" className="data-[state=active]:!bg-[#9C1E1E] data-[state=active]:!text-white text-module-primary">
            <Settings className="mr-2 h-4 w-4" />
            Info & Config
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="data-[state=active]:!bg-[#9C1E1E] data-[state=active]:!text-white text-module-primary">
            <Brain className="mr-2 h-4 w-4" />
            Base de Conhecimento
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:!bg-[#9C1E1E] data-[state=active]:!text-white text-module-primary">
            <Zap className="mr-2 h-4 w-4" />
            Configuração IA
          </TabsTrigger>
        </TabsList>

        {/* Info & Config Tab */}
        <TabsContent value="info" className="space-y-6">
          <div className="bg-module-card rounded-[14px] border border-module p-6">
            <h3 className="text-xl font-bold text-module-primary mb-6 flex items-center gap-2">
              <Bot className="h-5 w-5 text-[#9C1E1E]" />
              Informações Básicas
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-module-primary mb-2 block">Nome de Exibição</Label>
                <Input
                  value={config.display_name || ''}
                  onChange={(e) => setConfig({ ...config, display_name: e.target.value })}
                  className="bg-module-input border-module text-module-primary"
                />
              </div>
              <div>
                <Label className="text-module-primary mb-2 block">Descrição</Label>
                <Input
                  value={config.description || ''}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="bg-module-input border-module text-module-primary"
                />
              </div>
              <div>
                <Label className="text-module-primary mb-2 block">Número WhatsApp</Label>
                <Input
                  value={config.whatsapp_number || ''}
                  onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })}
                  placeholder="+55 11 99999-9999"
                  className="bg-module-input border-module text-module-primary"
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-module">
                <div>
                  <Label className="text-module-primary block mb-1">Status do Agente</Label>
                  <p className="text-sm text-module-secondary">Ativar ou desativar este agente</p>
                </div>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge">
          <div className="bg-module-card rounded-[14px] border border-module p-8 text-center">
            <Brain className="h-16 w-16 text-module-secondary mx-auto mb-4" />
            <p className="text-module-secondary mb-2">
              Base de conhecimento configurada em página dedicada
            </p>
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/monitoramento-ia/agentes/${id}/base-conhecimento`)}
              className="border-module text-module-primary hover:bg-module-hover mt-4"
            >
              <Brain className="mr-2 h-4 w-4" />
              Ir para Base de Conhecimento
            </Button>
          </div>
        </TabsContent>

        {/* AI Config Tab */}
        <TabsContent value="ai" className="space-y-6">
          <div className="bg-module-card rounded-[14px] border border-module p-6">
            <h3 className="text-xl font-bold text-module-primary mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#9C1E1E]" />
              Configuração da IA
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-module-primary mb-2 block">Modelo</Label>
                <Input
                  value={config.openai_config?.model || 'gpt-4o-mini'}
                  onChange={(e) => setConfig({
                    ...config,
                    openai_config: { ...config.openai_config, model: e.target.value }
                  })}
                  className="bg-module-input border-module text-module-primary"
                />
              </div>
              <div>
                <Label className="text-module-primary mb-2 block">
                  Temperature: {config.openai_config?.temperature || 0.7}
                </Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.openai_config?.temperature || 0.7}
                  onChange={(e) => setConfig({
                    ...config,
                    openai_config: { ...config.openai_config, temperature: parseFloat(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-module-primary mb-2 block">
                  Max Tokens: {config.openai_config?.max_tokens || 2000}
                </Label>
                <input
                  type="range"
                  min="500"
                  max="4000"
                  step="100"
                  value={config.openai_config?.max_tokens || 2000}
                  onChange={(e) => setConfig({
                    ...config,
                    openai_config: { ...config.openai_config, max_tokens: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-module-primary mb-2 block">Tom</Label>
                <select
                  value={config.openai_config?.tone || 'friendly'}
                  onChange={(e) => setConfig({
                    ...config,
                    openai_config: { ...config.openai_config, tone: e.target.value }
                  })}
                  className="w-full bg-module-input border border-module text-module-primary rounded-md px-3 py-2"
                >
                  <option value="formal">Formal</option>
                  <option value="friendly">Amigável</option>
                  <option value="technical">Técnico</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-module-accent hover:bg-module-accent-hover"
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      {/* Chat Preview Modal */}
      {showPreview && agent && (
        <AgentChatPreview
          agent={{
            id: agent.id,
            key: agent.id,
            display_name: agent.name,
            type: 'ai' as const,
            description: agent.description,
            is_active: agent.status === 'active',
            whatsapp_number: agent.phoneNumber,
            whatsapp_provider: agent.whatsappProvider || null,
            zapi_config: agent.zapiConfig || null,
            openai_config: config.openai_config,
            routing_rules: [],
            ai_auto_response: false,
            kb_ids: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}

    </div>
  );
};

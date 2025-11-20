import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Menu, X, Bot, Brain, Settings, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SofiaKnowledgeManager } from '../../components/agents/SofiaKnowledgeManager';
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
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-black relative">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Elegant Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-red-950/95 via-red-900/90 to-black/95 backdrop-blur-xl border-r border-red-900/30 transform transition-transform duration-300 ease-in-out shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col p-6">
          {/* Agent Header */}
          <div className="mb-8 pb-6 border-b border-red-900/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-2xl shadow-lg">
                {agent.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{agent.name}</h2>
                <Badge className={cn(
                  "mt-1",
                  config.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                )}>
                  {config.is_active ? '● Ativo' : '○ Inativo'}
                </Badge>
              </div>
            </div>
            <p className="text-red-200/70 text-sm mt-2">{agent.description}</p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-red-900/30 hover:text-white"
              onClick={() => navigate('/admin/monitoramento-ia/agentes')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Agentes
            </Button>
          </nav>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
          >
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "lg:ml-72 transition-all duration-300",
        "min-h-screen"
      )}>
        <div className="max-w-7xl mx-auto p-6 lg:p-8 pt-20 lg:pt-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  Configuração Completa do Agente
                </h1>
                <p className="text-red-200/70">
                  Configure todos os aspectos do comportamento e inteligência do agente
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="border-red-900/30 text-white hover:bg-red-900/20"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Testar Preview
              </Button>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="bg-black/50 backdrop-blur-sm border border-red-900/30 p-1">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-white data-[state=active]:text-red-900 data-[state=inactive]:text-red-200/70"
              >
                <Settings className="mr-2 h-4 w-4" />
                Info & Config
              </TabsTrigger>
              <TabsTrigger
                value="knowledge"
                className="data-[state=active]:bg-white data-[state=active]:text-red-900 data-[state=inactive]:text-red-200/70"
              >
                <Brain className="mr-2 h-4 w-4" />
                Base de Conhecimento
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="data-[state=active]:bg-white data-[state=active]:text-red-900 data-[state=inactive]:text-red-200/70"
              >
                <Zap className="mr-2 h-4 w-4" />
                Configuração IA
              </TabsTrigger>
            </TabsList>

            {/* Info & Config Tab */}
            <TabsContent value="info" className="space-y-6">
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-red-900/30 p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-red-400" />
                  Informações Básicas
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-red-200/90 mb-2 block">Nome de Exibição</Label>
                    <Input
                      value={config.display_name || ''}
                      onChange={(e) => setConfig({ ...config, display_name: e.target.value })}
                      className="bg-black/30 border-red-900/30 text-white placeholder:text-red-200/30"
                    />
                  </div>
                  <div>
                    <Label className="text-red-200/90 mb-2 block">Descrição</Label>
                    <Input
                      value={config.description || ''}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      className="bg-black/30 border-red-900/30 text-white placeholder:text-red-200/30"
                    />
                  </div>
                  <div>
                    <Label className="text-red-200/90 mb-2 block">Número WhatsApp</Label>
                    <Input
                      value={config.whatsapp_number || ''}
                      onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })}
                      placeholder="+55 11 99999-9999"
                      className="bg-black/30 border-red-900/30 text-white placeholder:text-red-200/30"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-red-900/30">
                    <div>
                      <Label className="text-red-200/90 block mb-1">Status do Agente</Label>
                      <p className="text-sm text-red-200/50">Ativar ou desativar este agente</p>
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
              {agent.type === 'vendas' ? (
                <SofiaKnowledgeManager />
              ) : (
                <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-red-900/30 p-8 text-center">
                  <Brain className="h-16 w-16 text-red-400/50 mx-auto mb-4" />
                  <p className="text-red-200/70">
                    Base de conhecimento disponível apenas para Sofia
                  </p>
                </div>
              )}
            </TabsContent>

            {/* AI Config Tab */}
            <TabsContent value="ai" className="space-y-6">
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-red-900/30 p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-red-400" />
                  Configuração da IA
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-red-200/90 mb-2 block">Modelo</Label>
                    <Input
                      value={config.openai_config?.model || 'gpt-4o-mini'}
                      onChange={(e) => setConfig({
                        ...config,
                        openai_config: { ...config.openai_config, model: e.target.value }
                      })}
                      className="bg-black/30 border-red-900/30 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-red-200/90 mb-2 block">
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
                      className="w-full accent-red-600"
                    />
                  </div>
                  <div>
                    <Label className="text-red-200/90 mb-2 block">
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
                      className="w-full accent-red-600"
                    />
                  </div>
                  <div>
                    <Label className="text-red-200/90 mb-2 block">Tom</Label>
                    <select
                      value={config.openai_config?.tone || 'friendly'}
                      onChange={(e) => setConfig({
                        ...config,
                        openai_config: { ...config.openai_config, tone: e.target.value }
                      })}
                      className="w-full bg-black/30 border border-red-900/30 text-white rounded-md px-3 py-2"
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
        </div>
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
            openai_config: config.openai_config,
            routing_rules: [],
            manychat_config: config.manychat_config,
            manychat_connected: false,
            kb_ids: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Agent } from '../../hooks/useAgentConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, Trash2, Eye, Copy, RefreshCw } from 'lucide-react';
import { AgentChatPreview } from './AgentChatPreview';
import { ZAPIConfigSection } from './ZAPIConfigSection';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAgentStatus } from '../../hooks/useAgentStatus';

interface AgentConfigSectionProps {
  agent: Agent | undefined;
  onUpdate: (key: string, updates: Partial<Agent>) => Promise<void>;
}

const AVAILABLE_TOOLS = [
  { id: 'search_database', label: 'Buscar no Banco de Dados' },
  { id: 'create_alert', label: 'Criar Alerta' },
  { id: 'notify_directors', label: 'Notificar Diretores' },
  { id: 'notify_whatsapp', label: 'Notificar via WhatsApp' },
  { id: 'qualify_lead', label: 'Qualificar Lead' },
  { id: 'generate_report', label: 'Gerar Relatório' },
];

const AVAILABLE_CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'manychat', label: 'ManyChat' },
  { id: 'email', label: 'E-mail' },
  { id: 'webhook', label: 'Webhook' },
];

export const AgentConfigSection = ({ agent, onUpdate }: AgentConfigSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(agent || {} as Agent);
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  
  // Hook para testar status real da API
  const { statuses, testing, testAgent } = useAgentStatus();
  const agentStatus = statuses[agent.key];

  // Realtime sync - detectar mudanças na base de conhecimento
  useEffect(() => {
    const channel = supabase
      .channel(`agent-knowledge-${agent.key}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_knowledge',
          filter: `agent_key=eq.${agent.key}`
        },
        (payload) => {
          console.log('[REALTIME] Agent knowledge changed:', payload);
          setSyncStatus('syncing');
          
          // Forçar reload do preview
          setPreviewKey(prev => prev + 1);
          
          setTimeout(() => {
            setSyncStatus('synced');
            toast.success('Preview atualizado automaticamente', {
              description: 'Base de conhecimento sincronizada'
            });
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent.key]);

  if (!agent) {
    return (
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <p className="text-module-secondary">Agente não encontrado</p>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setLoading(true);
      await onUpdate(agent.key, {
        openai_config: config.openai_config,
        routing_rules: config.routing_rules,
        whatsapp_number: config.whatsapp_number,
        is_active: config.is_active
      });
      // Força reload do preview com nova configuração
      setPreviewKey(prev => prev + 1);
      toast.success('Configurações salvas! Preview atualizado.');
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = () => {
    switch (agent.key) {
      case 'sofia': return '🟣';
      case 'iris': return '💼';
      case 'exa_alert': return '🔔';
      case 'eduardo': return '👨‍💼';
      default: return '🤖';
    }
  };

  const handleTestConnection = async () => {
    await testAgent(agent.key, agent.display_name);
  };

  return (
    <div className="bg-module-card rounded-[14px] border border-module p-4 lg:p-6 max-w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">{getAgentIcon()}</span>
          <div className="min-w-0">
            <h2 className="text-xl lg:text-2xl font-bold text-module-primary truncate">{agent.display_name}</h2>
            <p className="text-sm text-module-secondary line-clamp-2">{agent.description}</p>
            
            {/* Badges de Status e Provedor */}
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Badge Z-API - Status Real da API */}
              {agent.whatsapp_provider === 'zapi' && agentStatus?.status === 'online' && (
                <Badge className="bg-green-500 text-white flex items-center gap-1">
                  ✓ Conectado via Z-API
                  {agentStatus.latency && (
                    <span className="text-xs opacity-80">({agentStatus.latency}ms)</span>
                  )}
                </Badge>
              )}
              
              {agent.whatsapp_provider === 'zapi' && agentStatus?.status === 'offline' && (
                <Badge variant="outline" className="border-red-500 text-red-600">
                  ✗ Z-API Offline
                </Badge>
              )}
              
              {agent.whatsapp_provider === 'zapi' && !agentStatus && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-gray-500 text-gray-600">
                    ⚪ Status não verificado
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={testing[agent.key]}
                    className="h-6 px-2 text-xs"
                  >
                    {testing[agent.key] ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Testar
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Badge sem integração */}
              {!agent.whatsapp_provider && (
                <Badge variant="outline" className="border-gray-500 text-gray-600">
                  ⚪ Sem integração WhatsApp
                </Badge>
              )}
              
              {/* Badge do Provedor */}
              {agent.whatsapp_provider === 'zapi' && (
                <Badge variant="outline" className="border-blue-500 text-blue-600">
                  🤖 Z-API
                </Badge>
              )}
              
              {agent.whatsapp_provider === 'manychat' && (
                <Badge variant="outline" className="border-purple-500 text-purple-600">
                  📱 ManyChat
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* Status de Sincronização */}
          {syncStatus === 'synced' && (
            <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
              <span className="text-xs">✅</span>
              <span className="text-xs">Preview Sincronizado</span>
            </Badge>
          )}
          {syncStatus === 'syncing' && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-600 gap-1">
              <span className="text-xs">⏳</span>
              <span className="text-xs">Aplicando mudanças...</span>
            </Badge>
          )}
          {syncStatus === 'error' && (
            <Badge variant="outline" className="border-red-500 text-red-600 gap-1">
              <span className="text-xs">❌</span>
              <span className="text-xs">Erro na sincronização</span>
            </Badge>
          )}
          
          {agent.key !== 'eduardo' && (
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Label className="text-module-primary text-sm">Ativo</Label>
            <Switch
              checked={config.is_active}
              onCheckedChange={async (checked) => {
                setConfig({ ...config, is_active: checked });
                // Salvar automaticamente no banco
                try {
                  await onUpdate(agent.key, { is_active: checked });
                  toast.success(checked ? 'Agente ativado!' : 'Agente desativado!');
                } catch (error) {
                  toast.error('Erro ao atualizar status do agente');
                  console.error(error);
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

      <Tabs defaultValue="config" className="w-full">
        <div className="mb-6 overflow-x-auto">
          <TabsList className="bg-module-card border border-module inline-flex min-w-full lg:min-w-0 flex-nowrap gap-1 p-1">
            <TabsTrigger 
              value="config" 
              className="data-[state=active]:bg-white data-[state=active]:text-module-accent data-[state=inactive]:text-module-secondary whitespace-nowrap px-4"
            >
              Configurações
            </TabsTrigger>
            <TabsTrigger 
              value="rules" 
              className="data-[state=active]:bg-white data-[state=active]:text-module-accent data-[state=inactive]:text-module-secondary whitespace-nowrap px-4"
            >
              Regras de Decisão
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="data-[state=active]:bg-white data-[state=active]:text-module-accent data-[state=inactive]:text-module-secondary whitespace-nowrap px-4"
            >
              Ferramentas & Canais
            </TabsTrigger>
            <TabsTrigger 
              value="connections" 
              className="data-[state=active]:bg-white data-[state=active]:text-module-accent data-[state=inactive]:text-module-secondary whitespace-nowrap px-4"
            >
              Conexões
            </TabsTrigger>
            <TabsTrigger
              value="info" 
              className="data-[state=active]:bg-white data-[state=active]:text-module-accent data-[state=inactive]:text-module-secondary whitespace-nowrap px-4"
            >
              Informações
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB: CONFIGURAÇÕES BÁSICAS */}
        <TabsContent value="config" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-module-primary font-medium">Modelo OpenAI</Label>
              <select
                value={config.openai_config?.model || 'gpt-4-turbo-preview'}
                onChange={(e) => setConfig({
                  ...config,
                  openai_config: { ...config.openai_config, model: e.target.value }
                })}
                className="w-full bg-module-card border border-module text-module-primary rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-module-accent"
              >
                <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-module-primary font-medium">Tom de Voz</Label>
              <select
                value={config.openai_config?.tone || 'friendly'}
                onChange={(e) => setConfig({
                  ...config,
                  openai_config: { ...config.openai_config, tone: e.target.value }
                })}
                className="w-full bg-module-card border border-module text-module-primary rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-module-accent"
              >
                <option value="friendly">Amigável</option>
                <option value="formal">Formal</option>
                <option value="technical">Técnico</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-module-primary font-medium">Temperatura</Label>
              <span className="text-sm font-semibold text-module-accent">{config.openai_config?.temperature || 0.7}</span>
            </div>
            <Input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.openai_config?.temperature || 0.7}
              onChange={(e) => setConfig({
                ...config,
                openai_config: { ...config.openai_config, temperature: parseFloat(e.target.value) }
              })}
              className="w-full accent-module-accent"
            />
            <p className="text-xs text-module-tertiary">
              0 = Mais preciso e determinístico | 2 = Mais criativo e variado
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-module-primary font-medium">Max Tokens</Label>
            <Input
              type="number"
              min="100"
              max="4000"
              step="100"
              value={config.openai_config?.max_tokens || 2000}
              onChange={(e) => setConfig({
                ...config,
                openai_config: { ...config.openai_config, max_tokens: parseInt(e.target.value) }
              })}
              className="bg-module-card border-module text-module-primary"
            />
            <p className="text-xs text-module-tertiary">
              Máximo de tokens na resposta (aprox. 4 tokens = 3 palavras)
            </p>
          </div>
        </TabsContent>

        {/* TAB: PROMPTS */}
        {/* TAB: REGRAS DE DECISÃO */}
        <TabsContent value="rules" className="space-y-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-module-primary text-lg">Regras de Roteamento</Label>
            <Button size="sm" variant="outline" className="border-module-accent text-module-accent hover:bg-module-accent hover:text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>
          
          <div className="space-y-3">
            {agent.routing_rules && agent.routing_rules.length > 0 ? (
              agent.routing_rules.map((rule: any, index: number) => (
                <div 
                  key={index} 
                  className="bg-module-card rounded-lg border border-module p-4 hover:border-module-accent transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-module-accent text-white text-xs rounded-full font-medium">
                          Prioridade: {rule.priority}
                        </span>
                        <h4 className="text-module-primary font-bold">{rule.name}</h4>
                      </div>
                      <p className="text-sm text-module-secondary mb-3">
                        Destino: <span className="text-module-accent font-medium">{rule.target}</span>
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-module-tertiary text-xs">Palavras-chave:</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(rule.match?.contains || rule.match?.any_of || []).map((keyword: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-module-input border border-module text-module-primary text-xs rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-module-tertiary text-xs">Ações:</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {rule.actions?.map((action: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-module-accent/20 border border-module-accent/40 text-module-accent text-xs rounded">
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-module-card rounded-lg border border-module p-8 text-center">
                <p className="text-module-secondary">Nenhuma regra configurada</p>
                <p className="text-xs text-module-tertiary mt-2">
                  Adicione regras de roteamento para automatizar o direcionamento de mensagens
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: FERRAMENTAS & CANAIS */}
        <TabsContent value="tools" className="space-y-6 pt-4">
          <div>
            <Label className="text-module-primary text-lg mb-3 block">Ferramentas Permitidas</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_TOOLS.map((tool) => (
                <div key={tool.id} className="flex items-center gap-3 bg-module-card p-3 rounded-lg border border-module">
                  <Checkbox 
                    id={tool.id}
                    className="border-module-accent data-[state=checked]:bg-module-accent"
                  />
                  <Label htmlFor={tool.id} className="text-module-primary text-sm cursor-pointer">
                    {tool.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-module-primary text-lg mb-3 block">Canais Permitidos</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_CHANNELS.map((channel) => (
                <div key={channel.id} className="flex items-center gap-3 bg-module-card p-3 rounded-lg border border-module">
                  <Checkbox 
                    id={channel.id}
                    className="border-module-accent data-[state=checked]:bg-module-accent"
                  />
                  <Label htmlFor={channel.id} className="text-module-primary text-sm cursor-pointer">
                    {channel.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB: CONEXÕES */}
        <TabsContent value="connections" className="space-y-4 pt-4">
          {/* Z-API Configuration */}
          {agent.whatsapp_provider === 'zapi' && (
              <ZAPIConfigSection 
                agentKey={agent.key} 
                zapiConfig={agent.zapi_config}
                whatsappNumber={agent.whatsapp_number}
                onConfigUpdate={() => setPreviewKey(prev => prev + 1)}
              />
          )}

          {/* ManyChat Configuration */}
          {agent.whatsapp_provider === 'manychat' && (
            <>
              {/* WhatsApp Config - Especial para Eduardo */}
              {agent.key === 'eduardo' && (
                <div className="bg-module-card rounded-lg border border-module p-4">
                  <Label className="text-module-primary text-lg mb-3 block">WhatsApp Business</Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-module-secondary text-sm">Número WhatsApp</Label>
                      <Input
                        value={config.whatsapp_number || '+5545991415856'}
                        onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })}
                        className="bg-module-input border-module text-module-primary mt-1"
                        placeholder="+55 45 99141-5856"
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-500 text-sm">Conectado ao ManyChat</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sem integração configurada */}
          {!agent.whatsapp_provider && (
            <div className="bg-module-card rounded-lg border border-module p-6 text-center">
              <p className="text-module-secondary">
                Este agente não possui integração WhatsApp configurada.
              </p>
            </div>
          )}

          {/* Base de Conhecimento */}
          <div className="bg-module-card rounded-lg border border-module p-4">
            <Label className="text-module-primary text-lg mb-3 block">Base de Conhecimento</Label>
            <div className="space-y-2">
              <p className="text-module-secondary text-sm">
                Documentos indexados: <span className="text-module-primary font-medium">{agent.kb_ids?.length || 0}</span>
              </p>
              <Button size="sm" variant="outline" className="border-module-accent text-module-accent hover:bg-module-accent hover:text-white">
                Gerenciar Documentos
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* TAB: INFORMAÇÕES */}
        <TabsContent value="info" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-module-card rounded-lg border border-module p-4">
              <Label className="text-module-tertiary text-xs">Tipo</Label>
              <p className="text-module-primary font-medium uppercase mt-1">{agent.type}</p>
            </div>
            <div className="bg-module-card rounded-lg border border-module p-4">
              <Label className="text-module-tertiary text-xs">Status</Label>
              <p className={`font-medium mt-1 ${agent.is_active ? 'text-green-500' : 'text-red-500'}`}>
                {agent.is_active ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            {agent.whatsapp_number && (
              <div className="bg-module-card rounded-lg border border-module p-4">
                <Label className="text-module-tertiary text-xs">WhatsApp</Label>
                <p className="text-module-primary mt-1">{agent.whatsapp_number}</p>
              </div>
            )}
            <div className="bg-module-card rounded-lg border border-module p-4">
              <Label className="text-module-tertiary text-xs">Criado em</Label>
              <p className="text-module-primary mt-1">{new Date(agent.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-module-card rounded-lg border border-module p-4">
              <Label className="text-module-tertiary text-xs">Última Atualização</Label>
              <p className="text-module-primary mt-1">{new Date(agent.updated_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-module-card rounded-lg border border-module p-4">
              <Label className="text-module-tertiary text-xs">ID do Agente</Label>
              <p className="text-module-primary mt-1 font-mono text-xs">{agent.id.slice(0, 8)}...</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 left-0 right-0 bg-module-primary pt-4 pb-4 border-t border-module mt-6">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-module-accent hover:bg-module-accent-hover text-white font-semibold py-6 shadow-lg"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? 'Salvando Alterações...' : 'Salvar Todas as Alterações'}
        </Button>
      </div>
    </div>
  );
};

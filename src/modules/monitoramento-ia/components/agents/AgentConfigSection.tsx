import { useState } from 'react';
import { Agent } from '../../hooks/useAgentConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Plus, Trash2 } from 'lucide-react';

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
        manychat_config: config.manychat_config,
        whatsapp_number: config.whatsapp_number,
        is_active: config.is_active
      });
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

  return (
    <div className="bg-module-card rounded-[14px] border border-module p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getAgentIcon()}</span>
          <div>
            <h2 className="text-2xl font-bold text-module-primary">{agent.display_name}</h2>
            <p className="text-sm text-module-secondary">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-module-primary">Ativo</Label>
          <Switch
            checked={config.is_active}
            onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
          />
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="bg-module-input border-module w-full">
          <TabsTrigger 
            value="config" 
            className="data-[state=active]:bg-module-accent data-[state=active]:text-white data-[state=inactive]:text-module-secondary data-[state=inactive]:hover:text-module-primary data-[state=inactive]:hover:bg-module-hover"
          >
            Configurações
          </TabsTrigger>
          <TabsTrigger 
            value="prompts" 
            className="data-[state=active]:bg-module-accent data-[state=active]:text-white data-[state=inactive]:text-module-secondary data-[state=inactive]:hover:text-module-primary data-[state=inactive]:hover:bg-module-hover"
          >
            Prompts
          </TabsTrigger>
          <TabsTrigger 
            value="rules" 
            className="data-[state=active]:bg-module-accent data-[state=active]:text-white data-[state=inactive]:text-module-secondary data-[state=inactive]:hover:text-module-primary data-[state=inactive]:hover:bg-module-hover"
          >
            Regras de Decisão
          </TabsTrigger>
          <TabsTrigger 
            value="tools" 
            className="data-[state=active]:bg-module-accent data-[state=active]:text-white data-[state=inactive]:text-module-secondary data-[state=inactive]:hover:text-module-primary data-[state=inactive]:hover:bg-module-hover"
          >
            Ferramentas & Canais
          </TabsTrigger>
          <TabsTrigger 
            value="connections" 
            className="data-[state=active]:bg-module-accent data-[state=active]:text-white data-[state=inactive]:text-module-secondary data-[state=inactive]:hover:text-module-primary data-[state=inactive]:hover:bg-module-hover"
          >
            Conexões
          </TabsTrigger>
          <TabsTrigger 
            value="info" 
            className="data-[state=active]:bg-module-accent data-[state=active]:text-white data-[state=inactive]:text-module-secondary data-[state=inactive]:hover:text-module-primary data-[state=inactive]:hover:bg-module-hover"
          >
            Informações
          </TabsTrigger>
        </TabsList>

        {/* TAB: CONFIGURAÇÕES BÁSICAS */}
        <TabsContent value="config" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-module-primary">Modelo OpenAI</Label>
              <select
                value={config.openai_config?.model || 'gpt-4-turbo-preview'}
                onChange={(e) => setConfig({
                  ...config,
                  openai_config: { ...config.openai_config, model: e.target.value }
                })}
                className="w-full bg-module-input border border-module text-module-primary rounded-md p-2 mt-1"
              >
                <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

            <div>
              <Label className="text-module-primary">Tom de Voz</Label>
              <select
                value={config.openai_config?.tone || 'friendly'}
                onChange={(e) => setConfig({
                  ...config,
                  openai_config: { ...config.openai_config, tone: e.target.value }
                })}
                className="w-full bg-module-input border border-module text-module-primary rounded-md p-2 mt-1"
              >
                <option value="friendly">Amigável</option>
                <option value="formal">Formal</option>
                <option value="technical">Técnico</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-module-primary">Temperatura ({config.openai_config?.temperature || 0.7})</Label>
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
              className="bg-module-input border-module text-module-primary mt-1"
            />
            <p className="text-xs text-module-tertiary mt-1">
              0 = Mais preciso e determinístico | 2 = Mais criativo e variado
            </p>
          </div>

          <div>
            <Label className="text-module-primary">Max Tokens</Label>
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
              className="bg-module-input border-module text-module-primary mt-1"
            />
            <p className="text-xs text-module-tertiary mt-1">
              Máximo de tokens na resposta (aprox. 4 tokens = 3 palavras)
            </p>
          </div>
        </TabsContent>

        {/* TAB: PROMPTS */}
        <TabsContent value="prompts" className="space-y-4 pt-4">
          <div>
            <Label className="text-white">Prompt Base (Sistema)</Label>
            <Textarea
              value={config.openai_config?.system_prompt || ''}
              onChange={(e) => setConfig({
                ...config,
                openai_config: { ...config.openai_config, system_prompt: e.target.value }
              })}
              placeholder="Ex: Você é Sofia, assistente de vendas da EXA. Seu objetivo é qualificar leads e identificar oportunidades..."
              className="bg-[#0A0A0A] border-[#2A2A2A] text-white min-h-[200px] mt-1 font-mono text-sm"
            />
            <p className="text-xs text-[#6B7280] mt-1">
              Instruções fundamentais que definem a personalidade e objetivos do agente
            </p>
          </div>

          <div>
            <Label className="text-white">Prompt Privado (Instruções Internas)</Label>
            <Textarea
              value={config.openai_config?.private_prompt || ''}
              onChange={(e) => setConfig({
                ...config,
                openai_config: { ...config.openai_config, private_prompt: e.target.value }
              })}
              placeholder="Ex: JAMAIS revelar informações internas. Sempre qualificar lead com score 0-100. Se score >= 75, notificar Eduardo..."
              className="bg-[#0A0A0A] border-[#2A2A2A] text-white min-h-[150px] mt-1 font-mono text-sm"
            />
            <p className="text-xs text-[#6B7280] mt-1">
              Regras internas que o agente deve seguir mas não revelar ao usuário
            </p>
          </div>

          <div>
            <Label className="text-white">Contexto Adicional</Label>
            <Textarea
              value={config.openai_config?.context || ''}
              onChange={(e) => setConfig({
                ...config,
                openai_config: { ...config.openai_config, context: e.target.value }
              })}
              placeholder="Ex: Informações sobre produtos, preços, processos internos..."
              className="bg-[#0A0A0A] border-[#2A2A2A] text-white min-h-[100px] mt-1 font-mono text-sm"
            />
            <p className="text-xs text-[#6B7280] mt-1">
              Contexto e informações relevantes para o agente consultar
            </p>
          </div>
        </TabsContent>

        {/* TAB: REGRAS DE DECISÃO */}
        <TabsContent value="rules" className="space-y-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-white text-lg">Regras de Roteamento</Label>
            <Button size="sm" variant="outline" className="border-[#9C1E1E] text-[#9C1E1E]">
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>
          
          <div className="space-y-3">
            {agent.routing_rules && agent.routing_rules.length > 0 ? (
              agent.routing_rules.map((rule: any, index: number) => (
                <div 
                  key={index} 
                  className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4 hover:border-[#9C1E1E] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-[#9C1E1E] text-white text-xs rounded-full font-medium">
                          Prioridade: {rule.priority}
                        </span>
                        <h4 className="text-white font-bold">{rule.name}</h4>
                      </div>
                      <p className="text-sm text-[#A0A0A0] mb-3">
                        Destino: <span className="text-[#9C1E1E] font-medium">{rule.target}</span>
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-[#6B7280] text-xs">Palavras-chave:</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(rule.match?.contains || rule.match?.any_of || []).map((keyword: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-[#1A1A1A] border border-[#2A2A2A] text-white text-xs rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-[#6B7280] text-xs">Ações:</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {rule.actions?.map((action: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-[#9C1E1E]/20 border border-[#9C1E1E]/40 text-[#9C1E1E] text-xs rounded">
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-8 text-center">
                <p className="text-[#A0A0A0]">Nenhuma regra configurada</p>
                <p className="text-xs text-[#6B7280] mt-2">
                  Adicione regras de roteamento para automatizar o direcionamento de mensagens
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: FERRAMENTAS & CANAIS */}
        <TabsContent value="tools" className="space-y-6 pt-4">
          <div>
            <Label className="text-white text-lg mb-3 block">Ferramentas Permitidas</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_TOOLS.map((tool) => (
                <div key={tool.id} className="flex items-center gap-3 bg-[#0A0A0A] p-3 rounded-lg border border-[#2A2A2A]">
                  <Checkbox 
                    id={tool.id}
                    className="border-[#9C1E1E] data-[state=checked]:bg-[#9C1E1E]"
                  />
                  <Label htmlFor={tool.id} className="text-white text-sm cursor-pointer">
                    {tool.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-white text-lg mb-3 block">Canais Permitidos</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_CHANNELS.map((channel) => (
                <div key={channel.id} className="flex items-center gap-3 bg-[#0A0A0A] p-3 rounded-lg border border-[#2A2A2A]">
                  <Checkbox 
                    id={channel.id}
                    className="border-[#9C1E1E] data-[state=checked]:bg-[#9C1E1E]"
                  />
                  <Label htmlFor={channel.id} className="text-white text-sm cursor-pointer">
                    {channel.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB: CONEXÕES */}
        <TabsContent value="connections" className="space-y-4 pt-4">
          {/* WhatsApp Config - Especial para Eduardo */}
          {agent.key === 'eduardo' && (
            <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4">
              <Label className="text-white text-lg mb-3 block">WhatsApp Business</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-[#A0A0A0] text-sm">Número WhatsApp</Label>
                  <Input
                    value={config.whatsapp_number || '+5545991415856'}
                    onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })}
                    className="bg-[#1A1A1A] border-[#2A2A2A] text-white mt-1"
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

          {/* ManyChat Config */}
          <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4">
            <Label className="text-white text-lg mb-3 block">ManyChat</Label>
            <div className="space-y-3">
              <div>
                <Label className="text-[#A0A0A0] text-sm">Flow ID</Label>
                <Input
                  value={config.manychat_config?.flowId || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    manychat_config: { ...config.manychat_config, flowId: e.target.value }
                  })}
                  className="bg-[#1A1A1A] border-[#2A2A2A] text-white mt-1"
                  placeholder="Flow ID do ManyChat"
                />
              </div>
              <div>
                <Label className="text-[#A0A0A0] text-sm">Channel ID</Label>
                <Input
                  value={config.manychat_config?.channelId || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    manychat_config: { ...config.manychat_config, channelId: e.target.value }
                  })}
                  className="bg-[#1A1A1A] border-[#2A2A2A] text-white mt-1"
                  placeholder="Channel ID do ManyChat"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.manychat_connected || false}
                  onCheckedChange={(checked) => setConfig({ ...config, manychat_connected: checked })}
                />
                <Label className="text-white text-sm">
                  {config.manychat_connected ? 'Conectado' : 'Desconectado'}
                </Label>
              </div>
            </div>
          </div>

          {/* Base de Conhecimento */}
          <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4">
            <Label className="text-white text-lg mb-3 block">Base de Conhecimento</Label>
            <div className="space-y-2">
              <p className="text-[#A0A0A0] text-sm">
                Documentos indexados: <span className="text-white font-medium">{agent.kb_ids?.length || 0}</span>
              </p>
              <Button size="sm" variant="outline" className="border-[#9C1E1E] text-[#9C1E1E]">
                Gerenciar Documentos
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* TAB: INFORMAÇÕES */}
        <TabsContent value="info" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4">
              <Label className="text-[#6B7280] text-xs">Tipo</Label>
              <p className="text-white font-medium uppercase mt-1">{agent.type}</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4">
              <Label className="text-[#6B7280] text-xs">Status</Label>
              <p className={`font-medium mt-1 ${agent.is_active ? 'text-green-500' : 'text-red-500'}`}>
                {agent.is_active ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            {agent.whatsapp_number && (
              <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4">
                <Label className="text-[#6B7280] text-xs">WhatsApp</Label>
                <p className="text-white mt-1">{agent.whatsapp_number}</p>
              </div>
            )}
            <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4">
              <Label className="text-[#6B7280] text-xs">Criado em</Label>
              <p className="text-white mt-1">{new Date(agent.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4">
              <Label className="text-[#6B7280] text-xs">Última Atualização</Label>
              <p className="text-white mt-1">{new Date(agent.updated_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4">
              <Label className="text-[#6B7280] text-xs">ID do Agente</Label>
              <p className="text-white mt-1 font-mono text-xs">{agent.id.slice(0, 8)}...</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full mt-6 bg-[#9C1E1E] hover:bg-[#7A1616] text-white"
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? 'Salvando...' : 'Salvar Todas as Alterações'}
      </Button>
    </div>
  );
};

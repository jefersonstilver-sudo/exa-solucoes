import { useState } from 'react';
import { Agent } from '../../hooks/useAgentConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';

interface AgentConfigSectionProps {
  agent: Agent | undefined;
  onUpdate: (key: string, updates: Partial<Agent>) => Promise<void>;
}

export const AgentConfigSection = ({ agent, onUpdate }: AgentConfigSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(agent || {} as Agent);

  if (!agent) {
    return (
      <div className="bg-[#1A1A1A] rounded-[14px] border border-[#2A2A2A] p-6">
        <p className="text-[#A0A0A0]">Agente não encontrado</p>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setLoading(true);
      await onUpdate(agent.key, {
        openai_config: config.openai_config,
        routing_rules: config.routing_rules,
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
    <div className="bg-[#1A1A1A] rounded-[14px] border border-[#2A2A2A] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getAgentIcon()}</span>
          <div>
            <h2 className="text-2xl font-bold text-white">{agent.display_name}</h2>
            <p className="text-sm text-[#A0A0A0]">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-white">Ativo</Label>
          <Switch
            checked={config.is_active}
            onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
          />
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="bg-[#0A0A0A]">
          <TabsTrigger value="config">Configurações</TabsTrigger>
          <TabsTrigger value="rules">Regras de Decisão</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4 pt-4">
          <div>
            <Label className="text-white">Modelo</Label>
            <Input
              value={config.openai_config?.model || ''}
              onChange={(e) => setConfig({
                ...config,
                openai_config: { ...config.openai_config, model: e.target.value }
              })}
              className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
            />
          </div>

          <div>
            <Label className="text-white">Temperatura ({config.openai_config?.temperature || 0.7})</Label>
            <Input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={config.openai_config?.temperature || 0.7}
              onChange={(e) => setConfig({
                ...config,
                openai_config: { ...config.openai_config, temperature: parseFloat(e.target.value) }
              })}
              className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
            />
          </div>

          <div>
            <Label className="text-white">Max Tokens</Label>
            <Input
              type="number"
              value={config.openai_config?.max_tokens || 2000}
              onChange={(e) => setConfig({
                ...config,
                openai_config: { ...config.openai_config, max_tokens: parseInt(e.target.value) }
              })}
              className="bg-[#0A0A0A] border-[#2A2A2A] text-white"
            />
          </div>

          <div>
            <Label className="text-white">Tom de Voz</Label>
            <select
              value={config.openai_config?.tone || 'friendly'}
              onChange={(e) => setConfig({
                ...config,
                openai_config: { ...config.openai_config, tone: e.target.value }
              })}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-md p-2"
            >
              <option value="friendly">Amigável</option>
              <option value="formal">Formal</option>
              <option value="technical">Técnico</option>
            </select>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 pt-4">
          <div>
            <Label className="text-white mb-2">Regras de Roteamento</Label>
            <div className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4">
              {agent.routing_rules && agent.routing_rules.length > 0 ? (
                <div className="space-y-3">
                  {agent.routing_rules.map((rule: any, index: number) => (
                    <div key={index} className="border-b border-[#2A2A2A] pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{rule.name}</span>
                        <span className="text-xs text-[#A0A0A0]">Prioridade: {rule.priority}</span>
                      </div>
                      <div className="text-sm text-[#A0A0A0]">
                        <p>Keywords: {(rule.match?.contains || rule.match?.any_of || []).join(', ')}</p>
                        <p>Ações: {rule.actions?.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#A0A0A0]">Nenhuma regra configurada</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#A0A0A0]">Tipo</Label>
              <p className="text-white font-medium uppercase">{agent.type}</p>
            </div>
            <div>
              <Label className="text-[#A0A0A0]">Status</Label>
              <p className={`font-medium ${agent.is_active ? 'text-green-500' : 'text-red-500'}`}>
                {agent.is_active ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            {agent.whatsapp_number && (
              <div>
                <Label className="text-[#A0A0A0]">WhatsApp</Label>
                <p className="text-white">{agent.whatsapp_number}</p>
              </div>
            )}
            <div>
              <Label className="text-[#A0A0A0]">Criado em</Label>
              <p className="text-white">{new Date(agent.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full mt-6 bg-[#9C1E1E] hover:bg-[#7A1616]"
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </div>
  );
};

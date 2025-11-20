import { Settings, Eye, Copy, Trash2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Agent } from '../types/multiAgentTypes';

interface AgentCardProps {
  agent: Agent;
  onManage: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRefresh?: () => void;
}

export const AgentCard = ({ agent, onManage, onPreview, onDuplicate, onDelete, onRefresh }: AgentCardProps) => {
  const [aiAutoResponse, setAiAutoResponse] = useState(agent.aiAutoResponse || false);
  const [updating, setUpdating] = useState(false);

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'manychat': return 'ManyChat';
      case 'string': return 'STRING.com';
      case 'whatsapp-api': return 'WhatsApp API';
      case 'zapi': return 'Z-API';
      default: return 'Nenhum';
    }
  };

  const handleToggleAI = async (checked: boolean) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({ ai_auto_response: checked })
        .eq('id', agent.id);

      if (error) throw error;

      setAiAutoResponse(checked);
      toast.success(
        checked 
          ? '🤖 IA ativada! Agente responderá automaticamente'
          : 'IA desativada'
      );
      
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error toggling AI:', error);
      toast.error('Erro ao atualizar IA: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vendas': return 'Vendas';
      case 'diretoria': return 'Diretoria';
      case 'notificacao': return 'Notificação';
      case 'personalizado': return 'Personalizado';
      default: return type;
    }
  };

  return (
    <div className="bg-module-card rounded-[14px] border border-module p-6 hover:border-module-accent transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{agent.avatar}</span>
          <div>
            <h3 className="text-lg font-bold text-module-primary">{agent.name}</h3>
            <p className="text-sm text-module-tertiary capitalize">{getTypeLabel(agent.type)}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          agent.status === 'active' 
            ? 'bg-green-500/10 text-green-500' 
            : 'bg-module-muted text-module-tertiary'
        }`}>
          {agent.status === 'active' ? '🟢 Ativo' : '⚫ Inativo'}
        </div>
      </div>

      <p className="text-module-secondary text-sm mb-4 line-clamp-2">
        {agent.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-module-tertiary mb-4 pb-4 border-b border-module">
        <div className="flex items-center gap-1">
          <span>Provider:</span>
          <span className="text-module-secondary font-medium">{getProviderLabel(agent.provider)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>WhatsApp:</span>
          <span className="text-module-secondary font-medium">
            {agent.phoneNumber || 'Não configurado'}
          </span>
        </div>
      </div>

      {/* Toggle IA Auto-Response */}
      {agent.whatsappProvider === 'zapi' && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  🤖 Resposta Automática IA
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Responde automaticamente usando IA treinada
                </p>
              </div>
            </div>
            <Switch 
              checked={aiAutoResponse}
              onCheckedChange={handleToggleAI}
              disabled={updating}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onManage}
          className="flex-1"
        >
          <Settings className="w-4 h-4 mr-2" />
          Gerenciar
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPreview}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDuplicate}
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDelete}
          className="text-red-500 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

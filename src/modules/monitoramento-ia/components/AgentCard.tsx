import { Settings, Eye, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Agent } from '../types/multiAgentTypes';

interface AgentCardProps {
  agent: Agent;
  onManage: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const AgentCard = ({ agent, onManage, onPreview, onDuplicate, onDelete }: AgentCardProps) => {
  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'manychat': return 'ManyChat';
      case 'string': return 'STRING.com';
      case 'whatsapp-api': return 'WhatsApp API';
      default: return 'Nenhum';
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

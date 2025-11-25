import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Check, CheckCheck, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Função para gerar cores diferentes por conversa
const getConversationColor = (identifier: string) => {
  const colors = [
    'hsl(210 70% 60%)', // azul
    'hsl(150 60% 50%)', // verde
    'hsl(280 60% 60%)', // roxo
    'hsl(40 80% 55%)',  // amarelo/dourado
    'hsl(340 70% 60%)', // rosa
    'hsl(180 60% 50%)', // ciano
    'hsl(20 75% 60%)',  // coral
    'hsl(260 65% 60%)', // azul violeta
    'hsl(100 60% 50%)', // verde lima
    'hsl(320 65% 60%)', // magenta
  ];
  
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
};

interface ConversationItemProps {
  conversation: any;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isSelected, onClick }) => {
  const hasUnread = conversation.awaiting_response;
  
  // Gerar cor única por conversa (usando phone como identificador)
  const avatarColor = getConversationColor(conversation.contact_phone || conversation.id);
  
  // Gerar iniciais do nome (primeiras letras de cada palavra)
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    const words = name.trim().split(' ').filter(w => w.length > 0);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + (words[words.length - 1][0] || '')).toUpperCase();
  };
  
  // Cor de fundo do card baseado no agent_key/número (para TODOS os cards, incluindo grupos)
  const getCardBgColor = () => {
    const name = conversation.contact_name?.toLowerCase() || '';
    const phone = conversation.contact_phone?.toLowerCase() || '';
    const agentKey = conversation.agent_key?.toLowerCase() || '';
    
    // Verificar por nome OU número/agent_key
    if (name.includes('eduardo') || phone.includes('eduardo') || agentKey.includes('eduardo')) {
      return 'hsl(150 60% 92%)'; // Verde bem visível
    }
    if (name.includes('sofia') || phone.includes('sofia') || agentKey.includes('sofia')) {
      return 'hsl(340 70% 92%)'; // Rosa bem visível
    }
    
    return undefined; // Outros mantêm cor padrão
  };
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-3 py-2 text-left transition-all relative group',
        'hover:bg-whatsapp-hover',
        isSelected && [
          'bg-whatsapp-hover',
          'border-l-4 border-whatsapp-green-light',
          'shadow-md'
        ]
      )}
      style={{ backgroundColor: getCardBgColor() }}
    >
      {/* Container principal */}
      <div className="flex items-center gap-3">
        {/* Avatar / Ícone */}
        <div 
          className="relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: avatarColor }}
        >
          {conversation.is_group ? (
            <Users className="w-5 h-5 text-white" />
          ) : (
            <span className="text-white font-semibold text-sm">
              {getInitials(conversation.contact_name)}
            </span>
          )}
          
          {/* Indicador de não lida */}
          {hasUnread && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-whatsapp-green-light rounded-full border-2 border-whatsapp-panel-bg" />
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 border-b border-whatsapp-border pb-2">
          <div className="flex items-start justify-between mb-1">
            {/* Nome */}
            <div className="flex-1 min-w-0 pr-2">
              <h3 className={cn(
                "text-[15px] truncate",
                hasUnread ? "font-semibold text-whatsapp-text-primary" : "font-normal text-whatsapp-text-primary"
              )}>
                {conversation.contact_name || conversation.contact_phone}
              </h3>
            </div>

            {/* Hora e badges */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn(
                "text-xs",
                hasUnread ? "text-whatsapp-green-light font-semibold" : "text-whatsapp-text-secondary"
              )}>
                {formatTime(conversation.last_message_at)}
              </span>
            </div>
          </div>

          {/* Última mensagem e badges de status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {/* Ícones de status para mensagens enviadas */}
              {conversation.last_message_direction === 'outbound' && (
                <CheckCheck className="w-4 h-4 text-whatsapp-icon-gray shrink-0" />
              )}
              
              <p className={cn(
                "text-[13px] truncate",
                hasUnread ? "text-whatsapp-text-primary font-medium" : "text-whatsapp-text-secondary"
              )}>
                {conversation.last_message || 'Nova conversa'}
              </p>
            </div>

            {/* Badges de prioridade */}
            <div className="flex items-center gap-1 ml-2 shrink-0">
              {hasUnread && (
                <div className="bg-whatsapp-green-light text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-semibold">
                  {conversation.unread_count || 1}
                </div>
              )}
              
              {conversation.is_critical && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              
              {conversation.is_hot_lead && (
                <TrendingUp className="w-4 h-4 text-orange-500" />
              )}
            </div>
          </div>

          {/* Badges informativos (pequenos, discretos) */}
          {(conversation.is_group || conversation.is_sindico) && (
            <div className="flex gap-1 mt-1">
              {conversation.is_group && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-whatsapp-green-light/30 text-whatsapp-green-light bg-transparent">
                  {conversation.contact_name ? `Grupo ${conversation.contact_name.split(' ')[0]}` : 'Grupo'}
                </Badge>
              )}
              {conversation.is_sindico && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-400/30 text-blue-600 bg-transparent">
                  Síndico
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

interface WhatsAppCRMInboxProps {
  conversations: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

export const WhatsAppCRMInbox: React.FC<WhatsAppCRMInboxProps> = ({ conversations, selectedId, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-whatsapp-text-secondary">
        <div className="animate-pulse">Carregando conversas...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-whatsapp-text-secondary">
        <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>Nenhuma conversa encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-whatsapp-panel-bg h-full overflow-y-auto">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isSelected={selectedId === conv.id}
          onClick={() => onSelect(conv.id)}
        />
      ))}
    </div>
  );
};
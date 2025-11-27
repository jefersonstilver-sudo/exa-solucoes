import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, TrendingUp, Clock, User, Phone, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatContactNameWithBuilding, buildConversationTitle, suggestContactType } from '@/modules/monitoramento-ia/utils/contactFormatters';

interface ConversationItemProps {
  conversation: any;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isSelected, onClick }) => {
  const hasUnread = conversation.awaiting_response;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left transition-all border border-module-border relative',
        'rounded-lg mb-2 bg-module-card',
        'hover:bg-gradient-to-r hover:from-[#25D366]/15 hover:to-[#25D366]/5 hover:border-l-4 hover:border-l-[#25D366] hover:shadow-md',
        isSelected && 'bg-gradient-to-r from-[#25D366]/25 to-[#25D366]/10 border-l-4 border-l-[#25D366] shadow-xl ring-2 ring-[#25D366]/20',
        hasUnread && 'border-l-4 border-l-[#25D366] bg-[#25D366]/8'
      )}
    >
      {/* Header com nome e badges */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative shrink-0">
            {conversation.is_group ? (
              <Users className={cn(
                "w-4 h-4",
                hasUnread ? "text-[#25D366]" : "text-muted-foreground"
              )} />
            ) : (
              <User className={cn(
                "w-4 h-4",
                hasUnread ? "text-[#25D366]" : "text-muted-foreground"
              )} />
            )}
            {hasUnread && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#25D366] rounded-full animate-pulse" />
            )}
          </div>
          
          {/* Título no formato: [Agente] — [Tipo] (Contato) */}
          <div className="flex-1 min-w-0">
            <span className={cn(
              "font-medium truncate block text-module-primary",
              hasUnread && "text-[#25D366] font-semibold"
            )}>
              {buildConversationTitle(conversation)}
            </span>
            
            {/* Badge de tipo - mobile friendly */}
            <div className="flex items-center gap-1 mt-0.5">
              {(() => {
                const contactType = conversation.contact_type || suggestContactType(conversation);
                const typeColors = {
                  'Síndico': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
                  'Prestador': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
                  'Administrativo': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
                  'Anunciante': 'bg-green-500/20 text-green-400 border-green-500/40',
                  'Equipe Exa': 'bg-primary/20 text-primary border-primary/40',
                  'Contato': 'bg-muted/30 text-muted-foreground border-muted'
                };
                
                return (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-4 border font-medium",
                      typeColors[contactType as keyof typeof typeColors] || typeColors['Contato']
                    )}
                  >
                    {contactType}
                  </Badge>
                );
              })()}
              
              {conversation.metadata?.agent_saved_name && (
                <span className="text-[10px]" title="Salvo pelo agente">📌</span>
              )}
            </div>
          </div>
          
          {conversation.is_group && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-[#25D366]/30 text-[#25D366]">
              GRUPO
            </Badge>
          )}
          {hasUnread && (
            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-[#25D366] hover:bg-[#20bd5a] animate-pulse">
              NOVA
            </Badge>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0">
          {conversation.is_critical && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Crítico
            </Badge>
          )}
          {conversation.is_hot_lead && (
            <Badge className="text-xs bg-orange-500 hover:bg-orange-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              Quente
            </Badge>
          )}
          {conversation.awaiting_response && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Aguardando
            </Badge>
          )}
        </div>
      </div>

      {/* Telefone e provider */}
      <div className="flex items-center gap-2 mb-2 text-xs text-module-secondary">
        <Phone className="w-3 h-3" />
        <span>{conversation.contact_phone}</span>
        <Badge className="text-xs bg-module-secondary text-module-primary border-module">
          {conversation.provider === 'manychat' ? 'ManyChat' : 'WhatsApp'}
        </Badge>
        <Badge className="text-xs bg-module-secondary text-module-primary border-module capitalize">
          {conversation.agent_key}
        </Badge>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-module-secondary">
          {formatDistanceToNow(new Date(conversation.last_message_at), {
            addSuffix: true,
            locale: ptBR
          })}
        </span>

        {/* Sentiment indicator */}
        <div
          className={cn(
            'px-2 py-0.5 rounded text-xs',
            conversation.sentiment === 'positive' && 'bg-green-500/20 text-green-400',
            conversation.sentiment === 'neutral' && 'bg-gray-500/20 text-gray-300',
            conversation.sentiment === 'negative' && 'bg-orange-500/20 text-orange-400',
            conversation.sentiment === 'angry' && 'bg-red-500/20 text-red-400'
          )}
        >
          {conversation.sentiment || 'neutro'}
        </div>
      </div>

      {/* Scores */}
      <div className="mt-2 flex gap-3 text-xs">
        <span className="text-module-secondary">
          Lead: <span className="font-medium text-module-primary">{conversation.lead_score || 0}/100</span>
        </span>
        <span className="text-module-secondary">
          Humor: <span className="font-medium text-module-primary">{conversation.mood_score || 50}/100</span>
        </span>
        {conversation.urgency_level > 0 && (
          <span className="text-orange-400 font-medium">
            Urgência: {conversation.urgency_level}/10
          </span>
        )}
        {conversation.is_sindico && (
          <Badge variant="outline" className="text-xs">Síndico</Badge>
        )}
      </div>
    </button>
  );
};

interface CRMInboxProps {
  conversations: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

export const CRMInbox: React.FC<CRMInboxProps> = ({ conversations, selectedId, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-module-secondary">
        Carregando conversas...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-module-secondary">
        Nenhuma conversa encontrada
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0">
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

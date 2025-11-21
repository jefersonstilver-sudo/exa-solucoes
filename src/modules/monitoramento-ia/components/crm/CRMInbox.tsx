import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, TrendingUp, Clock, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
  conversation: any;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left hover:bg-muted/50 transition-colors border-b',
        isSelected && 'bg-muted'
      )}
    >
      {/* Header com nome e badges */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium truncate">
            {conversation.contact_name || conversation.contact_phone}
          </span>
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
      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <Phone className="w-3 h-3" />
        <span>{conversation.contact_phone}</span>
        <Badge variant="outline" className="text-xs">
          {conversation.provider === 'manychat' ? 'ManyChat' : 'WhatsApp'}
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {conversation.agent_key}
        </Badge>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(conversation.last_message_at), {
            addSuffix: true,
            locale: ptBR
          })}
        </span>

        {/* Sentiment indicator */}
        <div
          className={cn(
            'px-2 py-0.5 rounded',
            conversation.sentiment === 'positive' && 'bg-green-500/20 text-green-700',
            conversation.sentiment === 'neutral' && 'bg-gray-500/20 text-gray-700',
            conversation.sentiment === 'negative' && 'bg-orange-500/20 text-orange-700',
            conversation.sentiment === 'angry' && 'bg-red-500/20 text-red-700'
          )}
        >
          {conversation.sentiment || 'neutro'}
        </div>
      </div>

      {/* Scores */}
      <div className="mt-2 flex gap-3 text-xs">
        <span className="text-muted-foreground">
          Lead: <span className="font-medium text-foreground">{conversation.lead_score || 0}/100</span>
        </span>
        <span className="text-muted-foreground">
          Humor: <span className="font-medium text-foreground">{conversation.mood_score || 50}/100</span>
        </span>
        {conversation.urgency_level > 0 && (
          <span className="text-orange-600 font-medium">
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
      <div className="p-8 text-center text-muted-foreground">
        Carregando conversas...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhuma conversa encontrada
      </div>
    );
  }

  return (
    <div className="divide-y">
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

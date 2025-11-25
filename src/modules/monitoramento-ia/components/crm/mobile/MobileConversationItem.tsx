import React from 'react';
import { User, AlertCircle, TrendingUp, Clock, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { formatContactName, formatPhoneSecondary } from '@/modules/monitoramento-ia/utils/contactFormatters';

interface MobileConversationItemProps {
  conversation: any;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export const MobileConversationItem: React.FC<MobileConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
  index
}) => {
  const hasUnread = conversation.awaiting_response;
  
  // Cores por agente
  const agentColors = {
    sofia: { bg: 'bg-blue-500/20', text: 'text-blue-600', border: 'border-blue-500/30' },
    eduardo: { bg: 'bg-purple-500/20', text: 'text-purple-600', border: 'border-purple-500/30' },
    exa_alert: { bg: 'bg-orange-500/20', text: 'text-orange-600', border: 'border-orange-500/30' }
  };
  
  const agentColor = agentColors[conversation.agent_key as keyof typeof agentColors] || agentColors.sofia;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'w-full px-4 py-3 text-left transition-all border-b border-module-border',
        'active:bg-[#25D366]/10 touch-manipulation',
        isSelected && 'bg-[#25D366]/10',
        hasUnread && 'bg-[#25D366]/5'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar com cor do agente */}
        <div className="relative shrink-0">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center border-2',
            agentColor.bg,
            agentColor.border,
            hasUnread && 'ring-2 ring-[#25D366] ring-offset-2'
          )}>
            <User className={cn('w-6 h-6', agentColor.text)} />
          </div>
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#25D366] rounded-full border-2 border-background animate-pulse" />
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Nome e Hora */}
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              'font-semibold truncate text-base',
              hasUnread ? 'text-[#25D366]' : 'text-module-primary'
            )}>
              {formatContactName(conversation.contact_name, conversation.contact_phone)}
            </span>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {formatDistanceToNow(new Date(conversation.last_message_at), {
                addSuffix: false,
                locale: ptBR
              }).replace('cerca de ', '').replace('aproximadamente ', '')}
            </span>
          </div>

          {/* Telefone e Provider */}
          <div className="flex items-center gap-2 mb-1.5">
            <Phone className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">
              {formatPhoneSecondary(conversation.contact_phone)}
            </span>
          </div>

          {/* Badges Compactos */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {hasUnread && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-[#25D366] hover:bg-[#20bd5a]">
                NOVA
              </Badge>
            )}
            
            {/* Indicador de Classificação */}
            {conversation.contact_type && conversation.contact_type_source && conversation.contact_type_source !== 'unknown' && (
              <Badge 
                variant={conversation.contact_type_source === 'manual' ? 'secondary' : 'outline'}
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {conversation.contact_type_source === 'manual' ? '👤' : '🤖'} {conversation.contact_type}
              </Badge>
            )}
            
            {conversation.is_critical && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                Crítico
              </Badge>
            )}
            {conversation.is_hot_lead && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-orange-500 hover:bg-orange-600">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                Hot
              </Badge>
            )}
            {conversation.awaiting_response && !hasUnread && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                <Clock className="w-2.5 h-2.5 mr-0.5" />
                Aguard
              </Badge>
            )}
            {conversation.is_sindico && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                Síndico
              </Badge>
            )}
            
            {/* Sentiment Indicator */}
            {conversation.sentiment && (
              <div className={cn(
                'text-[10px] px-1.5 py-0 h-4 rounded flex items-center',
                conversation.sentiment === 'positive' && 'bg-green-500/20 text-green-600',
                conversation.sentiment === 'neutral' && 'bg-gray-500/20 text-gray-600',
                conversation.sentiment === 'negative' && 'bg-orange-500/20 text-orange-600',
                conversation.sentiment === 'angry' && 'bg-red-500/20 text-red-600'
              )}>
                {conversation.sentiment === 'positive' && '😊'}
                {conversation.sentiment === 'neutral' && '😐'}
                {conversation.sentiment === 'negative' && '😟'}
                {conversation.sentiment === 'angry' && '😡'}
              </div>
            )}
          </div>

          {/* Scores (se houver) */}
          {(conversation.lead_score > 0 || conversation.mood_score > 0) && (
            <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
              {conversation.lead_score > 0 && (
                <span>Lead: {conversation.lead_score}</span>
              )}
              {conversation.mood_score > 0 && (
                <span>Humor: {conversation.mood_score}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

import { Loader2, MessageCircle, Phone, WifiOff, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ConversationGroup } from '../../hooks/useConversations';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useZAPIRealtimeMonitor } from '../../hooks/useZAPIRealtimeMonitor';
import { useEscalacoesPendentes } from '../../hooks/useEscalacoesPendentes';

interface ConversationListProps {
  conversations: ConversationGroup[];
  selectedConversation: string | null;
  onSelect: (phoneNumber: string, agentKey: string) => void;
  loading: boolean;
}

export const ConversationList = ({ 
  conversations, 
  selectedConversation, 
  onSelect,
  loading 
}: ConversationListProps) => {
  const { agentStatuses } = useZAPIRealtimeMonitor();
  const { phonesEscalados } = useEscalacoesPendentes();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header Mobile */}
      <div className="md:hidden p-4 border-b bg-[#25D366] text-white shrink-0">
        <h2 className="text-lg font-bold">Conversas</h2>
        <p className="text-xs opacity-90">
          {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'}
        </p>
      </div>

      {/* Lista */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
        {conversations.map((conv) => {
            const isSelected = selectedConversation === `${conv.phone_number}_${conv.agent_key}`;
            const hasUnread = conv.unread_count > 0;
            const agentStatus = agentStatuses[conv.agent_key];
            const isDisconnected = agentStatus?.status === 'disconnected';
            const isEscalated = phonesEscalados.includes(conv.phone_number);
            return (
              <button
                key={`${conv.phone_number}_${conv.agent_key}`}
                onClick={() => onSelect(conv.phone_number, conv.agent_key)}
                className={`
                  w-full text-left p-3 transition-all touch-manipulation
                  ${isSelected ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : 'bg-white dark:bg-[#111b21]'}
                  ${hasUnread ? 'border-l-4 border-l-[#25D366]' : ''}
                  hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]
                  active:bg-[#e9edef] dark:active:bg-[#1f2932]
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar - WhatsApp style */}
                  <div className="relative shrink-0">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
        hasUnread 
          ? 'bg-[#25D366] shadow-md shadow-green-500/30 animate-pulse' 
          : 'bg-[#dfe5e7] dark:bg-[#374045]'
      }`}>
                      <Phone className={`w-5 h-5 ${
                        hasUnread ? 'text-white' : 'text-[#54656f] dark:text-[#8696a0]'
                      }`} />
                    </div>
  {hasUnread && (
    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-[#25D366] rounded-full flex items-center justify-center px-1.5 shadow-lg animate-pulse">
      <span className="text-[11px] font-bold text-white">
        {conv.unread_count}
      </span>
    </div>
  )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className={`font-semibold text-sm md:text-base truncate ${
                        hasUnread ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {conv.contact_name || conv.phone_number}
                      </span>
                      <span className={`text-[10px] md:text-xs shrink-0 ${
                        hasUnread ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-muted-foreground'
                      }`}>
                        {formatDistanceToNow(new Date(conv.last_message_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>

                    <p className={`text-xs md:text-sm line-clamp-2 mb-2 ${
                      hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}>
                      {conv.last_message}
                    </p>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] md:text-xs px-1.5 py-0 h-5 ${
                          conv.agent_key === 'sofia' ? 'border-purple-500 text-purple-600' :
                          conv.agent_key === 'iris' ? 'border-blue-500 text-blue-600' :
                          'border-orange-500 text-orange-600'
                        }`}
                      >
                        {conv.agent_name}
                      </Badge>
                      {isDisconnected && (
                        <Badge variant="destructive" className="text-[10px] md:text-xs px-1.5 py-0 h-5 gap-1 animate-pulse">
                          <WifiOff className="w-3 h-3" />
                          Desconectado
                        </Badge>
                      )}
                      {isEscalated && (
                        <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 py-0 h-5 gap-1 border-amber-500 text-amber-500 bg-amber-500/10 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          Escalado
                        </Badge>
                      )}
                      {hasUnread && (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-[10px] md:text-xs px-1.5 py-0 h-5">
                          {conv.unread_count} nova{conv.unread_count > 1 ? 's' : ''}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {conv.total_messages} {conv.total_messages === 1 ? 'msg' : 'msgs'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
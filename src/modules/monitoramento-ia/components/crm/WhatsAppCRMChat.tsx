import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { StickyNote, Tag, User, Users, Phone, Video, Search, MoreVertical, Smile, Paperclip, Send, Mic } from 'lucide-react';
import { MediaInputBar } from './MediaInputBar';
import { ConversationNotes } from './ConversationNotes';
import { ConversationTags } from './ConversationTags';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppCRMChatProps {
  conversationId: string | null;
  messages: any[];
  loading: boolean;
  onRefresh: () => void;
}

// Função para gerar cores suaves por participante com melhor distribuição
const getParticipantColor = (identifier: string) => {
  const colors = [
    'hsl(210 85% 45%)', // azul forte
    'hsl(150 70% 40%)', // verde escuro
    'hsl(280 75% 50%)', // roxo
    'hsl(30 90% 45%)',  // laranja
    'hsl(340 80% 50%)', // rosa forte
    'hsl(180 70% 40%)', // ciano escuro
    'hsl(260 75% 50%)', // azul violeta
    'hsl(100 70% 35%)', // verde lima escuro
    'hsl(320 75% 45%)', // magenta
    'hsl(190 85% 40%)', // azul petróleo
  ];
  
  // Hash mais robusto usando múltiplos passes
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para 32bit integer
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const WhatsAppCRMChat: React.FC<WhatsAppCRMChatProps> = ({ conversationId, messages, loading, onRefresh }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<any>(null);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  const fetchConversation = async () => {
    if (!conversationId) return;
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (!error && data) {
      setConversation(data);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Ontem ${format(date, 'HH:mm')}`;
    } else {
      return format(date, "dd/MM/yyyy 'às' HH:mm");
    }
  };

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full bg-whatsapp-bg-chat">
        <div className="text-center text-whatsapp-text-secondary">
          <Users className="w-24 h-24 mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">WhatsApp CRM</h3>
          <p className="text-sm">Selecione uma conversa para visualizar as mensagens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col bg-whatsapp-bg-chat" style={{ 
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'a\' patternUnits=\'userSpaceOnUse\' width=\'20\' height=\'20\' patternTransform=\'scale(1) rotate(0)\'%3E%3Crect x=\'0\' y=\'0\' width=\'100%25\' height=\'100%25\' fill=\'hsla(40, 20%25, 92%25, 1)\'/%3E%3Cpath d=\'M10 0 L10 20 M0 10 L20 10\' stroke-width=\'0.2\' stroke=\'hsla(200, 10%25, 80%25, 0.15)\' fill=\'none\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'800%25\' height=\'800%25\' transform=\'translate(0,0)\' fill=\'url(%23a)\'/%3E%3C/svg%3E")',
        backgroundAttachment: 'fixed'
      }}>
        {/* Header estilo WhatsApp */}
        <div className="bg-whatsapp-panel-bg border-b border-whatsapp-border px-4 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              conversation?.is_group ? 'bg-whatsapp-icon-gray' : 'bg-whatsapp-green-light'
            )}>
              {conversation?.is_group ? (
                <Users className="w-5 h-5 text-white" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Nome e status */}
            <div className="flex-1 min-w-0">
              <h2 className="font-medium text-whatsapp-text-primary text-[15px] truncate">
                {conversation?.contact_name || conversation?.contact_phone || 'Conversa'}
              </h2>
              <p className="text-xs text-whatsapp-text-secondary truncate">
                {conversation?.contact_phone || 'Online'}
              </p>
            </div>
          </div>

          {/* Ações do header */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-whatsapp-icon-gray hover:bg-whatsapp-hover h-10 w-10"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-whatsapp-icon-gray hover:bg-whatsapp-hover h-10 w-10"
              onClick={() => setShowDetails(!showDetails)}
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Área de mensagens com scroll */}
        <div className="flex-1 overflow-y-auto px-16 py-4 space-y-2">
          {loading ? (
            <div className="text-center text-whatsapp-text-secondary py-8">
              <div className="animate-pulse">Carregando mensagens...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-whatsapp-text-secondary py-12">
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs mt-1">Inicie a conversa</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOutbound = msg.direction === 'outbound';
              const showTimestamp = index === 0 || 
                (new Date(msg.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000);

              // Extrair dados do raw_payload
              const isGroup = msg.raw_payload?.isGroup;
              const senderName = msg.raw_payload?.senderName;
              const participantPhone = msg.raw_payload?.participantPhone;
              const imageUrl = msg.raw_payload?.image?.imageUrl;
              const videoUrl = msg.raw_payload?.video?.videoUrl;

              // Cor apenas para o NOME do participante (não para a bolha)
              const senderNameColor = isGroup && !isOutbound && participantPhone
                ? getParticipantColor(participantPhone)
                : undefined;

              return (
                <React.Fragment key={msg.id}>
                  {/* Timestamp separador */}
                  {showTimestamp && (
                    <div className="flex justify-center my-4">
                      <span className="bg-whatsapp-panel-bg text-whatsapp-text-secondary text-xs px-3 py-1 rounded-lg shadow-sm">
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>
                  )}

                  {/* Mensagem */}
                  <div className={cn(
                    "flex items-end gap-2",
                    isOutbound ? "justify-end" : "justify-start"
                  )}>
                    <div
                      className={cn(
                        "max-w-[65%] px-3 py-2 rounded-lg shadow-sm relative",
                        isOutbound ? [
                          "bg-whatsapp-msg-out",
                          "rounded-br-none"
                        ] : [
                          "bg-whatsapp-msg-in",
                          "rounded-bl-none"
                        ]
                      )}
                    >
                      {/* Nome do remetente em grupos (apenas inbound) com cor diferente por pessoa */}
                      {!isOutbound && isGroup && senderName && (
                        <p 
                          className="text-xs font-semibold mb-1" 
                          style={{ color: senderNameColor || 'hsl(220 80% 40%)' }}
                        >
                          {senderName}
                        </p>
                      )}

                      {/* Imagem */}
                      {imageUrl && (
                        <img 
                          src={imageUrl} 
                          alt="Imagem" 
                          className="rounded-lg max-w-full max-h-72 mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                      )}

                      {/* Vídeo */}
                      {videoUrl && (
                        <video 
                          controls 
                          className="rounded-lg max-w-full max-h-72 mb-2"
                          preload="metadata"
                        >
                          <source src={videoUrl} />
                          Seu navegador não suporta o elemento de vídeo.
                        </video>
                      )}

                      {/* Corpo da mensagem */}
                      {msg.body && (
                        <p className="text-sm text-whatsapp-text-primary whitespace-pre-wrap break-words">
                          {msg.body}
                        </p>
                      )}

                      {/* Hora e status */}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[11px] text-whatsapp-text-secondary">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                        {isOutbound && msg.is_automated && (
                          <span className="text-[10px] text-whatsapp-icon-gray ml-1">🤖</span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          
          {/* Indicador de digitação */}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="bg-whatsapp-msg-in px-4 py-3 rounded-lg rounded-bl-none shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-whatsapp-icon-gray rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-whatsapp-icon-gray rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-whatsapp-icon-gray rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensagem estilo WhatsApp */}
        <div className="bg-whatsapp-panel-bg border-t border-whatsapp-border px-4 py-2">
          {conversation && (
            <MediaInputBar 
              phoneNumber={conversation.contact_phone} 
              agentKey={conversation.agent_key}
              conversationId={conversationId}
              onMessageSent={onRefresh} 
            />
          )}
        </div>
      </div>

      {/* Painel lateral de detalhes */}
      {conversation && (
        <LeadDetailDrawer
          conversationId={conversationId}
          open={showDetails}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};
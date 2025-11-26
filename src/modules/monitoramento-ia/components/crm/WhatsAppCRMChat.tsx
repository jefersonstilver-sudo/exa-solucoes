import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StickyNote, Tag, User, Users, Phone, Video, Search, MoreVertical, Smile, Paperclip, Send, Mic, Pencil, Check, X, Maximize2, Minimize2, MessageSquare } from 'lucide-react';
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
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
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

export const WhatsAppCRMChat: React.FC<WhatsAppCRMChatProps> = ({ conversationId, messages, loading, onRefresh, isFullscreen = false, onToggleFullscreen }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
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
      setEditedName(data.contact_name || '');
    }
  };

  const handleSaveName = async () => {
    if (!conversationId || !editedName.trim()) return;
    
    const { error } = await supabase
      .from('conversations')
      .update({ contact_name: editedName.trim() })
      .eq('id', conversationId);
    
    if (!error) {
      setConversation((prev: any) => ({ ...prev, contact_name: editedName.trim() }));
      setIsEditingName(false);
      onRefresh();
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
      <div className="flex flex-col items-center justify-center h-full bg-muted/20">
        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
          <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">
          Selecione uma conversa
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col bg-card/50 dark:bg-card/30">
        {/* Header minimalista */}
        <div className="bg-card/60 backdrop-blur-md border-b border-border/10 px-4 py-3 flex items-center justify-between">
          {/* Esquerda: Avatar + Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {conversation?.is_group ? (
                <Users className="w-5 h-5 text-primary/70" />
              ) : (
                <User className="w-5 h-5 text-primary/70" />
              )}
            </div>
            <div>
              <h2 className="font-medium text-sm text-foreground">
                {conversation?.contact_name || conversation?.contact_phone || 'Conversa'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {conversation?.is_group ? 'Grupo' : 'Online'}
              </p>
            </div>
          </div>
          
          {/* Direita: Ícones essenciais */}
          <div className="flex items-center gap-1">
            {onToggleFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFullscreen}
                title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetails(!showDetails)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 🤖 FASE 4: Aviso se Sofia pausada */}
        {conversation?.sofia_paused && conversation?.agent_key === 'sofia' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 mx-4 mt-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ <strong>Sofia pausada:</strong> Eduardo assumiu esta conversa
            </p>
          </div>
        )}

        {/* Área de mensagens com scroll */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-2">
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
                        "max-w-[75%] md:max-w-[60%] px-3 py-2 shadow-sm relative",
                        isOutbound ? [
                          "bg-whatsapp-msg-out",
                          "rounded-3xl rounded-br-md"
                        ] : [
                          "bg-whatsapp-msg-in",
                          "rounded-3xl rounded-bl-md"
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

        {/* Input de mensagem */}
        <div className="px-4 py-3 border-t border-border/10 bg-background">
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
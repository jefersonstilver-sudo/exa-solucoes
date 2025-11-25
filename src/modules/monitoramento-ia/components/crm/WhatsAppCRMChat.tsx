import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StickyNote, Tag, User, Users, Phone, Video, Search, MoreVertical, Smile, Paperclip, Send, Mic, Pencil, Check, X, Maximize2, Minimize2 } from 'lucide-react';
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
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
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
      <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-100/50 to-white/80 dark:from-slate-800/50 dark:to-gray-900/80">
        {/* Header estilo WhatsApp - Moderno */}
        <div className="bg-transparent backdrop-blur-sm border-b border-slate-200/30 dark:border-white/5 px-4 py-3 flex items-center justify-between">
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

            {/* Nome e status - editável */}
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName}>
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditingName(false)}>
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-whatsapp-text-primary text-[15px] truncate">
                      {conversation?.contact_name || conversation?.contact_phone || 'Conversa'}
                    </h2>
                    <p className="text-xs text-whatsapp-text-secondary truncate">
                      {conversation?.contact_phone || 'Online'}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-whatsapp-icon-gray hover:bg-whatsapp-hover"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Ações do header */}
          <div className="flex items-center gap-2">
            {onToggleFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                className="text-whatsapp-icon-gray hover:bg-whatsapp-hover h-10 w-10"
                onClick={onToggleFullscreen}
                title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>
            )}
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

        {/* 🤖 FASE 4: Aviso se Sofia pausada */}
        {conversation?.sofia_paused && conversation?.agent_key === 'sofia' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 mx-4 mt-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ <strong>Sofia pausada:</strong> Eduardo assumiu esta conversa
            </p>
          </div>
        )}

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
                        "max-w-[65%] px-3 py-2 shadow-sm relative",
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

        {/* Input de mensagem estilo WhatsApp - Moderno */}
        <div className="bg-transparent backdrop-blur-sm border-t border-slate-200/30 dark:border-white/5 px-4 py-3">
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
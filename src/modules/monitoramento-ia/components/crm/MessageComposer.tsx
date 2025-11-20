import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MessageComposerProps {
  phoneNumber: string;
  agentKey: string;
  conversationId?: string;
  onMessageSent?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  phoneNumber,
  agentKey,
  conversationId,
  onMessageSent
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configurar canal de presença para typing indicator
  useEffect(() => {
    if (!conversationId) return;

    typingChannelRef.current = supabase.channel(`typing:${conversationId}`);
    typingChannelRef.current.subscribe();

    return () => {
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
      }
    };
  }, [conversationId]);

  // Notificar quando começar a digitar
  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Enviar status "digitando"
    typingChannelRef.current?.track({
      user: 'operator',
      typing: true,
      timestamp: Date.now()
    });

    // Limpar status após 3 segundos de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      typingChannelRef.current?.track({
        user: 'operator',
        typing: false,
        timestamp: Date.now()
      });
    }, 3000);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey,
          phone: phoneNumber,
          message: message.trim()
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Mensagem enviada com sucesso');
        setMessage('');
        if (onMessageSent) onMessageSent();
      } else {
        throw new Error(data?.error || 'Erro ao enviar mensagem');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t bg-background">
      <Textarea
        placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para quebra de linha)"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTyping();
        }}
        onKeyDown={handleKeyDown}
        rows={2}
        className="resize-none flex-1"
        disabled={sending}
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || sending}
        size="icon"
        className="self-end"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};

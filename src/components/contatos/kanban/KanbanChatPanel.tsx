import React, { useEffect, useState } from 'react';
import { X, Send, Phone, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types/contatos';

interface Message {
  id: string;
  message_text: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
}

interface KanbanChatPanelProps {
  contact: Contact | null;
  onClose: () => void;
}

export const KanbanChatPanel: React.FC<KanbanChatPanelProps> = ({ 
  contact, 
  onClose 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (contact?.telefone) {
      fetchMessages();
    }
  }, [contact]);

  const fetchMessages = async () => {
    if (!contact?.telefone) return;

    setLoading(true);
    try {
      // Normalizar telefone para busca
      const normalizedPhone = contact.telefone.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('zapi_logs')
        .select('id, message_text, direction, created_at')
        .ilike('phone_number', `%${normalizedPhone}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setMessages((data as Message[])?.reverse() || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !contact) return;

    // Abrir WhatsApp Web com a mensagem pré-preenchida
    const phone = contact.telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(newMessage)}`;
    window.open(url, '_blank');
    setNewMessage('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const openWhatsAppWeb = () => {
    if (!contact?.telefone) return;
    const phone = contact.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}`, '_blank');
  };

  return (
    <Sheet open={!!contact} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-green-500 text-white">
                  {getInitials(contact?.nome || 'NC')}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-left text-base">
                  {contact?.nome || 'Contato'}
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {contact?.telefone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={openWhatsAppWeb}>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.open(`tel:${contact?.telefone}`, '_blank')}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Nenhuma mensagem encontrada</p>
              <p className="text-xs mt-1">As mensagens do WhatsApp aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm",
                    msg.direction === 'outbound' 
                      ? "ml-auto bg-green-500 text-white rounded-br-md"
                      : "mr-auto bg-gray-100 text-foreground rounded-bl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.message_text}</p>
                  <span className={cn(
                    "text-[10px] mt-1 block text-right",
                    msg.direction === 'outbound' ? "text-green-100" : "text-muted-foreground"
                  )}>
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Digite uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-white"
            />
            <Button 
              size="icon" 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-green-500 hover:bg-green-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Ao enviar, você será redirecionado para o WhatsApp Web
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Agent } from '../../hooks/useAgentConfig';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentChatPreviewProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentChatPreview = ({ agent, isOpen, onClose }: AgentChatPreviewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGreeting, setLoadingGreeting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carregar saudação dinâmica quando abrir
  useEffect(() => {
    if (isOpen) {
      loadInitialGreeting();
    }
  }, [isOpen, agent.key]);

  const loadInitialGreeting = async () => {
    setLoadingGreeting(true);
    setMessages([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-agent-greeting', {
        body: { agentKey: agent.key }
      });

      if (error) throw error;

      // Criar mensagens quebradas (simulando WhatsApp)
      const greetingMessages: Message[] = data.messages.map((content: string, index: number) => ({
        role: 'assistant' as const,
        content,
        timestamp: new Date(Date.now() + index * 800) // Delay simulado entre mensagens
      }));

      // Adicionar mensagens progressivamente
      for (let i = 0; i < greetingMessages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, i === 0 ? 0 : 800));
        setMessages(prev => [...prev, greetingMessages[i]]);
      }
    } catch (error) {
      console.error('Error loading greeting:', error);
      // Fallback para saudação padrão
      setMessages([{
        role: 'assistant',
        content: `Olá! Sou ${agent.display_name}. Como posso ajudar?`,
        timestamp: new Date()
      }]);
      toast.error('Erro ao carregar saudação do agente');
    } finally {
      setLoadingGreeting(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || loadingGreeting) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('agent-preview-chat', {
        body: {
          agentKey: agent.key,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in preview chat:', error);
      toast.error('Erro ao obter resposta do agente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        {/* Header tipo WhatsApp */}
        <div className="bg-[#075e54] text-white p-4 flex items-center gap-3">
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.key}`} />
            <AvatarFallback>{agent.display_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{agent.display_name}</p>
            <p className="text-xs opacity-80">Preview Mode - Simulação</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 bg-[#efeae2]" ref={scrollRef}>
          {loadingGreeting && messages.length === 0 && (
            <div className="flex justify-start mb-3">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-[#dcf8c6]'
                    : 'bg-white shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <span className="text-xs text-gray-500 mt-1 block">
                  {format(msg.timestamp, 'HH:mm')}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 bg-[#f0f0f0] border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem..."
            className="flex-1"
            disabled={isLoading || loadingGreeting}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || loadingGreeting || !input.trim()}
            className="bg-[#075e54] hover:bg-[#064e47]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Função removida - agora usa saudação dinâmica da base de conhecimento

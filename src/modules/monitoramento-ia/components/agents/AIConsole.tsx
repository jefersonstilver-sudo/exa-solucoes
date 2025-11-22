import { useState } from 'react';
import { Agent } from '../../hooks/useAgentConfig';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    tokens?: number;
    latency?: number;
    model?: string;
  };
}

interface AIConsoleProps {
  agents: Agent[];
}

export const AIConsole = ({ agents }: AIConsoleProps) => {
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>(agents[0]?.key || '');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !selectedAgentKey) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ia-console', {
        body: {
          agentKey: selectedAgentKey,
          message: input,
          context: {
            conversationHistory: messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Sem resposta',
        timestamp: new Date().toISOString(),
        metadata: {
          tokens: data.tokens,
          latency: data.latency,
          model: data.model
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (!data.credentialsPresent) {
        toast.warning('OpenAI não configurado. Veja as instruções na resposta.');
      }
    } catch (error: any) {
      toast.error('Erro ao enviar mensagem');
      console.error('[AIConsole] Error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `Erro: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const selectedAgent = agents.find(a => a.key === selectedAgentKey);

  return (
    <div className="bg-module-card rounded-[14px] border border-module p-6">
      <h2 className="text-xl font-bold text-module-primary mb-4">Console de IA</h2>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-500 font-medium mb-1">
              Console requer OPENAI_API_KEY
            </p>
            <p className="text-xs text-module-secondary">
              Configure no Supabase: Settings → Edge Functions → Secrets
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Label className="text-module-primary">Selecionar Agente</Label>
        <select
          value={selectedAgentKey}
          onChange={(e) => setSelectedAgentKey(e.target.value)}
          className="w-full bg-module-input border border-module text-module-primary rounded-md p-2 mt-1"
        >
          {agents.filter(a => a.type === 'ai').map(agent => (
            <option key={agent.key} value={agent.key}>
              {agent.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-module-input rounded-lg border border-module p-4 h-96 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <p className="text-module-secondary text-center mt-20">
            Nenhuma mensagem ainda. Envie uma mensagem para começar.
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${
                  msg.role === 'user'
                    ? 'bg-module-accent/20 ml-12'
                    : 'bg-module-secondary mr-12'
                } rounded-lg p-3`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-module-primary">
                    {msg.role === 'user' ? 'Você' : selectedAgent?.display_name}
                  </span>
                  <span className="text-xs text-module-tertiary">
                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-module-primary whitespace-pre-wrap">{msg.content}</p>
                {msg.metadata && (
                  <div className="flex gap-4 mt-2 text-xs text-module-tertiary">
                    {msg.metadata.tokens && <span>Tokens: {msg.metadata.tokens}</span>}
                    {msg.metadata.latency && <span>Latência: {msg.metadata.latency}ms</span>}
                    {msg.metadata.model && <span>Modelo: {msg.metadata.model}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Digite sua mensagem... (Enter para enviar)"
          className="bg-module-input border-module text-module-primary placeholder:text-module-muted"
          rows={3}
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-module-accent hover:bg-module-accent-hover text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

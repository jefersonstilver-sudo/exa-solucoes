import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAgents } from '../../hooks/useSupabaseAgents';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AgentPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgentById } = useSupabaseAgents();
  
  const [agent, setAgent] = useState<ReturnType<typeof getAgentById>>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!id) return;
    
    const foundAgent = getAgentById(id);
    if (foundAgent) {
      setAgent(foundAgent);
      // Mensagem inicial do agente
      setMessages([{
        role: 'assistant',
        content: `Olá! Eu sou ${foundAgent.name}. ${foundAgent.description}`,
        timestamp: new Date(),
      }]);
    } else {
      toast.error('Agente não encontrado');
      navigate('/admin/monitoramento-ia/agentes');
    }
  }, [id, getAgentById, navigate]);

  const handleSend = () => {
    if (!input.trim() || !agent) return;

    // Adiciona mensagem do usuário
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simula resposta do agente após um delay
    setTimeout(() => {
      const agentResponse: Message = {
        role: 'assistant',
        content: `Esta é uma simulação de resposta do agente ${agent.name}. Em produção, aqui seria conectado ao modelo de IA real baseado no prompt configurado.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 1000);
  };

  if (!agent) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              {agent.avatar} Preview: {agent.name}
            </h1>
            <p className="text-module-secondary">
              Teste o comportamento do agente em tempo real
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/monitoramento-ia/agentes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-module-card rounded-[14px] border border-module overflow-hidden">
        {/* Chat Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${
                message.role === 'user'
                  ? 'bg-module-accent text-white'
                  : 'bg-module-input text-module-primary'
              } rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {message.role === 'user' ? '👤 Você' : `${agent.avatar} ${agent.name}`}
                  </span>
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-module p-4 bg-module-input">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-module-card border border-module rounded-lg px-4 py-3 text-module-primary placeholder-module-muted focus:outline-none focus:ring-2 focus:ring-module-accent"
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-module-accent hover:bg-module-accent-hover"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <p className="text-yellow-500 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>Este é um preview mock. Nenhuma API real é chamada. As respostas são simuladas.</span>
        </p>
      </div>
    </div>
  );
};

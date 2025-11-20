import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PromptEditor } from '../../components/PromptEditor';
import { useAgents } from '../../hooks/useAgents';
import { toast } from 'sonner';

export const AgentPrompt = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgentById, updateAgent } = useAgents();
  
  const [prompt, setPrompt] = useState('');
  const [instructions, setInstructions] = useState<Array<{ id: number; condition: string; action: string }>>([]);
  const [forbiddenWords, setForbiddenWords] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    
    const agent = getAgentById(id);
    if (agent) {
      setPrompt(agent.prompt.masterPrompt);
      setInstructions(agent.prompt.conditionalInstructions);
      setForbiddenWords(agent.prompt.forbiddenWords);
    } else {
      toast.error('Agente não encontrado');
      navigate('/admin/monitoramento-ia/agentes');
    }
  }, [id, getAgentById, navigate]);

  const handleSave = () => {
    if (!id) return;

    updateAgent(id, {
      prompt: {
        masterPrompt: prompt,
        conditionalInstructions: instructions,
        forbiddenWords,
      },
    });
  };

  const agent = id ? getAgentById(id) : null;
  if (!agent) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              {agent.avatar} Prompt Base: {agent.name}
            </h1>
            <p className="text-module-secondary">
              Defina o comportamento e instruções do agente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/monitoramento-ia/agentes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={handleSave} className="bg-module-accent hover:bg-module-accent-hover">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {/* Prompt Mestre */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Prompt Mestre</h2>
        <p className="text-module-secondary text-sm mb-4">
          Este é o prompt base que define o comportamento geral do agente. Seja claro e específico.
        </p>
        <PromptEditor
          value={prompt}
          onChange={setPrompt}
          maxLength={5000}
          placeholder="Digite o prompt mestre do agente..."
          rows={15}
        />
      </div>

      {/* Instruções Condicionais */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-module-primary">Instruções Condicionais</h2>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Instrução
          </Button>
        </div>
        <div className="space-y-3">
          {instructions.map((instruction) => (
            <div 
              key={instruction.id}
              className="bg-module-input border border-module rounded-lg p-4 hover:border-module-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-module-primary font-medium mb-2">
                    ▸ {instruction.condition}
                  </p>
                  <p className="text-module-secondary text-sm">
                    Ação: {instruction.action}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Palavras Proibidas */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-module-primary">Palavras e Frases Proibidas</h2>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Mais
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {forbiddenWords.map((word, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <span className="text-red-500 text-sm">🚫</span>
              <span className="text-module-primary text-sm font-medium">{word}</span>
              <button className="text-module-tertiary hover:text-red-500 text-sm ml-1">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

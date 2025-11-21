import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bot, Thermometer, Hash, MessageSquare } from 'lucide-react';
import type { Agent } from '../../types/multiAgentTypes';

interface AgentInstructionsSectionProps {
  agent: Agent;
  onUpdate: (updates: Partial<Agent>) => void;
}

export const AgentInstructionsSection = ({ agent, onUpdate }: AgentInstructionsSectionProps) => {
  const handleUpdate = (updates: Partial<Agent>) => {
    onUpdate(updates);
  };

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Perfil do Agente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição Completa</Label>
            <Textarea
              value={agent.description}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              placeholder="Descreva completamente o papel e a identidade do agente..."
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Greeting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saudação Inicial</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={agent.prompt?.masterPrompt?.split('\n\n')[0] || ''}
            onChange={(e) => {
              const parts = agent.prompt?.masterPrompt?.split('\n\n') || [];
              parts[0] = e.target.value;
              handleUpdate({
                prompt: {
                  ...agent.prompt,
                  masterPrompt: parts.join('\n\n')
                }
              });
            }}
            placeholder="Como o agente deve se apresentar..."
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>

      {/* Mission and Tone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Missão e Tom</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tom de Comunicação</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={agent.config?.tone || 'friendly'}
              onChange={(e) => handleUpdate({
                config: {
                  ...agent.config,
                  tone: e.target.value as 'formal' | 'friendly' | 'technical'
                }
              })}
            >
              <option value="formal">Formal</option>
              <option value="friendly">Amigável</option>
              <option value="technical">Técnico</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Nível de Formalidade</Label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <Badge
                  key={level}
                  variant={agent.config?.formality === level ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleUpdate({
                    config: {
                      ...agent.config,
                      formality: level
                    }
                  })}
                >
                  {level === 'low' ? 'Baixa' : level === 'medium' ? 'Média' : 'Alta'}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nível de Criatividade</Label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <Badge
                  key={level}
                  variant={agent.config?.creativity === level ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleUpdate({
                    config: {
                      ...agent.config,
                      creativity: level
                    }
                  })}
                >
                  {level === 'low' ? 'Baixa' : level === 'medium' ? 'Média' : 'Alta'}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Parâmetros do Modelo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Temperatura</Label>
              <span className="text-sm text-muted-foreground">{agent.config?.temperature || 0.7}</span>
            </div>
            <Slider
              value={[agent.config?.temperature || 0.7]}
              onValueChange={([value]) => handleUpdate({
                config: {
                  ...agent.config,
                  temperature: value
                }
              })}
              min={0}
              max={1}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              Menor valor = mais consistente | Maior valor = mais criativo
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Máximo de Tokens
              </Label>
              <span className="text-sm text-muted-foreground">{agent.config?.maxTokens || 2000}</span>
            </div>
            <Slider
              value={[agent.config?.maxTokens || 2000]}
              onValueChange={([value]) => handleUpdate({
                config: {
                  ...agent.config,
                  maxTokens: value
                }
              })}
              min={500}
              max={4000}
              step={100}
            />
            <p className="text-xs text-muted-foreground">
              Limita o tamanho das respostas do agente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Typing Indicator Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Indicador de Digitação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label>Simular "Digitando..."</Label>
              <p className="text-sm text-muted-foreground">
                Mostra indicador de digitação para conversas mais naturais e humanizadas
              </p>
            </div>
            <Switch
              checked={agent.config?.typingIndicator || false}
              onCheckedChange={(checked) => {
                handleUpdate({
                  config: {
                    ...agent.config,
                    typingIndicator: checked
                  }
                });
              }}
            />
          </div>

          {agent.config?.typingIndicator && (
            <div className="space-y-2 pt-2 border-t">
              <Label>Velocidade de Digitação</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[agent.config?.typingSpeed || 50]}
                  onValueChange={([value]) => {
                    handleUpdate({
                      config: {
                        ...agent.config,
                        typingSpeed: value
                      }
                    });
                  }}
                  min={10}
                  max={100}
                  step={10}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-16 text-right">
                  {agent.config?.typingSpeed || 50}ms
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tempo por caractere (menor = mais rápido)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

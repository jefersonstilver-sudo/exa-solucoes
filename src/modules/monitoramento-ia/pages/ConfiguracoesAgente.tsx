/**
 * Page: Configurações da Agente IA
 * Mock UI para configuração da agente
 */

import { useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockAgentConfig } from '../utils/mockAIData';
import { toast } from 'sonner';

export const ConfiguracoesAgentePage = () => {
  const [config, setConfig] = useState(mockAgentConfig);

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              <Settings className="w-7 h-7" />
              Configurações da Agente IA
            </h1>
            <p className="text-module-secondary">
              Configure identidade, comportamento e limites da agente virtual
            </p>
          </div>
          <Button onClick={handleSave} className="bg-module-accent hover:bg-module-accent-hover">
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </div>

      {/* Identidade da Agente */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Identidade da Agente</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Nome da Agente
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Persona
            </label>
            <input
              type="text"
              value={config.persona}
              onChange={(e) => setConfig({ ...config, persona: e.target.value })}
              className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Tom de Voz
            </label>
            <div className="flex gap-2">
              {(['formal', 'friendly', 'technical'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setConfig({ ...config, tone })}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    config.tone === tone
                      ? 'bg-module-accent text-white border-module-accent'
                      : 'bg-module-input border-module text-module-secondary hover:border-module-accent'
                  }`}
                >
                  {tone === 'formal' ? 'Formal' : tone === 'friendly' ? 'Amigável' : 'Técnico'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Parâmetros Comportamentais */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Parâmetros Comportamentais</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Temperatura: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-module-tertiary mt-1">
              Controla a aleatoriedade das respostas (0 = preciso, 1 = criativo)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Máximo de Tokens
            </label>
            <input
              type="number"
              value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
              className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-module-secondary mb-2">
                Nível de Criatividade
              </label>
              <select
                value={config.creativity}
                onChange={(e) => setConfig({ ...config, creativity: e.target.value as any })}
                className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-module-secondary mb-2">
                Nível de Formalidade
              </label>
              <select
                value={config.formality}
                onChange={(e) => setConfig({ ...config, formality: e.target.value as any })}
                className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Regras de Segurança */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Regras de Segurança</h2>
        <div className="space-y-2">
          {config.safetyRules.map((rule, index) => (
            <label key={index} className="flex items-start gap-3 p-3 bg-module-input rounded-lg">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="mt-1 w-4 h-4 text-module-accent rounded focus:ring-2 focus:ring-module-accent"
              />
              <span className="text-module-secondary text-sm">{rule}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Limites e Diretrizes */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Limites e Diretrizes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Máx. Tentativas de Resposta
            </label>
            <input
              type="number"
              value={config.limits.maxAttempts}
              onChange={(e) => setConfig({ 
                ...config, 
                limits: { ...config.limits, maxAttempts: parseInt(e.target.value) }
              })}
              className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Timeout por Resposta (s)
            </label>
            <input
              type="number"
              value={config.limits.timeoutSeconds}
              onChange={(e) => setConfig({ 
                ...config, 
                limits: { ...config.limits, timeoutSeconds: parseInt(e.target.value) }
              })}
              className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none focus:ring-2 focus:ring-module-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Escalação Automática
            </label>
            <label className="flex items-center gap-2 p-3 bg-module-input rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={config.limits.autoEscalate}
                onChange={(e) => setConfig({ 
                  ...config, 
                  limits: { ...config.limits, autoEscalate: e.target.checked }
                })}
                className="w-4 h-4 text-module-accent rounded focus:ring-2 focus:ring-module-accent"
              />
              <span className="text-module-secondary text-sm">Ativo</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

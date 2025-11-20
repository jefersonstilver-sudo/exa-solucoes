/**
 * Page: Integração STRING.com
 * Mock UI para configurar integração com STRING.com
 */

import { useState } from 'react';
import { Plug, Save, TestTube, Copy, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegrationStatus } from '../components/IntegrationStatus';
import { mockStringIntegration } from '../utils/mockAIData';
import { toast } from 'sonner';

export const IntegracaoStringPage = () => {
  const [integration] = useState(mockStringIntegration);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  const handleTest = () => {
    toast.info('Testando conexão com STRING.com...');
    setTimeout(() => toast.warning('Integração ainda em configuração'), 1500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              <Plug className="w-7 h-7" />
              Integração STRING.com
            </h1>
            <p className="text-module-secondary">
              Configure a conexão com STRING.com para conversas inteligentes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleTest}>
              <TestTube className="w-4 h-4 mr-2" />
              Testar
            </Button>
            <Button onClick={handleSave} className="bg-module-accent hover:bg-module-accent-hover">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {/* Status da Integração */}
      <IntegrationStatus status={integration.status} />

      {/* Alerta de Configuração */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <BookOpen className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-module-primary font-semibold mb-1">
              Integração em Desenvolvimento
            </p>
            <p className="text-module-secondary text-sm">
              A integração com STRING.com será configurada em breve. Mantenha suas credenciais prontas 
              e acompanhe a documentação para instruções detalhadas de setup.
            </p>
          </div>
        </div>
      </div>

      {/* Configurações de Conexão */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Configurações de Conexão</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Agent ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={integration.agentId}
                readOnly
                className="flex-1 bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none"
              />
              <Button 
                variant="outline" 
                onClick={() => handleCopy(integration.agentId)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? "text" : "password"}
                value="string_api_key_secret_1234567890"
                readOnly
                className="flex-1 bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none"
              />
              <Button 
                variant="outline" 
                onClick={() => setShowApiKey(!showApiKey)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Endpoint URL
            </label>
            <input
              type="text"
              value={integration.endpoint}
              readOnly
              className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Workspace ID
            </label>
            <input
              type="text"
              value={integration.workspaceId}
              readOnly
              className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Fluxos de Conversação */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Fluxos de Conversação</h2>
        <div className="space-y-3">
          {integration.flows.map((flow) => (
            <div 
              key={flow.id}
              className="bg-module-input border border-module rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Plug className="w-5 h-5 text-module-accent" />
                  <div>
                    <p className="text-module-primary font-semibold">
                      {flow.name}
                    </p>
                    <p className="text-module-tertiary text-sm">
                      Status: {
                        flow.status === 'active' ? 'Ativo' : 
                        flow.status === 'development' ? 'Em Desenvolvimento' : 
                        'Aguardando Configuração'
                      }
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configurar Fluxo
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações Automáticas */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Ações Automáticas</h2>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 bg-module-input rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={integration.autoActions.autoRespond}
              readOnly
              className="mt-1 w-4 h-4 text-module-accent rounded focus:ring-2 focus:ring-module-accent"
            />
            <div>
              <p className="text-module-primary font-medium">Auto-responder durante horário comercial</p>
              <p className="text-module-tertiary text-sm">Responder automaticamente entre 8h-18h</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-module-input rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={integration.autoActions.escalateComplex}
              readOnly
              className="mt-1 w-4 h-4 text-module-accent rounded focus:ring-2 focus:ring-module-accent"
            />
            <div>
              <p className="text-module-primary font-medium">Escalonar casos complexos</p>
              <p className="text-module-tertiary text-sm">Transferir para humano quando necessário</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-module-input rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={integration.autoActions.logConversations}
              readOnly
              className="mt-1 w-4 h-4 text-module-accent rounded focus:ring-2 focus:ring-module-accent"
            />
            <div>
              <p className="text-module-primary font-medium">Registrar todas as conversas no Supabase</p>
              <p className="text-module-tertiary text-sm">Manter histórico completo de interações</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-module-input rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={integration.autoActions.integrateAlerts}
              readOnly
              className="mt-1 w-4 h-4 text-module-accent rounded focus:ring-2 focus:ring-module-accent"
            />
            <div>
              <p className="text-module-primary font-medium">Integrar com sistema de alertas</p>
              <p className="text-module-tertiary text-sm">Conectar com alertas de painéis offline</p>
            </div>
          </label>
        </div>
      </div>

      {/* Documentação */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Documentação</h2>
        <div className="space-y-2">
          <a 
            href="#"
            className="flex items-center gap-3 p-3 bg-module-input rounded-lg hover:border-module-accent transition-colors border border-transparent"
          >
            <BookOpen className="w-5 h-5 text-module-accent" />
            <span className="text-module-primary">Como integrar STRING.com com EXA</span>
          </a>
          <a 
            href="#"
            className="flex items-center gap-3 p-3 bg-module-input rounded-lg hover:border-module-accent transition-colors border border-transparent"
          >
            <BookOpen className="w-5 h-5 text-module-accent" />
            <span className="text-module-primary">Configuração de webhooks</span>
          </a>
          <a 
            href="#"
            className="flex items-center gap-3 p-3 bg-module-input rounded-lg hover:border-module-accent transition-colors border border-transparent"
          >
            <BookOpen className="w-5 h-5 text-module-accent" />
            <span className="text-module-primary">Exemplos de fluxos de conversação</span>
          </a>
        </div>
      </div>
    </div>
  );
};

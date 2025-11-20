/**
 * Page: Integração ManyChat
 * Mock UI para configurar integração com ManyChat
 */

import { useState } from 'react';
import { MessageCircle, Save, TestTube, Copy, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegrationStatus } from '../components/IntegrationStatus';
import { mockManyChatIntegration } from '../utils/mockAIData';
import { toast } from 'sonner';

export const IntegracaoManyChatPage = () => {
  const [integration] = useState(mockManyChatIntegration);
  const [showToken, setShowToken] = useState(false);

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  const handleTest = () => {
    toast.info('Testando conexão com ManyChat...');
    setTimeout(() => toast.success('Conexão estabelecida!'), 1500);
  };

  const handleSync = () => {
    toast.success('Sincronização iniciada!');
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
              <MessageCircle className="w-7 h-7" />
              Integração ManyChat
            </h1>
            <p className="text-module-secondary">
              Configure a conexão com ManyChat para automação de conversas
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
      <IntegrationStatus 
        status={integration.status}
        lastSync={integration.lastSync}
      />

      {/* Stats Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-module-card border border-module rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-module-accent mb-1">
            {integration.totalFlows}
          </p>
          <p className="text-module-secondary text-sm">Fluxos Ativos</p>
        </div>
        <div className="bg-module-card border border-module rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-module-accent mb-1">
            {integration.flows.reduce((acc, f) => acc + f.messagesCount, 0)}
          </p>
          <p className="text-module-secondary text-sm">Mensagens Hoje</p>
        </div>
        <div className="bg-module-card border border-module rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-module-accent mb-1">
            {integration.attributes.length}
          </p>
          <p className="text-module-secondary text-sm">Atributos Sincronizados</p>
        </div>
      </div>

      {/* Configurações de Conexão */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Configurações de Conexão</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              API Token
            </label>
            <div className="flex gap-2">
              <input
                type={showToken ? "text" : "password"}
                value="mc_token_1234567890abcdef"
                readOnly
                className="flex-1 bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none"
              />
              <Button 
                variant="outline" 
                onClick={() => setShowToken(!showToken)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-module-secondary mb-2">
              Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value="https://api.exa.com/webhooks/manychat"
                readOnly
                className="flex-1 bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none"
              />
              <Button 
                variant="outline" 
                onClick={() => handleCopy('https://api.exa.com/webhooks/manychat')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-module-secondary mb-2">
                Bot ID
              </label>
              <input
                type="text"
                value="mc_bot_12345"
                readOnly
                className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-module-secondary mb-2">
                Página Conectada
              </label>
              <select
                className="w-full bg-module-input border border-module rounded-lg px-4 py-2 text-module-primary focus:outline-none"
              >
                <option>EXA Oficial</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fluxos Conectados */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Fluxos Conectados</h2>
        <div className="space-y-3">
          {integration.flows.map((flow) => (
            <div 
              key={flow.id}
              className="bg-module-input border border-module rounded-lg p-4 hover:border-module-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-module-accent" />
                  <div>
                    <p className="text-module-primary font-semibold">
                      {flow.name}
                    </p>
                    <p className="text-module-tertiary text-sm">
                      Status: {flow.active ? 'Ativo' : 'Pausado'} | Msgs hoje: {flow.messagesCount}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    Ver Fluxo
                  </Button>
                  <Button variant="ghost" size="sm">
                    Configurar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Atributos Customizados */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-module-primary">
            Atributos Customizados (Sync com ManyChat)
          </h2>
          <Button variant="outline" size="sm" onClick={handleSync}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Agora
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {integration.attributes.map((attr, index) => (
            <label 
              key={index}
              className="flex items-center gap-3 p-3 bg-module-input rounded-lg cursor-pointer"
            >
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-4 h-4 text-module-accent rounded focus:ring-2 focus:ring-module-accent"
              />
              <span className="text-module-secondary text-sm font-medium">{attr}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Logs de Atividade */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-module-primary">
            Logs de Atividade (últimas 5)
          </h2>
          <Button variant="ghost" size="sm" className="text-module-accent">
            Ver Todos
          </Button>
        </div>
        <div className="space-y-2">
          {integration.logs.map((log) => (
            <div 
              key={log.id}
              className="flex items-center gap-3 p-3 bg-module-input rounded-lg"
            >
              <div className={`w-2 h-2 rounded-full ${
                log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div className="flex-1">
                <p className="text-module-primary text-sm">
                  {log.timestamp} - {log.message}
                </p>
              </div>
              <span className={`text-xs font-medium ${
                log.status === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
                {log.status === 'success' ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

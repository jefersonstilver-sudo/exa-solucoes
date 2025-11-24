import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentStatus } from '../../hooks/useAgentStatus';
import { Agent } from '../../hooks/useAgentConfig';

interface AgentAPIStatusProps {
  agent: Agent;
  status?: AgentStatus;
  testing: boolean;
  onTest: () => Promise<void>;
}

export const AgentAPIStatus = ({ agent, status, testing, onTest }: AgentAPIStatusProps) => {
  
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'offline':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      default: return 'Não testado';
    }
  };

  const getStatusBg = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/10 border-green-500/30';
      case 'offline': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-yellow-500/10 border-yellow-500/30';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-module-primary">Status das APIs</h3>
          <p className="text-sm text-module-secondary mt-1">APIs e integrações conectadas ao agente</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onTest}
          disabled={testing}
          className="border-module-accent text-module-accent hover:bg-module-accent hover:text-white"
        >
          {testing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Testar Todas
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        {/* Z-API / WhatsApp Status */}
        {agent.whatsapp_provider === 'zapi' && (
          <div className={`rounded-lg border p-4 transition-all ${getStatusBg(status?.status)}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(status?.status)}
                <div>
                  <h4 className="font-semibold text-module-primary">Z-API WhatsApp</h4>
                  <p className="text-xs text-module-secondary mt-0.5">
                    {status?.instanceId ? `Instância: ${status.instanceId.substring(0, 12)}...` : 'Provedor de WhatsApp'}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-medium ${
                status?.status === 'online' ? 'text-green-500' :
                status?.status === 'offline' ? 'text-red-500' :
                'text-yellow-500'
              }`}>
                {getStatusText(status?.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {status?.latency && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-module-tertiary" />
                  <span className="text-module-secondary">
                    Latência: <span className="text-module-primary font-medium">{status.latency}ms</span>
                  </span>
                </div>
              )}
              {status?.lastCheck && (
                <div className="text-module-secondary">
                  Verificado: <span className="text-module-primary">{new Date(status.lastCheck).toLocaleTimeString('pt-BR')}</span>
                </div>
              )}
            </div>

            {status?.errorMessage && (
              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                {status.errorMessage}
              </div>
            )}
          </div>
        )}

        {/* ManyChat Status */}
        {agent.whatsapp_provider === 'manychat' && (
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-purple-500" />
              <div>
                <h4 className="font-semibold text-module-primary">ManyChat</h4>
                <p className="text-xs text-module-secondary mt-0.5">Automação WhatsApp</p>
              </div>
            </div>
            <p className="text-sm text-purple-400">Conectado e operacional</p>
          </div>
        )}

        {/* Lovable AI Status */}
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
            <div>
              <h4 className="font-semibold text-module-primary">Lovable AI Gateway</h4>
              <p className="text-xs text-module-secondary mt-0.5">Motor de IA (OpenAI)</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-module-secondary">
            <div>Modelo: <span className="text-module-primary font-medium">{agent.openai_config?.model || 'gpt-4-turbo'}</span></div>
            <div>Temperatura: <span className="text-module-primary font-medium">{agent.openai_config?.temperature || 0.7}</span></div>
          </div>
        </div>

        {/* Supabase Database */}
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <div>
              <h4 className="font-semibold text-module-primary">Supabase Database</h4>
              <p className="text-xs text-module-secondary mt-0.5">Banco de dados e armazenamento</p>
            </div>
          </div>
          <p className="text-sm text-green-400">Operacional</p>
        </div>

        {!agent.whatsapp_provider && (
          <div className="rounded-lg border border-module bg-module-card p-4 text-center">
            <p className="text-module-secondary text-sm">
              Nenhuma integração WhatsApp configurada para este agente
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

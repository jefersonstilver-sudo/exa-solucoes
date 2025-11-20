import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentStatus } from '../../hooks/useAgentStatus';

interface APIStatusGridProps {
  agents: Array<{
    key: string;
    display_name: string;
    description: string;
    is_active: boolean;
    whatsapp_provider: string | null;
  }>;
  statuses: Record<string, AgentStatus>;
  testing: Record<string, boolean>;
  onTest: (agentKey: string, displayName: string) => Promise<any>;
}

const getAgentIcon = (key: string) => {
  const icons: Record<string, string> = {
    sofia: '🟣',
    iris: '💼',
    exa_alert: '🔔',
    eduardo: '👨‍💼'
  };
  return icons[key] || '🤖';
};

const getProviderName = (provider: string | null) => {
  if (!provider) return 'Não configurado';
  if (provider === 'zapi') return 'Z-API';
  if (provider === 'manychat') return 'ManyChat';
  return provider;
};

export const APIStatusGrid = ({ agents, statuses, testing, onTest }: APIStatusGridProps) => {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online':
        return 'Operacional';
      case 'offline':
        return 'Offline';
      default:
        return 'Pendente';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'offline':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const activeAgents = agents.filter(agent => agent.is_active);

  if (activeAgents.length === 0) {
    return (
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-xl font-bold text-module-primary mb-4">Status dos Agentes</h2>
        <p className="text-module-secondary">Nenhum agente ativo. Ative os agentes nas respectivas abas.</p>
      </div>
    );
  }

  return (
    <div className="bg-module-card rounded-[14px] border border-module p-6">
      <h2 className="text-xl font-bold text-module-primary mb-4">Status dos Agentes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeAgents.map((agent) => {
          const status = statuses[agent.key];
          const isLoading = testing[agent.key];

          return (
            <div 
              key={agent.key}
              className="bg-module-input rounded-lg border border-module p-4 hover:border-module-muted transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getAgentIcon(agent.key)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status?.status)}
                      <span className="text-module-primary font-medium">{agent.display_name}</span>
                    </div>
                    <p className="text-xs text-module-tertiary mt-0.5">
                      {getProviderName(agent.whatsapp_provider)}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${getStatusColor(status?.status)}`}>
                  {getStatusText(status?.status)}
                </span>
              </div>

              <p className="text-sm text-module-secondary mb-3">{agent.description}</p>

              {status?.lastCheck && (
                <p className="text-xs text-module-tertiary mb-2">
                  Última verificação: {new Date(status.lastCheck).toLocaleTimeString('pt-BR')}
                </p>
              )}

              {status?.latency && (
                <p className="text-xs text-module-tertiary mb-2">
                  Latência: {status.latency}ms
                </p>
              )}

              {status?.instanceId && (
                <p className="text-xs text-module-tertiary mb-2">
                  Instância: {status.instanceId.substring(0, 8)}...
                </p>
              )}

              {status?.credentialsPresent === false && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mb-3">
                  <p className="text-xs text-yellow-500">
                    ⚠️ Credenciais não configuradas
                  </p>
                </div>
              )}

              {status?.errorMessage && (
                <div className={`rounded p-2 mb-3 ${
                  status.status === 'pending' 
                    ? 'bg-yellow-500/10 border border-yellow-500/20' 
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  <p className={`text-xs ${
                    status.status === 'pending' ? 'text-yellow-500' : 'text-red-400'
                  }`}>
                    {status.errorMessage}
                  </p>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onTest(agent.key, agent.display_name)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

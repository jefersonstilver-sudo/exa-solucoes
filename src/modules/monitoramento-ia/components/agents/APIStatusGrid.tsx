import { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Bug, Settings, Bot, Sparkles, Building2, Bell, UserCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentStatus } from '../../hooks/useAgentStatus';
import { AgentDebugPanel } from './AgentDebugPanel';
import { ZAPICredentialsModal } from './ZAPICredentialsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface APIStatusGridProps {
  agents: Array<{
    key: string;
    display_name: string;
    description: string;
    is_active: boolean;
    whatsapp_provider: string | null;
    manychat_config?: {
      auto_sync_enabled?: boolean;
      auto_sync_interval?: number;
      last_sync_at?: string;
    };
  }>;
  statuses: Record<string, AgentStatus>;
  testing: Record<string, boolean>;
  onTest: (agentKey: string, displayName: string) => Promise<any>;
}

const getAgentIcon = (key: string): JSX.Element => {
  const icons: Record<string, JSX.Element> = {
    sofia: <Sparkles className="w-5 h-5 text-[#9C1E1E]" />,
    iris: <Building2 className="w-5 h-5 text-[#9C1E1E]" />,
    exa_alert: <Bell className="w-5 h-5 text-[#9C1E1E]" />,
    eduardo: <UserCircle className="w-5 h-5 text-[#9C1E1E]" />
  };
  return icons[key] || <Bot className="w-5 h-5 text-[#9C1E1E]" />;
};

const getProviderName = (provider: string | null) => {
  if (!provider) return 'Não configurado';
  if (provider === 'zapi') return 'Z-API';
  return provider;
};

export const APIStatusGrid = ({ agents, statuses, testing, onTest }: APIStatusGridProps) => {
  const [debugAgent, setDebugAgent] = useState<{ key: string; name: string } | null>(null);
  const [configAgent, setConfigAgent] = useState<{ 
    key: string; 
    provider: 'zapi'; 
    config: any 
  } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  
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

  const handleConfigureAgent = async (agentKey: string, provider: string) => {
    setLoadingConfig(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('zapi_config')
        .eq('key', agentKey)
        .single();

      if (error) throw error;

      setConfigAgent({ 
        key: agentKey, 
        provider: 'zapi',
        config: data?.zapi_config || {} 
      });
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configuração do agente');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveConfig = async (agentKey: string, config: any) => {
    try {
      toast.success('Configuração salva com sucesso');
      setConfigAgent(null);
      
      // Re-testar o agente após salvar
      const agent = agents.find(a => a.key === agentKey);
      if (agent) {
        setTimeout(() => onTest(agentKey, agent.display_name), 500);
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
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
                  <p className="text-xs text-yellow-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Credenciais não configuradas
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

              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTest(agent.key, agent.display_name)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDebugAgent({ key: agent.key, name: agent.display_name })}
                >
                  <Bug className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConfigureAgent(agent.key, agent.whatsapp_provider || 'zapi')}
                  disabled={loadingConfig}
                >
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {debugAgent && (
        <AgentDebugPanel
          agentKey={debugAgent.key}
          displayName={debugAgent.name}
          open={!!debugAgent}
          onClose={() => setDebugAgent(null)}
        />
      )}

      {configAgent && (
        <ZAPICredentialsModal
          open={true}
          onOpenChange={(open) => !open && setConfigAgent(null)}
          agentKey={configAgent.key}
          currentConfig={configAgent.config}
          onSave={(config) => handleSaveConfig(configAgent.key, config)}
        />
      )}
    </div>
  );
};

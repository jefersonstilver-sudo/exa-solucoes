import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APIStatus } from '../../hooks/useAPIStatus';

interface APIStatusGridProps {
  statuses: Record<string, APIStatus>;
  testing: Record<string, boolean>;
  onTest: (apiName: string, functionName: string) => Promise<any>;
}

const apiConfigs = [
  { name: 'ManyChat Webhook', functionName: 'manychat-webhook-test', description: 'Webhook de recebimento ManyChat' },
  { name: 'OpenAI', functionName: 'openai-test', description: 'API de IA para Console e Agentes' },
  { name: 'Supabase', functionName: 'supabase-test', description: 'Conexão com banco de dados' },
  { name: 'WhatsApp', functionName: 'whatsapp-test', description: 'Notificações WhatsApp para Eduardo' },
  { name: 'Knowledge Indexer', functionName: 'knowledge-indexer-test', description: 'Indexador de base de conhecimento' }
];

export const APIStatusGrid = ({ statuses, testing, onTest }: APIStatusGridProps) => {
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

  return (
    <div className="bg-[#1A1A1A] rounded-[14px] border border-[#2A2A2A] p-6">
      <h2 className="text-xl font-bold text-white mb-4">Status das Integrações</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apiConfigs.map((api) => {
          const status = statuses[api.name];
          const isLoading = testing[api.name];

          return (
            <div 
              key={api.name}
              className="bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-4 hover:border-[#3A3A3A] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status?.status)}
                  <span className="text-white font-medium">{api.name}</span>
                </div>
                <span className={`text-xs font-medium ${getStatusColor(status?.status)}`}>
                  {getStatusText(status?.status)}
                </span>
              </div>

              <p className="text-sm text-[#A0A0A0] mb-3">{api.description}</p>

              {status?.lastCheck && (
                <p className="text-xs text-[#666] mb-2">
                  Última verificação: {new Date(status.lastCheck).toLocaleTimeString('pt-BR')}
                </p>
              )}

              {status?.latency && (
                <p className="text-xs text-[#666] mb-2">
                  Latência: {status.latency}ms
                </p>
              )}

              {status?.credentialsPresent === false && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mb-3">
                  <p className="text-xs text-yellow-500">
                    ⚠️ Credenciais não configuradas
                  </p>
                </div>
              )}

              {status?.errorMessage && status?.status !== 'pending' && (
                <p className="text-xs text-red-400 mb-3">
                  {status.errorMessage}
                </p>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onTest(api.name, api.functionName)}
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
                    Testar
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

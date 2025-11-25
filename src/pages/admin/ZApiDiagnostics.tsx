import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  Webhook,
  Phone,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

interface ZApiStatus {
  instance_id: string;
  status: {
    connected: boolean;
    phone: string | null;
    state: string;
  };
  webhook: {
    url: string | null;
    enabled: boolean;
  };
  qr_code: string | null;
}

export default function ZApiDiagnostics() {
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);

  // Buscar agentes Z-API
  const { data: agents, isLoading: loadingAgents, refetch: refetchAgents } = useQuery({
    queryKey: ['zapi-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('key, display_name, whatsapp_number, zapi_config')
        .eq('whatsapp_provider', 'zapi')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  // Verificar status de uma instância
  const { data: instanceStatus, isLoading: checkingStatus, refetch: recheckStatus } = useQuery({
    queryKey: ['zapi-status', selectedInstance],
    queryFn: async () => {
      if (!selectedInstance) return null;
      
      const { data, error } = await supabase.functions.invoke('check-zapi-status', {
        body: { instanceId: selectedInstance },
      });
      
      if (error) throw error;
      return data as ZApiStatus;
    },
    enabled: !!selectedInstance,
  });

  // Monitorar todas as conexões
  const monitorMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('monitor-zapi-connections');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Monitoramento executado com sucesso');
      refetchAgents();
    },
    onError: (error: any) => {
      toast.error(`Erro no monitoramento: ${error.message}`);
    },
  });

  // Enviar mensagem de teste
  const sendTestMutation = useMutation({
    mutationFn: async (agentKey: string) => {
      const { data, error } = await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey,
          phone: '554591415856', // Número do Eduardo para teste
          message: '🔔 Mensagem de teste do sistema - Z-API conectado e funcionando!',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Mensagem de teste enviada!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  const handleCheckStatus = (instanceId: string) => {
    setSelectedInstance(instanceId);
  };

  const getWebhookUrl = () => {
    return 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/zapi-webhook';
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnóstico Z-API</h1>
          <p className="text-muted-foreground mt-2">
            Monitore e diagnostique conexões WhatsApp via Z-API
          </p>
        </div>
        <Button
          onClick={() => monitorMutation.mutate()}
          disabled={monitorMutation.isPending}
          size="lg"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${monitorMutation.isPending ? 'animate-spin' : ''}`} />
          Monitorar Todas
        </Button>
      </div>

      {/* Webhook Configuration */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Webhook className="h-6 w-6 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">URL do Webhook</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Configure esta URL no painel Z-API para todas as instâncias:
            </p>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
              {getWebhookUrl()}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                navigator.clipboard.writeText(getWebhookUrl());
                toast.success('URL copiada!');
              }}
            >
              Copiar URL
            </Button>
          </div>
        </div>
      </Card>

      {/* Agents List */}
      <div className="grid gap-4">
        {loadingAgents ? (
          <Card className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Carregando agentes...</p>
          </Card>
        ) : agents?.length === 0 ? (
          <Card className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-muted-foreground">Nenhum agente Z-API encontrado</p>
          </Card>
        ) : (
          agents?.map((agent) => {
            const zapiConfig = agent.zapi_config as any;
            const instanceId = zapiConfig?.instance_id;
            const status = zapiConfig?.status;
            const phone = zapiConfig?.phone;
            const lastCheck = zapiConfig?.last_check;
            const isSelected = selectedInstance === instanceId;

            return (
              <Card key={agent.key} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{agent.display_name}</h3>
                      <Badge variant={status === 'connected' ? 'default' : 'destructive'}>
                        {status === 'connected' ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectado</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Desconectado</>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{phone || agent.whatsapp_number || 'Sem número'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        <span className="font-mono text-xs">{instanceId}</span>
                      </div>
                      {lastCheck && (
                        <div className="text-xs">
                          Última verificação: {new Date(lastCheck).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckStatus(instanceId)}
                      disabled={checkingStatus && isSelected}
                    >
                      {checkingStatus && isSelected ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Verificar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => sendTestMutation.mutate(agent.key)}
                      disabled={sendTestMutation.isPending || status !== 'connected'}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Testar
                    </Button>
                  </div>
                </div>

                {/* Status Details */}
                {isSelected && instanceStatus && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Status de Conexão</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estado:</span>
                            <Badge variant={instanceStatus.status.connected ? 'default' : 'destructive'}>
                              {instanceStatus.status.state}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Telefone:</span>
                            <span>{instanceStatus.status.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Webhook</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant={instanceStatus.webhook.enabled ? 'default' : 'secondary'}>
                              {instanceStatus.webhook.enabled ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          {instanceStatus.webhook.url && (
                            <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                              {instanceStatus.webhook.url}
                            </div>
                          )}
                          {instanceStatus.webhook.url !== getWebhookUrl() && (
                            <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                URL do webhook não corresponde à URL esperada. Configure manualmente no painel Z-API.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* QR Code for Reconnection */}
                    {instanceStatus.qr_code && !instanceStatus.status.connected && (
                      <div className="mt-4 p-4 bg-muted rounded-lg text-center">
                        <h4 className="font-medium mb-3">Escaneie o QR Code para Reconectar</h4>
                        <img 
                          src={instanceStatus.qr_code} 
                          alt="QR Code Z-API" 
                          className="mx-auto max-w-xs border rounded-lg"
                        />
                        <p className="text-sm text-muted-foreground mt-3">
                          Abra o WhatsApp → Dispositivos Conectados → Conectar Dispositivo
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

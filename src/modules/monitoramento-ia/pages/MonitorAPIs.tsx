import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, XCircle, Clock, Zap, Database, MessageSquare, Brain, FileText, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { APIDetailsModal } from '@/modules/monitoramento-ia/components/apis/APIDetailsModal';
import { APIConfigModal } from '@/modules/monitoramento-ia/components/apis/APIConfigModal';

interface APIStatus {
  name: string;
  endpoint: string;
  status: 'online' | 'offline' | 'unknown';
  lastCheck: string | null;
  lastSuccess: string | null;
  responseTime: number | null;
  totalRequests: number;
  failedRequests: number;
  icon: any;
  description: string;
}

export const MonitorAPIs = () => {
  const [apis, setApis] = useState<APIStatus[]>([
    {
      name: 'ManyChat Webhook',
      endpoint: '/functions/v1/webhook-manychat',
      status: 'unknown',
      lastCheck: null,
      lastSuccess: null,
      responseTime: null,
      totalRequests: 0,
      failedRequests: 0,
      icon: MessageSquare,
      description: 'Recebe mensagens do ManyChat e roteia para agentes'
    },
    {
      name: 'OpenAI API',
      endpoint: '/functions/v1/ia-console',
      status: 'unknown',
      lastCheck: null,
      lastSuccess: null,
      responseTime: null,
      totalRequests: 0,
      failedRequests: 0,
      icon: Brain,
      description: 'Processamento de IA para agentes inteligentes'
    },
    {
      name: 'Supabase Database',
      endpoint: '/rest/v1/agents',
      status: 'unknown',
      lastCheck: null,
      lastSuccess: null,
      responseTime: null,
      totalRequests: 0,
      failedRequests: 0,
      icon: Database,
      description: 'Banco de dados principal do sistema'
    },
    {
      name: 'Route Message',
      endpoint: '/functions/v1/route-message',
      status: 'unknown',
      lastCheck: null,
      lastSuccess: null,
      responseTime: null,
      totalRequests: 0,
      failedRequests: 0,
      icon: Zap,
      description: 'Motor de roteamento de mensagens'
    }
  ]);

  const [testing, setTesting] = useState(false);
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; api: APIStatus | null }>({ open: false, api: null });
  const [configModal, setConfigModal] = useState<{ open: boolean; api: APIStatus | null }>({ open: false, api: null });

  const testAPI = async (apiName: string) => {
    const api = apis.find(a => a.name === apiName);
    if (!api) return;

    const startTime = Date.now();
    
    setApis(prev => prev.map(a => 
      a.name === apiName 
        ? { ...a, status: 'unknown' as const }
        : a
    ));

    try {
      let response;
      
      if (apiName === 'Supabase Database') {
        response = await supabase.from('agents').select('count', { count: 'exact', head: true });
      } else if (apiName === 'ManyChat Webhook') {
        response = await supabase.functions.invoke('manychat-webhook-test');
      } else if (apiName === 'OpenAI API') {
        response = await supabase.functions.invoke('openai-test');
      } else if (apiName === 'Route Message') {
        response = await supabase.functions.invoke('route-message', {
          body: { message: 'test', conversationId: 'test-health-check' }
        });
      }

      const responseTime = Date.now() - startTime;
      const success = !response?.error;

      setApis(prev => prev.map(a => 
        a.name === apiName 
          ? { 
              ...a, 
              status: success ? 'online' : 'offline',
              lastCheck: new Date().toISOString(),
              lastSuccess: success ? new Date().toISOString() : a.lastSuccess,
              responseTime: success ? responseTime : null,
              totalRequests: a.totalRequests + 1,
              failedRequests: success ? a.failedRequests : a.failedRequests + 1
            }
          : a
      ));
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setApis(prev => prev.map(a => 
        a.name === apiName 
          ? { 
              ...a, 
              status: 'offline' as const,
              lastCheck: new Date().toISOString(),
              responseTime,
              totalRequests: a.totalRequests + 1,
              failedRequests: a.failedRequests + 1
            }
          : a
      ));
    }
  };

  const testAllAPIs = async () => {
    setTesting(true);
    for (const api of apis) {
      await testAPI(api.name);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setTesting(false);
  };

  useEffect(() => {
    testAllAPIs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'offline': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="w-5 h-5" />;
      case 'offline': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-module-primary flex items-center gap-3">
              📡 Monitor de APIs
            </h1>
            <p className="text-module-secondary mt-2">
              Status em tempo real de todas as integrações do sistema
            </p>
          </div>
          <Button 
            onClick={testAllAPIs}
            disabled={testing}
            className="bg-module-accent hover:bg-module-accent-hover text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testando...' : 'Testar Todas'}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-module-input rounded-lg border border-module p-4">
            <p className="text-module-tertiary text-sm">APIs Online</p>
            <p className="text-2xl font-bold text-green-500 mt-1">
              {apis.filter(a => a.status === 'online').length}
            </p>
          </div>
          <div className="bg-module-input rounded-lg border border-module p-4">
            <p className="text-module-tertiary text-sm">APIs Offline</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {apis.filter(a => a.status === 'offline').length}
            </p>
          </div>
          <div className="bg-module-input rounded-lg border border-module p-4">
            <p className="text-module-tertiary text-sm">Total Requisições</p>
            <p className="text-2xl font-bold text-module-primary mt-1">
              {apis.reduce((sum, a) => sum + a.totalRequests, 0)}
            </p>
          </div>
          <div className="bg-module-input rounded-lg border border-module p-4">
            <p className="text-module-tertiary text-sm">Taxa de Sucesso</p>
            <p className="text-2xl font-bold text-module-primary mt-1">
              {apis.reduce((sum, a) => sum + a.totalRequests, 0) > 0
                ? Math.round((apis.reduce((sum, a) => sum + (a.totalRequests - a.failedRequests), 0) / apis.reduce((sum, a) => sum + a.totalRequests, 0)) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* API Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {apis.map((api) => {
          const Icon = api.icon;
          return (
            <Card key={api.name} className="bg-module-card border-module p-6 hover:border-[#9C1E1E] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-module-input rounded-lg border border-module">
                    <Icon className="w-6 h-6 text-module-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-module-primary">{api.name}</h3>
                    <p className="text-sm text-module-tertiary">{api.description}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(api.status)}`}>
                  {getStatusIcon(api.status)}
                  <span className="text-sm font-medium capitalize">{api.status === 'online' ? 'Online' : api.status === 'offline' ? 'Offline' : 'Aguardando'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-module">
                  <span className="text-sm text-module-secondary">Endpoint</span>
                  <code className="text-xs text-module-primary bg-module-input px-2 py-1 rounded font-mono">
                    {api.endpoint}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-module-tertiary mb-1">Última Verificação</p>
                    <p className="text-sm text-module-primary font-medium">
                      {formatDate(api.lastCheck)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-module-tertiary mb-1">Último Sucesso</p>
                    <p className="text-sm text-module-primary font-medium">
                      {formatDate(api.lastSuccess)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-module-input rounded-lg border border-module p-2">
                    <p className="text-xs text-module-tertiary">Tempo Resposta</p>
                    <p className="text-lg font-bold text-module-primary mt-1">
                      {api.responseTime ? `${api.responseTime}ms` : '-'}
                    </p>
                  </div>
                  <div className="bg-module-input rounded-lg border border-module p-2">
                    <p className="text-xs text-module-tertiary">Total</p>
                    <p className="text-lg font-bold text-module-primary mt-1">
                      {api.totalRequests}
                    </p>
                  </div>
                  <div className="bg-module-input rounded-lg border border-module p-2">
                    <p className="text-xs text-module-tertiary">Falhas</p>
                    <p className="text-lg font-bold text-red-500 mt-1">
                      {api.failedRequests}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    onClick={() => setDetailsModal({ open: true, api })}
                    variant="outline"
                    className="border-module-accent text-module-accent hover:bg-module-accent hover:text-white"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Detalhes
                  </Button>
                  <Button 
                    onClick={() => setConfigModal({ open: true, api })}
                    variant="outline"
                    className="border-module-accent text-module-accent hover:bg-module-accent hover:text-white"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Config
                  </Button>
                  <Button 
                    onClick={() => testAPI(api.name)}
                    variant="outline"
                    className="border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Testar
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Logs Recent */}
      <Card className="bg-module-card border-module p-6">
        <h2 className="text-xl font-bold text-module-primary mb-4">Últimas Verificações</h2>
        <div className="space-y-2">
          {apis
            .filter(a => a.lastCheck)
            .sort((a, b) => (b.lastCheck || '').localeCompare(a.lastCheck || ''))
            .slice(0, 10)
            .map((api, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-module last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${api.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-module-primary font-medium">{api.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-module-tertiary">{formatDate(api.lastCheck)}</span>
                  <Badge variant={api.status === 'online' ? 'default' : 'destructive'} className="text-xs">
                    {api.status === 'online' ? '✓ OK' : '✗ ERRO'}
                  </Badge>
                  {api.responseTime && (
                    <span className="text-xs text-module-secondary font-mono">
                      {api.responseTime}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Modals */}
      {detailsModal.api && (
        <APIDetailsModal
          open={detailsModal.open}
          onOpenChange={(open) => setDetailsModal({ open, api: null })}
          apiName={detailsModal.api.name}
          functionName={detailsModal.api.endpoint.replace('/functions/v1/', '')}
          onTest={() => testAPI(detailsModal.api!.name)}
          testing={testing}
        />
      )}

      {configModal.api && (
        <APIConfigModal
          open={configModal.open}
          onOpenChange={(open) => setConfigModal({ open, api: null })}
          apiName={configModal.api.name}
          functionName={configModal.api.endpoint.replace('/functions/v1/', '')}
        />
      )}
    </div>
  );
};

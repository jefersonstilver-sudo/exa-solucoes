/**
 * Page: Integrações & APIs (Central)
 * Central de gerenciamento de todas as integrações do ecossistema EXA
 */

import { useState } from 'react';
import { 
  MessageCircle, 
  Plug, 
  Webhook, 
  Bell, 
  Monitor, 
  Thermometer, 
  MessageSquare, 
  Database, 
  Brain,
  Copy,
  Eye,
  EyeOff,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegrationStatus } from '../components/IntegrationStatus';
import { toast } from 'sonner';

interface APICredential {
  label: string;
  value: string;
  maskable: boolean;
  copyable: boolean;
}

interface APIStat {
  label: string;
  value: string | number;
}

interface APIAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline';
}

interface APILog {
  id: number;
  timestamp: string;
  message: string;
  status: 'success' | 'error';
}

interface APIIntegration {
  id: string;
  name: string;
  icon: LucideIcon;
  status: 'connected' | 'pending' | 'error';
  lastSync?: string;
  credentials?: APICredential[];
  stats?: APIStat[];
  actions?: APIAction[];
  logs?: APILog[];
  description?: string;
}

export const IntegracoesApisPage = () => {
  const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  const toggleTokenVisibility = (id: string) => {
    setVisibleTokens(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleTestConnection = (name: string) => {
    toast.info(`Testando conexão com ${name}...`);
  };

  const handleSave = (name: string) => {
    toast.success(`Configurações de ${name} salvas com sucesso!`);
  };

  const integrations: APIIntegration[] = [
    {
      id: 'manychat',
      name: 'ManyChat',
      icon: MessageCircle,
      status: 'pending',
      description: 'Plataforma de automação de chatbots',
      credentials: [
        { label: 'API Token', value: 'Não configurado', maskable: true, copyable: false },
        { label: 'Webhook URL', value: 'https://api.exa.com/webhooks/manychat', maskable: false, copyable: true },
        { label: 'Bot ID', value: 'Aguardando configuração', maskable: false, copyable: false }
      ],
      stats: [
        { label: 'Fluxos Ativos', value: 0 },
        { label: 'Mensagens Hoje', value: 0 }
      ],
      actions: [
        { label: 'Testar Conexão', onClick: () => handleTestConnection('ManyChat'), variant: 'outline' },
        { label: 'Salvar', onClick: () => handleSave('ManyChat') }
      ],
      logs: []
    },
    {
      id: 'string',
      name: 'STRING.com',
      icon: Plug,
      status: 'pending',
      description: 'Plataforma de automação conversacional',
      credentials: [
        { label: 'Agent ID', value: 'agent_string_123', maskable: false, copyable: true },
        { label: 'API Key', value: 'Não configurado', maskable: true, copyable: false },
        { label: 'Endpoint', value: 'https://api.string.com/v1', maskable: false, copyable: true }
      ],
      actions: [
        { label: 'Testar Conexão', onClick: () => handleTestConnection('STRING.com'), variant: 'outline' },
        { label: 'Salvar', onClick: () => handleSave('STRING.com') }
      ],
      logs: []
    },
    {
      id: 'webhook',
      name: 'Webhook Interno',
      icon: Webhook,
      status: 'connected',
      description: 'Sistema de webhooks para integração externa',
      credentials: [
        { label: 'Endpoint', value: 'https://api.exa.com/webhooks/manychat', maskable: false, copyable: true },
        { label: 'Método', value: 'POST', maskable: false, copyable: false },
        { label: 'Auth Token', value: 'Bearer exa_webhook_token_***', maskable: true, copyable: true }
      ],
      actions: [
        { label: 'Testar Conexão', onClick: () => handleTestConnection('Webhook'), variant: 'outline' },
        { label: 'Copiar Dados', onClick: () => handleCopy('https://api.exa.com/webhooks/manychat') }
      ],
      logs: [
        { id: 1, timestamp: '15:22', message: 'Webhook recebido (ManyChat)', status: 'success' },
        { id: 2, timestamp: '14:58', message: 'Processamento bem-sucedido', status: 'success' }
      ]
    },
    {
      id: 'alertas',
      name: 'Sistema de Alertas',
      icon: Bell,
      status: 'connected',
      description: 'Sistema interno de gerenciamento de alertas',
      credentials: [
        { label: 'API Interna', value: '/api/alerts', maskable: false, copyable: true }
      ],
      stats: [
        { label: 'Alertas Ativos', value: 42 },
        { label: 'Último Alerta', value: '20/11 às 15:10' }
      ],
      actions: [
        { label: 'Ver Detalhes', onClick: () => window.location.href = '/admin/monitoramento-ia/alertas' }
      ],
      logs: [
        { id: 1, timestamp: '15:10', message: 'Alerta crítico criado (Painel #123)', status: 'success' },
        { id: 2, timestamp: '14:45', message: 'Alerta resolvido (Painel #98)', status: 'success' }
      ]
    },
    {
      id: 'paineis',
      name: 'Painéis (Monitoramento)',
      icon: Monitor,
      status: 'connected',
      description: 'Sistema de monitoramento de painéis',
      credentials: [
        { label: 'API Interna', value: '/api/paineis', maskable: false, copyable: true }
      ],
      stats: [
        { label: 'Total Painéis', value: 156 },
        { label: 'Online', value: 148 },
        { label: 'Offline', value: 8 }
      ],
      actions: [
        { label: 'Ver Dashboard', onClick: () => window.location.href = '/admin/monitoramento-ia/paineis' }
      ],
      logs: []
    },
    {
      id: 'temperatura',
      name: 'Temperatura (Sensores)',
      icon: Thermometer,
      status: 'pending',
      description: 'Sistema de monitoramento de temperatura',
      credentials: [
        { label: 'API Endpoint', value: 'Não configurado', maskable: false, copyable: false },
        { label: 'Protocolo', value: 'MQTT / HTTP', maskable: false, copyable: false }
      ],
      stats: [
        { label: 'Sensores', value: 0 }
      ],
      actions: [
        { label: 'Configurar', onClick: () => toast.info('Configuração de sensores será implementada em breve') }
      ],
      logs: []
    },
    {
      id: 'conversas',
      name: 'Conversas (IA Analisadas)',
      icon: MessageSquare,
      status: 'connected',
      description: 'Sistema de análise de conversas com IA',
      credentials: [
        { label: 'API Interna', value: '/api/conversas', maskable: false, copyable: true }
      ],
      stats: [
        { label: 'Total Conversas', value: 1234 },
        { label: 'Última Análise', value: '20/11 às 15:20' }
      ],
      actions: [
        { label: 'Ver Conversas', onClick: () => window.location.href = '/admin/monitoramento-ia/conversas' }
      ],
      logs: [
        { id: 1, timestamp: '15:20', message: 'Conversa analisada (Sentimento: positivo)', status: 'success' },
        { id: 2, timestamp: '15:05', message: 'Nova conversa registrada', status: 'success' }
      ]
    },
    {
      id: 'supabase',
      name: 'Supabase (Backend)',
      icon: Database,
      status: 'connected',
      description: 'Backend e banco de dados',
      credentials: [
        { label: 'URL', value: 'https://aakenoljsycyrcrchgxj.supabase.co', maskable: false, copyable: true },
        { label: 'Project ID', value: 'aakenoljsycyrcrchgxj', maskable: false, copyable: true }
      ],
      stats: [
        { label: 'Status', value: 'Operacional' }
      ],
      actions: [
        { label: 'Dashboard Supabase', onClick: () => window.open('https://supabase.com/dashboard', '_blank') },
        { label: 'Copiar Config', onClick: () => handleCopy('https://aakenoljsycyrcrchgxj.supabase.co') }
      ],
      logs: []
    },
    {
      id: 'sistema-ia',
      name: 'Sistema de IA (LLM)',
      icon: Brain,
      status: 'connected',
      description: 'Configuração da Agente Virtual',
      credentials: [
        { label: 'Modelo', value: 'EXA Virtual Assistant', maskable: false, copyable: false },
        { label: 'Temperatura', value: '0.7', maskable: false, copyable: false },
        { label: 'Max Tokens', value: '2000', maskable: false, copyable: false }
      ],
      stats: [
        { label: 'Prompt Base', value: 'Configurado ✓' }
      ],
      actions: [
        { label: 'Editar Configurações', onClick: () => window.location.href = '/admin/monitoramento-ia/agente/configuracoes' },
        { label: 'Ver Instruções', onClick: () => window.location.href = '/admin/monitoramento-ia/agente/instrucoes' }
      ],
      logs: []
    }
  ];

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const pendingCount = integrations.filter(i => i.status === 'pending' || i.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
          <Plug className="w-7 h-7" />
          Integrações & APIs (Central)
        </h1>
        <p className="text-module-secondary">
          Gerencie todas as integrações do ecossistema EXA em um único lugar
        </p>
      </div>

      {/* Stats Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-module-card border border-module rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-module-accent mb-1">
            {integrations.length}
          </p>
          <p className="text-module-secondary text-sm">Total de Integrações</p>
        </div>
        <div className="bg-module-card border border-module rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-green-500 mb-1">
            {connectedCount}
          </p>
          <p className="text-module-secondary text-sm">Conectadas</p>
        </div>
        <div className="bg-module-card border border-module rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-yellow-500 mb-1">
            {pendingCount}
          </p>
          <p className="text-module-secondary text-sm">Pendentes</p>
        </div>
      </div>

      {/* Cards de Integração */}
      <div className="grid gap-6">
        {integrations.map(integration => {
          const Icon = integration.icon;
          return (
            <div key={integration.id} className="bg-module-card rounded-[14px] border border-module p-6">
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-module-accent" />
                  <div>
                    <h2 className="text-lg font-bold text-module-primary">
                      {integration.name}
                    </h2>
                    {integration.description && (
                      <p className="text-sm text-module-tertiary mt-0.5">
                        {integration.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <IntegrationStatus 
                  status={integration.status}
                  lastSync={integration.lastSync}
                />
              </div>

              {/* Stats (se existir) */}
              {integration.stats && integration.stats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {integration.stats.map((stat, idx) => (
                    <div key={idx} className="bg-module-input border border-module rounded-lg p-3">
                      <p className="text-sm text-module-tertiary">{stat.label}</p>
                      <p className="text-lg font-semibold text-module-primary mt-1">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Credenciais */}
              {integration.credentials && integration.credentials.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h3 className="text-sm font-semibold text-module-secondary">
                    Credenciais
                  </h3>
                  {integration.credentials.map((cred, idx) => (
                    <div key={idx}>
                      <label className="block text-xs font-medium text-module-tertiary mb-1">
                        {cred.label}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={cred.maskable && !visibleTokens[`${integration.id}-${idx}`] ? "password" : "text"}
                          value={cred.value}
                          readOnly
                          className="flex-1 bg-module-input border border-module rounded-lg px-3 py-2 text-module-primary text-sm"
                        />
                        {cred.maskable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTokenVisibility(`${integration.id}-${idx}`)}
                          >
                            {visibleTokens[`${integration.id}-${idx}`] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {cred.copyable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(cred.value)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {integration.actions && integration.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {integration.actions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant={action.variant || 'default'}
                      onClick={action.onClick}
                      className={action.variant !== 'outline' ? 'bg-module-accent hover:bg-module-accent-hover' : ''}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Mini-logs */}
              <div className="mt-4 pt-4 border-t border-module">
                <h3 className="text-sm font-semibold text-module-secondary mb-2">
                  📊 Últimas Atividades
                </h3>
                {integration.logs && integration.logs.length > 0 ? (
                  <div className="space-y-1">
                    {integration.logs.slice(0, 5).map(log => (
                      <div key={log.id} className="text-sm text-module-tertiary">
                        • {log.timestamp} - {log.message} {log.status === 'success' ? '✓' : '✗'}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-module-muted italic">
                    {integration.status === 'pending' || integration.status === 'error' 
                      ? 'Aguardando configuração inicial'
                      : 'Sem registros de atividade'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

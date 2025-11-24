import { Database, Code2, Zap, CheckCircle, XCircle, LockKeyhole } from 'lucide-react';
import { Agent } from '../../hooks/useAgentConfig';

interface AgentAPIToolsSectionProps {
  agent: Agent;
}

// Edge Functions disponíveis no projeto
const EDGE_FUNCTIONS = [
  { 
    name: 'get-buildings-for-agent', 
    description: 'Buscar prédios disponíveis',
    enabled: true,
    access: 'read'
  },
  { 
    name: 'generate-ai-response', 
    description: 'Gerar respostas com IA',
    enabled: true,
    access: 'execute'
  },
  { 
    name: 'route-message', 
    description: 'Rotear mensagens entre agentes',
    enabled: true,
    access: 'execute'
  },
  { 
    name: 'test-agent-status', 
    description: 'Testar status do agente',
    enabled: true,
    access: 'execute'
  }
];

// Tabelas do banco de dados com permissões
const DATABASE_TABLES = [
  { 
    name: 'buildings', 
    description: 'Dados dos prédios',
    access: 'read',
    enabled: true
  },
  { 
    name: 'leads', 
    description: 'Leads e contatos',
    access: 'read/write',
    enabled: true
  },
  { 
    name: 'conversations', 
    description: 'Histórico de conversas',
    access: 'read/write',
    enabled: true
  },
  { 
    name: 'agent_logs', 
    description: 'Logs do agente',
    access: 'write',
    enabled: true
  },
  { 
    name: 'agent_sections', 
    description: 'Base de conhecimento (seções)',
    access: 'read',
    enabled: true
  },
  { 
    name: 'agent_knowledge_items', 
    description: 'Base de conhecimento (itens)',
    access: 'read',
    enabled: true
  },
  { 
    name: 'users', 
    description: 'Dados de usuários',
    access: 'none',
    enabled: false
  }
];

// Ferramentas/Capacidades do agente
const AGENT_CAPABILITIES = [
  { id: 'search_database', label: 'Buscar no Banco de Dados', enabled: true },
  { id: 'create_alert', label: 'Criar Alerta', enabled: true },
  { id: 'notify_whatsapp', label: 'Notificar via WhatsApp', enabled: true },
  { id: 'qualify_lead', label: 'Qualificar Lead', enabled: true },
  { id: 'generate_report', label: 'Gerar Relatório', enabled: false }
];

export const AgentAPIToolsSection = ({ agent }: AgentAPIToolsSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-module-primary mb-1">Ferramentas & Permissões</h3>
        <p className="text-sm text-module-secondary">Autorizações e recursos disponíveis para o agente</p>
      </div>

      {/* Edge Functions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="w-5 h-5 text-module-accent" />
          <h4 className="font-semibold text-module-primary">Edge Functions</h4>
        </div>
        <div className="space-y-2">
          {EDGE_FUNCTIONS.map((func) => (
            <div 
              key={func.name}
              className="flex items-center justify-between p-3 rounded-lg border border-module bg-module-card hover:border-module-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {func.enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-module-primary">{func.name}</p>
                  <p className="text-xs text-module-secondary">{func.description}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/30">
                {func.access}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Database Tables */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-module-accent" />
          <h4 className="font-semibold text-module-primary">Acesso ao Banco de Dados</h4>
        </div>
        <div className="space-y-2">
          {DATABASE_TABLES.map((table) => (
            <div 
              key={table.name}
              className="flex items-center justify-between p-3 rounded-lg border border-module bg-module-card hover:border-module-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {table.enabled ? (
                  table.access === 'none' ? (
                    <LockKeyhole className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-module-primary font-mono">{table.name}</p>
                  <p className="text-xs text-module-secondary">{table.description}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                table.access === 'read' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                table.access === 'read/write' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                table.access === 'write' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                'bg-red-500/10 text-red-500 border-red-500/30'
              }`}>
                {table.access}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Capabilities */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-module-accent" />
          <h4 className="font-semibold text-module-primary">Capacidades do Agente</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {AGENT_CAPABILITIES.map((capability) => (
            <div 
              key={capability.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-module bg-module-card"
            >
              {capability.enabled ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-sm ${capability.enabled ? 'text-module-primary' : 'text-module-tertiary'}`}>
                {capability.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

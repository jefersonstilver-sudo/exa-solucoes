/**
 * Component: IntegrationStatus
 * Badge de status de integração
 */

import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface IntegrationStatusProps {
  status: 'connected' | 'pending' | 'error';
  lastSync?: string;
}

export const IntegrationStatus = ({ status, lastSync }: IntegrationStatusProps) => {
  const statusConfig = {
    connected: {
      icon: CheckCircle,
      label: 'Conectado',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20'
    },
    pending: {
      icon: Clock,
      label: 'Configuração Pendente',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20'
    },
    error: {
      icon: AlertCircle,
      label: 'Erro de Conexão',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20'
    }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={`border ${config.border} ${config.bg} rounded-lg p-4`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${config.color}`} />
        <div>
          <p className={`font-semibold ${config.color}`}>
            {config.label}
          </p>
          {lastSync && status === 'connected' && (
            <p className="text-sm text-module-tertiary mt-0.5">
              Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

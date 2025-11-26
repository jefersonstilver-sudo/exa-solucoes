import React from 'react';
import { MessageSquare, Clock, Send, User } from 'lucide-react';

interface LeadMetricsCardsProps {
  totalSent: number;
  totalReceived: number;
  avgResponseTimeContact: number;
  avgResponseTimeAgent: number;
  firstContact?: string;
  lastContact?: string;
  loading?: boolean;
}

export const LeadMetricsCards: React.FC<LeadMetricsCardsProps> = ({
  totalSent,
  totalReceived,
  avgResponseTimeContact,
  avgResponseTimeAgent,
  loading
}) => {
  const formatTime = (minutes: number) => {
    if (minutes < 1) return '< 1min';
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins > 0 ? mins + 'min' : ''}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="exa-metric-card animate-pulse">
            <div className="h-4 bg-[var(--exa-border)] rounded w-20 mb-3"></div>
            <div className="h-8 bg-[var(--exa-border)] rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card: Mensagens Enviadas */}
      <div className="exa-metric-card group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--exa-text-secondary)] mb-1">
              Enviadas
            </p>
            <p className="text-2xl font-bold text-[var(--exa-text-primary)] group-hover:text-[var(--exa-accent)] transition-colors">
              {totalSent}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
            <Send className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Card: Mensagens Recebidas */}
      <div className="exa-metric-card group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--exa-text-secondary)] mb-1">
              Recebidas
            </p>
            <p className="text-2xl font-bold text-[var(--exa-text-primary)] group-hover:text-[var(--exa-accent)] transition-colors">
              {totalReceived}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
            <MessageSquare className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </div>

      {/* Card: Tempo de Resposta do Contato */}
      <div className="exa-metric-card group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--exa-text-secondary)] mb-1">
              T.R. Contato
            </p>
            <p className="text-2xl font-bold text-[var(--exa-text-primary)] group-hover:text-[var(--exa-accent)] transition-colors">
              {formatTime(avgResponseTimeContact)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Card: Tempo de Resposta do Agente */}
      <div className="exa-metric-card group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--exa-text-secondary)] mb-1">
              T.R. Agente
            </p>
            <p className="text-2xl font-bold text-[var(--exa-text-primary)] group-hover:text-[var(--exa-accent)] transition-colors">
              {formatTime(avgResponseTimeAgent)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30">
            <User className="w-5 h-5 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
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
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-[var(--exa-bg-hover)] group-hover:bg-blue-500/10 transition-colors">
            <Send className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-xs font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide">
            Enviadas
          </span>
        </div>
        <p className="text-3xl font-bold text-[var(--exa-text-primary)]">{totalSent}</p>
      </div>

      {/* Card: Mensagens Recebidas */}
      <div className="exa-metric-card group">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-[var(--exa-bg-hover)] group-hover:bg-green-500/10 transition-colors">
            <MessageSquare className="w-4 h-4 text-green-500" />
          </div>
          <span className="text-xs font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide">
            Recebidas
          </span>
        </div>
        <p className="text-3xl font-bold text-[var(--exa-text-primary)]">{totalReceived}</p>
      </div>

      {/* Card: Tempo de Resposta do Contato */}
      <div className="exa-metric-card group">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-[var(--exa-bg-hover)] group-hover:bg-purple-500/10 transition-colors">
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-xs font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide">
            T.R. Contato
          </span>
        </div>
        <p className="text-3xl font-bold text-[var(--exa-text-primary)]">
          {formatTime(avgResponseTimeContact)}
        </p>
      </div>

      {/* Card: Tempo de Resposta do Agente */}
      <div className="exa-metric-card group">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-[var(--exa-bg-hover)] group-hover:bg-orange-500/10 transition-colors">
            <User className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-xs font-semibold text-[var(--exa-text-secondary)] uppercase tracking-wide">
            T.R. Agente
          </span>
        </div>
        <p className="text-3xl font-bold text-[var(--exa-text-primary)]">
          {formatTime(avgResponseTimeAgent)}
        </p>
      </div>
    </div>
  );
};
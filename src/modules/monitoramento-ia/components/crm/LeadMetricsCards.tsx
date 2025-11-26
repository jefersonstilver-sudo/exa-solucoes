import React from 'react';
import { MessageSquare, Clock, Send, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  firstContact,
  lastContact,
  loading
}) => {
  const formatTime = (minutes: number) => {
    if (minutes < 1) return '< 1min';
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-4 rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-20 mb-2"></div>
            <div className="h-6 bg-muted rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      icon: Send,
      label: 'Mensagens Enviadas',
      value: totalSent,
      color: 'text-primary'
    },
    {
      icon: Download,
      label: 'Mensagens Recebidas',
      value: totalReceived,
      color: 'text-secondary'
    },
    {
      icon: Clock,
      label: 'Tempo Resp. Contato',
      value: formatTime(avgResponseTimeContact),
      color: 'text-accent'
    },
    {
      icon: MessageSquare,
      label: 'Tempo Resp. Agente',
      value: formatTime(avgResponseTimeAgent),
      color: 'text-muted-foreground'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card p-4 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${card.color}`} />
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Datas importantes */}
      {(firstContact || lastContact) && (
        <div className="grid grid-cols-2 gap-4">
          {firstContact && (
            <div className="glass-card p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Primeiro Contato</p>
              <p className="text-sm font-medium">
                {format(new Date(firstContact), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          )}
          {lastContact && (
            <div className="glass-card p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Último Contato</p>
              <p className="text-sm font-medium">
                {format(new Date(lastContact), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

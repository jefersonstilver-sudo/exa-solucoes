import React from 'react';
import { MessageSquare, MessageSquareOff, AlertCircle, TrendingUp, Clock, User } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface CRMMetricsProps {
  metrics: {
    total: number;
    unread: number;
    critical: number;
    hotLeads: number;
    awaiting: number;
    avgResponseTime: number;
    sofiaMsgToday: number;
    eduardoMsgToday: number;
  };
}

export const CRMMetrics: React.FC<CRMMetricsProps> = ({ metrics }) => {
  const metricsData = [
    {
      label: 'Total',
      value: metrics.total || 0,
      icon: MessageSquare,
      color: 'bg-[var(--exa-accent)]',
      description: 'Total de conversas ativas'
    },
    {
      label: 'Não Lidas',
      value: metrics.unread || 0,
      icon: MessageSquareOff,
      color: 'bg-[var(--exa-accent)]',
      description: 'Conversas aguardando resposta'
    },
    {
      label: 'Críticas',
      value: metrics.critical || 0,
      icon: AlertCircle,
      color: 'bg-[var(--exa-accent)]',
      description: 'Conversas marcadas como críticas'
    },
    {
      label: 'Hot Leads',
      value: metrics.hotLeads || 0,
      icon: TrendingUp,
      color: 'bg-[var(--exa-accent)]',
      description: 'Leads com alto potencial'
    },
    {
      label: 'Aguardando',
      value: metrics.awaiting || 0,
      icon: Clock,
      color: 'bg-[var(--exa-accent)]',
      description: 'Aguardando resposta do cliente'
    },
    {
      label: 'Sofia Hoje',
      value: metrics.sofiaMsgToday || 0,
      icon: User,
      color: 'bg-[var(--exa-accent)]',
      description: 'Mensagens enviadas pela Sofia hoje'
    },
    {
      label: 'Eduardo Hoje',
      value: metrics.eduardoMsgToday || 0,
      icon: User,
      color: 'bg-[var(--exa-accent)]',
      description: 'Mensagens enviadas pelo Eduardo hoje'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <HoverCard key={index} openDelay={200}>
            <HoverCardTrigger asChild>
              <div 
                className="bg-[var(--exa-bg-card)] border border-[var(--exa-border)] hover:border-[var(--exa-accent)]/50 rounded-2xl p-3 
                  shadow-lg transition-all hover:scale-105 hover:shadow-xl group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${metric.color} p-1.5 rounded-xl shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[var(--exa-text-primary)] group-hover:text-[var(--exa-accent)] transition-colors">
                  {metric.value}
                </div>
                <div className="text-xs text-[var(--exa-text-muted)] mt-1">{metric.label}</div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 backdrop-blur-xl bg-[var(--exa-bg-card)] border-[var(--exa-border)]">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`${metric.color} p-2 rounded-xl`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-sm">{metric.label}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
                <div className="pt-2 border-t border-border/50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Valor atual:</span>
                    <span className="font-bold text-foreground">{metric.value || 0}</span>
                  </div>
                  {metric.value === 0 && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Nenhum registro encontrado no momento
                    </p>
                  )}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
};

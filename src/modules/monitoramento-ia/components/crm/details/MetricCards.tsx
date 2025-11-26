import React from 'react';
import { ArrowUpRight, ArrowDownRight, MessageSquare, Reply, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardsProps {
  totalSent: number;
  totalReceived: number;
  avgResponseTimeAgent: number | null;
  avgResponseTimeContact: number | null;
  loading?: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  totalSent,
  totalReceived,
  avgResponseTimeAgent,
  avgResponseTimeContact,
  loading = false
}) => {
  const formatResponseTime = (milliseconds: number | null): string => {
    if (!milliseconds || milliseconds === 0) return 'N/A';
    
    const seconds = milliseconds / 1000;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${Math.round(seconds)}s`;
  };

  const metrics = [
    {
      label: 'Mensagens Enviadas',
      value: totalSent,
      icon: ArrowUpRight,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      label: 'Mensagens Recebidas',
      value: totalReceived,
      icon: ArrowDownRight,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Tempo Médio Resposta - Agente',
      value: formatResponseTime(avgResponseTimeAgent),
      icon: Reply,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      label: 'Tempo Médio Resposta - Contato',
      value: formatResponseTime(avgResponseTimeContact),
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-6 rounded-xl animate-pulse">
            <div className="h-4 bg-muted/20 rounded w-2/3 mb-4"></div>
            <div className="h-8 bg-muted/20 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            className={cn(
              'glass-card p-6 rounded-xl border-l-4 transition-all hover:scale-105',
              metric.borderColor
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </span>
              <div className={cn('p-2 rounded-lg', metric.bgColor)}>
                <Icon className={cn('w-5 h-5', metric.color)} />
              </div>
            </div>
            <div className={cn('text-3xl font-bold', metric.color)}>
              {metric.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

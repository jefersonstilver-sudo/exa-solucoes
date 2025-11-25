import React from 'react';
import { MessageSquare, MessageSquareOff, AlertCircle, TrendingUp, Clock, User } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      color: 'bg-blue-500',
      description: 'Total de conversas ativas'
    },
    {
      label: 'Não Lidas',
      value: metrics.unread || 0,
      icon: MessageSquareOff,
      color: 'bg-orange-500',
      description: 'Conversas aguardando resposta'
    },
    {
      label: 'Críticas',
      value: metrics.critical || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      description: 'Conversas marcadas como críticas'
    },
    {
      label: 'Hot Leads',
      value: metrics.hotLeads || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'Leads com alto potencial'
    },
    {
      label: 'Aguardando',
      value: metrics.awaiting || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Aguardando resposta do cliente'
    },
    {
      label: 'Sofia Hoje',
      value: metrics.sofiaMsgToday || 0,
      icon: User,
      color: 'bg-pink-500',
      description: 'Mensagens enviadas pela Sofia hoje'
    },
    {
      label: 'Eduardo Hoje',
      value: metrics.eduardoMsgToday || 0,
      icon: User,
      color: 'bg-green-500',
      description: 'Mensagens enviadas pelo Eduardo hoje'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <div 
            key={index}
            className="backdrop-blur-xl bg-white/60 dark:bg-card/60 border border-white/30 dark:border-border rounded-2xl p-3 
              hover:bg-white/70 dark:hover:bg-card/70 transition-all hover:scale-105 hover:shadow-lg group"
            title={metric.description}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`${metric.color} p-1.5 rounded-xl shadow-sm`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              {metric.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{metric.label}</div>
          </div>
        );
      })}
    </div>
  );
};

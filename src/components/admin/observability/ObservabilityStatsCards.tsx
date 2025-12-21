import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageSquare, 
  Send, 
  Inbox, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Zap,
  ShieldAlert
} from 'lucide-react';
import { ObservabilityMetrics } from '@/hooks/useObservabilityData';
import { Skeleton } from '@/components/ui/skeleton';

interface ObservabilityStatsCardsProps {
  metrics: ObservabilityMetrics;
  isLoading: boolean;
}

export const ObservabilityStatsCards: React.FC<ObservabilityStatsCardsProps> = ({
  metrics,
  isLoading,
}) => {
  const cards = [
    {
      title: 'Mensagens Hoje',
      value: metrics.totalMessagesToday,
      icon: MessageSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Enviadas (Outbound)',
      value: metrics.outboundMessages,
      icon: Send,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      title: 'Recebidas (Inbound)',
      value: metrics.inboundMessages,
      icon: Inbox,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      title: 'Pendentes Entrega',
      value: metrics.pendingDelivery,
      icon: Clock,
      color: metrics.pendingDelivery > 10 ? 'text-amber-500' : 'text-muted-foreground',
      bgColor: metrics.pendingDelivery > 10 ? 'bg-amber-500/10' : 'bg-muted/50',
      borderColor: metrics.pendingDelivery > 10 ? 'border-amber-500/20' : 'border-border',
    },
    {
      title: 'Falhas Confirmadas',
      value: metrics.deliveryFailures,
      icon: AlertTriangle,
      color: metrics.deliveryFailures > 0 ? 'text-red-500' : 'text-muted-foreground',
      bgColor: metrics.deliveryFailures > 0 ? 'bg-red-500/10' : 'bg-muted/50',
      borderColor: metrics.deliveryFailures > 0 ? 'border-red-500/20' : 'border-border',
    },
    {
      title: 'Falhas Suspeitas',
      value: metrics.suspectedFailures,
      icon: ShieldAlert,
      color: metrics.suspectedFailures > 0 ? 'text-orange-500' : 'text-muted-foreground',
      bgColor: metrics.suspectedFailures > 0 ? 'bg-orange-500/10' : 'bg-muted/50',
      borderColor: metrics.suspectedFailures > 0 ? 'border-orange-500/20' : 'border-border',
    },
    {
      title: 'Alertas Ativos',
      value: metrics.activeAlerts,
      icon: Zap,
      color: metrics.activeAlerts > 0 ? 'text-red-500' : 'text-green-500',
      bgColor: metrics.activeAlerts > 0 ? 'bg-red-500/10' : 'bg-green-500/10',
      borderColor: metrics.activeAlerts > 0 ? 'border-red-500/20' : 'border-green-500/20',
    },
    {
      title: 'Replays Hoje',
      value: metrics.replaysToday,
      icon: RefreshCw,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(8).fill(0).map((_, i) => (
          <Card key={i} className="border">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card 
            key={card.title} 
            className={`border ${card.borderColor} transition-all duration-200 hover:shadow-md`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${card.color}`}>
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

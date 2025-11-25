import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Users, AlertCircle, TrendingUp, Clock, MessageSquare, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      value: metrics.total,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Não Lidas',
      value: metrics.unread,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: 'Críticas',
      value: metrics.critical,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10'
    },
    {
      label: 'Leads Quentes',
      value: metrics.hotLeads,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Aguardando',
      value: metrics.awaiting,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <h2 className="text-xl font-semibold mb-4 text-module-primary">CRM & Conversas Unificadas</h2>
        <div className="grid grid-cols-5 gap-4">
          {metricsData.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', metric.bgColor)}>
                  <Icon className={cn('w-5 h-5', metric.color)} />
                </div>
                <div>
                  <p className="text-xs text-module-secondary">{metric.label}</p>
                  <p className={cn('text-2xl font-bold', metric.color)}>{metric.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

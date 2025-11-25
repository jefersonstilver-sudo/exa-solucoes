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
      label: 'Msgs Sofia',
      value: metrics.sofiaMsgToday,
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-500/10'
    },
    {
      label: 'Msgs Eduardo',
      value: metrics.eduardoMsgToday,
      icon: Users,
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
    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-xl p-6">
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
  );
};

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
      bgColor: 'bg-blue-500/20'
    },
    {
      label: 'Não Lidas',
      value: metrics.unread,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/20'
    },
    {
      label: 'Aguardando',
      value: metrics.awaiting,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/20'
    },
    {
      label: 'Msgs Sofia',
      value: metrics.sofiaMsgToday,
      icon: MessageSquare,
      color: 'text-pink-600',
      bgColor: 'bg-pink-500/20'
    },
    {
      label: 'Msgs Eduardo',
      value: metrics.eduardoMsgToday,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-500/20'
    }
  ];

  return (
    <div className="flex gap-4 items-center">
      <h2 className="text-lg font-semibold text-gray-800">CRM & Conversas</h2>
      <div className="flex-1 flex gap-3">
        {metricsData.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div 
              key={index} 
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl",
                "backdrop-blur-md bg-white/60 border border-gray-200/50",
                "shadow-sm hover:shadow-md transition-all"
              )}
            >
              <div className={cn('p-1.5 rounded-lg', metric.bgColor)}>
                <Icon className={cn('w-4 h-4', metric.color)} />
              </div>
              <div>
                <p className="text-[10px] text-gray-600 font-medium">{metric.label}</p>
                <p className={cn('text-lg font-bold', metric.color)}>{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

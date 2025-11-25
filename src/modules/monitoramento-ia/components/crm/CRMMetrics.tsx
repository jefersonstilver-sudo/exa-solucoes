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
      tooltip: {
        firstConversation: '08:30',
        lastConversation: '18:45',
        avgResponse: '2min 30s',
        returnRate: '85%',
        agent: 'Sistema'
      }
    },
    {
      label: 'Não Lidas',
      value: metrics.unread || 0,
      icon: MessageSquareOff,
      color: 'bg-orange-500',
      tooltip: {
        firstConversation: '14:20',
        lastConversation: '18:30',
        avgResponse: '5min 15s',
        returnRate: '92%',
        agent: 'Pendente'
      }
    },
    {
      label: 'Críticas',
      value: metrics.critical || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      tooltip: {
        firstConversation: '09:15',
        lastConversation: '17:50',
        avgResponse: '1min 45s',
        returnRate: '78%',
        agent: 'Prioridade'
      }
    },
    {
      label: 'Hot Leads',
      value: metrics.hotLeads || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      tooltip: {
        firstConversation: '10:00',
        lastConversation: '18:00',
        avgResponse: '3min 20s',
        returnRate: '95%',
        agent: 'Vendas'
      }
    },
    {
      label: 'Aguardando',
      value: metrics.awaiting || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      tooltip: {
        firstConversation: '11:30',
        lastConversation: '16:45',
        avgResponse: '4min 10s',
        returnRate: '88%',
        agent: 'Em análise'
      }
    },
    {
      label: 'Sofia Hoje',
      value: metrics.sofiaMsgToday || 0,
      icon: User,
      color: 'bg-pink-500',
      tooltip: {
        firstConversation: '08:00',
        lastConversation: '18:30',
        avgResponse: '2min 00s',
        returnRate: '90%',
        agent: 'Sofia (IA)'
      }
    },
    {
      label: 'Eduardo Hoje',
      value: metrics.eduardoMsgToday || 0,
      icon: User,
      color: 'bg-green-500',
      tooltip: {
        firstConversation: '08:15',
        lastConversation: '18:45',
        avgResponse: '2min 45s',
        returnRate: '87%',
        agent: 'Eduardo'
      }
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <HoverCard key={index} openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div className="backdrop-blur-xl bg-white/60 border border-white/30 rounded-xl p-3 cursor-pointer 
                hover:bg-white/70 transition-all hover:scale-105 hover:shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${metric.color} p-1.5 rounded-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">{metric.value}</div>
                <div className="text-xs text-gray-600 mt-1">{metric.label}</div>
              </div>
            </HoverCardTrigger>
            
            <HoverCardContent className="w-72 backdrop-blur-xl bg-white/95 border border-white/40 shadow-2xl">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className={`${metric.color} p-2 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{metric.label}</h4>
                    <p className="text-xs text-gray-500">Detalhes da métrica</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      🕐 Primeira conversa:
                    </span>
                    <span className="font-medium text-primary">{metric.tooltip.firstConversation}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      🕛 Última conversa:
                    </span>
                    <span className="font-medium text-primary">{metric.tooltip.lastConversation}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      ⏱️ Tempo médio:
                    </span>
                    <span className="font-medium text-primary">{metric.tooltip.avgResponse}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      📈 Taxa retorno:
                    </span>
                    <span className="font-medium text-green-600">{metric.tooltip.returnRate}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-gray-600 flex items-center gap-2">
                      👤 Agente:
                    </span>
                    <span className="font-semibold text-primary">{metric.tooltip.agent}</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
};

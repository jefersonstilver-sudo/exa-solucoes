import React from 'react';
import { MessageSquare, Users } from 'lucide-react';
import AppleLikeMetricCard from './AppleLikeMetricCard';
import { UnifiedDashboardStats } from '@/hooks/useDashboardUnifiedStats';

interface AgentStatsRowProps {
  stats: UnifiedDashboardStats;
}

const AgentStatsRow: React.FC<AgentStatsRowProps> = ({ stats }) => {
  const eduardoStats = stats.conversasPorAgente['Eduardo'] || { 
    conversas: 0, 
    enviadas: 0, 
    recebidas: 0,
    enviadasPorTipo: {}
  };
  const sofiaStats = stats.conversasPorAgente['Sofia'] || { 
    conversas: 0, 
    enviadas: 0, 
    recebidas: 0,
    enviadasPorTipo: {}
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  // Ordenar tipos por quantidade (decrescente)
  const getSortedTypes = (enviadasPorTipo: Record<string, number>) => {
    return Object.entries(enviadasPorTipo)
      .sort(([, a], [, b]) => b - a);
  };

  const compactCards = [
    {
      label: 'Mensagens Eduardo',
      value: formatNumber(eduardoStats.enviadas),
      icon: MessageSquare,
      showHover: true,
      hoverData: getSortedTypes(eduardoStats.enviadasPorTipo),
    },
    {
      label: 'Leads Eduardo',
      value: formatNumber(eduardoStats.conversas),
      icon: Users,
      showHover: false,
    },
    {
      label: 'Mensagens Sofia',
      value: formatNumber(sofiaStats.enviadas),
      icon: MessageSquare,
      showHover: true,
      hoverData: getSortedTypes(sofiaStats.enviadasPorTipo),
    },
    {
      label: 'Leads Sofia',
      value: formatNumber(sofiaStats.conversas),
      icon: Users,
      showHover: false,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {compactCards.map((card) => (
          <AppleLikeMetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            hoverContent={
              card.showHover && card.hoverData && card.hoverData.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Mensagens por Tipo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Distribuição detalhada das mensagens enviadas
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border/50 max-h-64 overflow-y-auto">
                    {card.hoverData.map(([tipo, quantidade]) => (
                      <div key={tipo} className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground capitalize">
                          {tipo.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-sm font-semibold">
                          {formatNumber(quantidade)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};

export default AgentStatsRow;

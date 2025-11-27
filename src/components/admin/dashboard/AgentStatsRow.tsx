import React from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { UnifiedDashboardStats } from '@/hooks/useDashboardUnifiedStats';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

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
      color: 'text-blue-600/70',
      bg: 'bg-blue-500/5',
      showHover: true,
      hoverData: getSortedTypes(eduardoStats.enviadasPorTipo),
    },
    {
      label: 'Leads Eduardo',
      value: formatNumber(eduardoStats.conversas),
      icon: Users,
      color: 'text-blue-600/70',
      bg: 'bg-blue-500/5',
      showHover: false,
    },
    {
      label: 'Mensagens Sofia',
      value: formatNumber(sofiaStats.enviadas),
      icon: MessageSquare,
      color: 'text-pink-600/70',
      bg: 'bg-pink-500/5',
      showHover: true,
      hoverData: getSortedTypes(sofiaStats.enviadasPorTipo),
    },
    {
      label: 'Leads Sofia',
      value: formatNumber(sofiaStats.conversas),
      icon: Users,
      color: 'text-pink-600/70',
      bg: 'bg-pink-500/5',
      showHover: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {compactCards.map((card, index) => {
        const Icon = card.icon;
        const cardContent = (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative overflow-hidden rounded-lg backdrop-blur-sm bg-background/60 border border-border/40 p-3 hover:shadow-sm transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
              <span className="text-xs font-medium text-foreground/70 leading-tight">
                {card.label}
              </span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {card.value}
            </div>
          </motion.div>
        );

        if (card.showHover && card.hoverData && card.hoverData.length > 0) {
          return (
            <HoverCard key={card.label} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                {cardContent}
              </HoverCardTrigger>
              <HoverCardContent className="w-64" side="bottom" align="start">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Detalhes por Tipo
                  </h4>
                  <div className="space-y-1.5">
                    {card.hoverData.map(([tipo, quantidade]) => (
                      <div key={tipo} className="flex items-center justify-between text-sm">
                        <span className="text-foreground/70">{tipo}:</span>
                        <span className="font-medium text-foreground">
                          {formatNumber(quantidade)} mensagens
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        }

        return cardContent;
      })}
    </motion.div>
  );
};

export default AgentStatsRow;

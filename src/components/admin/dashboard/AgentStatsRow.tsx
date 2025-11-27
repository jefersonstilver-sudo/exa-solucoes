import React from 'react';
import { MessageSquare, Send, Inbox, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { UnifiedDashboardStats } from '@/hooks/useDashboardUnifiedStats';

interface AgentStatsRowProps {
  stats: UnifiedDashboardStats;
}

const AgentStatsRow: React.FC<AgentStatsRowProps> = ({ stats }) => {
  const eduardoStats = stats.conversasPorAgente['Eduardo'] || { conversas: 0, enviadas: 0, recebidas: 0 };
  const sofiaStats = stats.conversasPorAgente['Sofia'] || { conversas: 0, enviadas: 0, recebidas: 0 };

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  const compactCards = [
    {
      label: 'Eduardo Enviadas',
      value: formatNumber(eduardoStats.enviadas),
      icon: Send,
      color: 'text-blue-600/70',
      bg: 'bg-blue-500/5',
    },
    {
      label: 'Eduardo Recebidas',
      value: formatNumber(eduardoStats.recebidas),
      icon: Inbox,
      color: 'text-blue-600/70',
      bg: 'bg-blue-500/5',
    },
    {
      label: 'Sofia Enviadas',
      value: formatNumber(sofiaStats.enviadas),
      icon: Send,
      color: 'text-pink-600/70',
      bg: 'bg-pink-500/5',
    },
    {
      label: 'Sofia Recebidas',
      value: formatNumber(sofiaStats.recebidas),
      icon: Inbox,
      color: 'text-pink-600/70',
      bg: 'bg-pink-500/5',
    },
    {
      label: 'Leads Conversados',
      value: formatNumber(stats.conversas),
      icon: Users,
      color: 'text-emerald-600/70',
      bg: 'bg-emerald-500/5',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
    >
      {compactCards.map((card, index) => {
        const Icon = card.icon;
        return (
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
      })}
    </motion.div>
  );
};

export default AgentStatsRow;


import React from 'react';
import { Users, ShoppingCart, MonitorPlay, DollarSign } from 'lucide-react';
import GrowthIndicator from './GrowthIndicator';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';
import DataIntegrityBadge from '../DataIntegrityBadge';
import { AppleMetricCard } from '@/design-system';
import { motion } from 'framer-motion';
import { useCounterAnimation } from '@/hooks/useCounterAnimation';

interface DashboardStatsCardsProps {
  stats: MonthlyDashboardStats;
  growthData: {
    users: number;
    revenue: number;
    orders: number;
    buildings: number;
  } | null;
}

const DashboardStatsCards = ({ stats, growthData }: DashboardStatsCardsProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const animatedUsers = useCounterAnimation(stats.total_users, 2000, isVisible);
  const animatedBuildings = useCounterAnimation(stats.total_buildings, 2000, isVisible);
  const animatedPanels = useCounterAnimation(stats.online_panels, 2000, isVisible);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const hasRealData = stats.total_users > 0 || stats.total_orders > 0;

  const statsCards = [
    {
      title: 'Usuários do Mês',
      value: animatedUsers,
      accumulated: stats.total_users_accumulated,
      growth: growthData?.users || 0,
      icon: Users,
      iconColor: 'text-[hsl(var(--exa-red))]',
    },
    {
      title: 'Vendas Realizadas',
      value: animatedBuildings,
      accumulated: stats.total_buildings_accumulated,
      growth: growthData?.buildings || 0,
      icon: ShoppingCart,
      iconColor: 'text-green-600',
    },
    {
      title: 'Painéis Online',
      value: `${animatedPanels}/${stats.total_panels_accumulated}`,
      accumulated: stats.total_panels_accumulated,
      growth: 0,
      icon: MonitorPlay,
      iconColor: 'text-purple-600',
    },
    {
      title: 'Receita do Mês',
      value: formatCurrency(stats.monthly_revenue),
      accumulated: null,
      growth: growthData?.revenue || 0,
      icon: DollarSign,
      iconColor: 'text-amber-600',
      breakdown: (stats.monthly_revenue_avista || 0) > 0 || (stats.monthly_revenue_recorrente || 0) > 0
        ? `À vista: ${formatCurrency(stats.monthly_revenue_avista || 0)} · Mensal: ${formatCurrency(stats.monthly_revenue_recorrente || 0)}/mês`
        : null,
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-base md:text-lg font-semibold text-[hsl(var(--apple-gray-900))]">Estatísticas Gerais</h2>
        <DataIntegrityBadge 
          isRealData={hasRealData}
          dataSource="Supabase - Dados Reais"
          recordCount={stats.total_users + stats.total_orders}
        />
      </div>
      
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {statsCards.map((card, index) => (
          <motion.div key={index} variants={cardVariants}>
            <AppleMetricCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              iconColor={card.iconColor}
              trend={card.growth !== 0 ? {
                value: `${card.growth > 0 ? '+' : ''}${card.growth.toFixed(1)}%`,
                isPositive: card.growth >= 0,
              } : undefined}
            />
            {card.accumulated !== null && (
              <div className="mt-2 text-xs text-[hsl(var(--apple-gray-500))] px-4">
                Total: <span className="font-semibold text-[hsl(var(--apple-gray-700))]">{card.accumulated.toLocaleString()}</span>
              </div>
            )}
            {(card as any).breakdown && (
              <div className="mt-2 text-[11px] text-[hsl(var(--apple-gray-500))] px-4 leading-tight">
                {(card as any).breakdown}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default DashboardStatsCards;

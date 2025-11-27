import React from 'react';
import { UserPlus, ShoppingBag, DollarSign, MessageCircle, Building2, Gift } from 'lucide-react';
import GlowMetricCard from './GlowMetricCard';
import { UnifiedDashboardStats } from '@/hooks/useDashboardUnifiedStats';

interface UnifiedStatsRowProps {
  stats: UnifiedDashboardStats;
}

const UnifiedStatsRow = ({ stats }: UnifiedStatsRowProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 'N/A', positive: true };
    const diff = current - previous;
    const percent = ((diff / previous) * 100).toFixed(1);
    return {
      value: `${diff >= 0 ? '+' : ''}${percent}%`,
      positive: diff >= 0
    };
  };

  const cadastrosTrend = calculateTrend(stats.cadastros, stats.cadastrosAnterior);
  const vendasTrend = calculateTrend(stats.vendas, stats.vendasAnterior);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-0">
        {/* 1. Cadastros */}
        <GlowMetricCard
          title="Cadastros no Período"
          value={stats.loading ? '...' : stats.cadastros}
          icon={UserPlus}
          colorScheme="blue"
          trend={!stats.loading ? cadastrosTrend.value : undefined}
          trendPositive={!stats.loading ? cadastrosTrend.positive : undefined}
          delay={0}
        />

        {/* 2. Pedidos */}
        <GlowMetricCard
          title="Pedidos Recebidos"
          value={stats.loading ? '...' : stats.pedidos}
          icon={ShoppingBag}
          colorScheme="amber"
          trend={stats.loading ? undefined : `${stats.pedidosDetalhes.pagos} pagos`}
          trendPositive={true}
          delay={1}
        />

        {/* 3. Vendas */}
        <GlowMetricCard
          title="Receita Total"
          value={stats.loading ? '...' : formatCurrency(stats.vendas)}
          icon={DollarSign}
          colorScheme="emerald"
          trend={!stats.loading ? vendasTrend.value : undefined}
          trendPositive={!stats.loading ? vendasTrend.positive : undefined}
          delay={2}
        />

        {/* 4. Conversas */}
        <GlowMetricCard
          title="Conversas Ativas"
          value={stats.loading ? '...' : stats.conversas}
          icon={MessageCircle}
          colorScheme="violet"
          trend={stats.loading ? undefined : `${stats.novosContatos} novos contatos`}
          trendPositive={true}
          delay={3}
        />

        {/* 5. Prédios Ativos */}
        <GlowMetricCard
          title="Prédios Online"
          value={stats.loading ? '...' : `${stats.prediosPercentual.toFixed(0)}%`}
          icon={Building2}
          colorScheme="red"
          trend={stats.loading ? undefined : `${stats.prediosAtivos} de ${stats.prediosTotal}`}
          trendPositive={stats.prediosPercentual >= 80}
          delay={4}
        />

        {/* 6. Vouchers Pendentes */}
        <GlowMetricCard
          title="Vouchers Aguardando"
          value={stats.loading ? '...' : stats.vouchersPendentes}
          icon={Gift}
          colorScheme="pink"
          trend={stats.loading ? undefined : 'Requer atenção'}
          trendPositive={stats.vouchersPendentes === 0}
          delay={5}
        />
      </div>
    </div>
  );
};

export default UnifiedStatsRow;

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
          hoverContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Novos Cadastros</p>
                <p className="text-xs text-muted-foreground">
                  Total de novos usuários registrados no período selecionado
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Período Anterior:</span>
                  <span className="text-sm font-semibold">{stats.cadastrosAnterior}</span>
                </div>
              </div>
            </div>
          }
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
          hoverContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Detalhes dos Pedidos</p>
                <p className="text-xs text-muted-foreground">
                  Acompanhe o status de todos os pedidos recebidos
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Pagos:</span>
                  <span className="text-sm font-semibold text-emerald-600">{stats.pedidosDetalhes.pagos}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Pendentes:</span>
                  <span className="text-sm font-semibold text-amber-600">{stats.pedidosDetalhes.pendentes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Ticket Médio:</span>
                  <span className="text-sm font-semibold">{formatCurrency(stats.pedidosDetalhes.ticketMedio)}</span>
                </div>
              </div>
            </div>
          }
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
          hoverContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Receita do Período</p>
                <p className="text-xs text-muted-foreground">
                  Valor total em vendas confirmadas
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Período Anterior:</span>
                  <span className="text-sm font-semibold">{formatCurrency(stats.vendasAnterior)}</span>
                </div>
              </div>
            </div>
          }
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
          hoverContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Gestão de Conversas</p>
                <p className="text-xs text-muted-foreground">
                  Acompanhe o engajamento com seus clientes
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Novos Contatos:</span>
                  <span className="text-sm font-semibold">{stats.novosContatos}</span>
                </div>
              </div>
            </div>
          }
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
          hoverContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Status dos Prédios</p>
                <p className="text-xs text-muted-foreground">
                  Percentual de prédios com status ativo
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Prédios Ativos:</span>
                  <span className="text-sm font-semibold text-emerald-600">{stats.prediosAtivos}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total de Prédios:</span>
                  <span className="text-sm font-semibold">{stats.prediosTotal}</span>
                </div>
              </div>
            </div>
          }
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
          hoverContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Vouchers Pendentes</p>
                <p className="text-xs text-muted-foreground">
                  Vouchers que precisam ser processados
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-amber-600 font-medium">
                  {stats.vouchersPendentes === 0 
                    ? 'Todos os vouchers foram processados ✓' 
                    : `${stats.vouchersPendentes} voucher(s) aguardando processamento`}
                </p>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default UnifiedStatsRow;

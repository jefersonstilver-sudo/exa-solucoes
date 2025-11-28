import React from 'react';
import { ShoppingBag, DollarSign, TrendingUp, AlertCircle, Clock, Tv2 } from 'lucide-react';
import AppleLikeMetricCard from '@/components/admin/dashboard/AppleLikeMetricCard';
import { OrdersStats } from '@/types/ordersAndAttempts';
import { formatCurrency } from '@/utils/formatters';

interface OrdersCompactStatsProps {
  stats: OrdersStats;
  activeOrdersCount: number;
}

const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value);
};

const OrdersCompactStats: React.FC<OrdersCompactStatsProps> = ({ 
  stats, 
  activeOrdersCount 
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <AppleLikeMetricCard
        label="Total de Pedidos"
        value={stats.total_orders}
        icon={ShoppingBag}
        description="Pedidos no período selecionado"
      />
      
      <AppleLikeMetricCard
        label="Receita Total"
        value={formatCompactCurrency(stats.total_revenue)}
        icon={DollarSign}
        description="Valor total recebido"
      />
      
      <AppleLikeMetricCard
        label="Taxa de Conversão"
        value={`${stats.conversion_rate}%`}
        icon={TrendingUp}
        description="Percentual de conversão"
      />
      
      <AppleLikeMetricCard
        label="Tentativas"
        value={stats.total_attempts}
        icon={AlertCircle}
        description="Tentativas abandonadas"
      />
      
      <AppleLikeMetricCard
        label="Valor Abandonado"
        value={formatCompactCurrency(stats.abandoned_value)}
        icon={Clock}
        description="Receita não realizada"
      />
      
      <AppleLikeMetricCard
        label="Campanhas Ativas"
        value={activeOrdersCount}
        icon={Tv2}
        description="Pedidos em exibição"
      />
    </div>
  );
};

export default OrdersCompactStats;

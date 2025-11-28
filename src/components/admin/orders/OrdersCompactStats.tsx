import React from 'react';
import { ShoppingBag, DollarSign, TrendingUp, AlertCircle, Clock, Tv2 } from 'lucide-react';
import AppleLikeMetricCard from '@/components/admin/dashboard/AppleLikeMetricCard';
import { OrdersStats } from '@/types/ordersAndAttempts';
import { formatCurrency } from '@/utils/formatters';

interface OrdersCompactStatsProps {
  stats: OrdersStats;
  activeOrdersCount: number;
}

const OrdersCompactStats: React.FC<OrdersCompactStatsProps> = ({ 
  stats, 
  activeOrdersCount 
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      <AppleLikeMetricCard
        label="Total de Pedidos"
        value={stats.total_orders}
        icon={ShoppingBag}
      />
      
      <AppleLikeMetricCard
        label="Receita Total"
        value={formatCurrency(stats.total_revenue)}
        icon={DollarSign}
      />
      
      <AppleLikeMetricCard
        label="Taxa de Conversão"
        value={`${stats.conversion_rate}%`}
        icon={TrendingUp}
      />
      
      <AppleLikeMetricCard
        label="Tentativas"
        value={stats.total_attempts}
        icon={AlertCircle}
      />
      
      <AppleLikeMetricCard
        label="Valor Abandonado"
        value={formatCurrency(stats.abandoned_value)}
        icon={Clock}
        variant="danger"
      />
      
      <AppleLikeMetricCard
        label="Campanhas Ativas"
        value={activeOrdersCount}
        icon={Tv2}
      />
    </div>
  );
};

export default OrdersCompactStats;

import React, { useEffect, useState } from 'react';
import { ShoppingBag, DollarSign, TrendingUp, AlertCircle, Clock, Tv2, CheckCircle, FileText } from 'lucide-react';
import AppleLikeMetricCard from '@/components/admin/dashboard/AppleLikeMetricCard';
import { OrdersStats } from '@/types/ordersAndAttempts';
import { formatCurrency } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';

interface RealStats {
  total_orders: number;
  receita_confirmada: number;
  receita_prevista: number;
  receita_avista: number;
  receita_mensal_recorrente: number;
  pedidos_ativos: number;
  pedidos_finalizados: number;
  pedidos_processando: number;
  pedidos_aguardando_contrato: number;
  pedidos_pendentes: number;
  pedidos_bloqueados: number;
  pedidos_cancelados: number;
  total_tentativas: number;
  valor_abandonado: number;
}

interface OrdersCompactStatsProps {
  stats: OrdersStats;
  activeOrdersCount: number;
}

const OrdersCompactStats: React.FC<OrdersCompactStatsProps> = ({ 
  stats, 
  activeOrdersCount 
}) => {
  const [realStats, setRealStats] = useState<RealStats | null>(null);

  useEffect(() => {
    const fetchRealStats = async () => {
      const { data, error } = await supabase.rpc('get_orders_stats_real');
      if (!error && data) {
        setRealStats(data as unknown as RealStats);
      }
    };
    fetchRealStats();
  }, [stats]);

  // Usar stats reais do RPC se disponíveis, senão fallback para stats do frontend
  const displayStats = realStats || {
    total_orders: stats.total_orders,
    receita_confirmada: stats.total_revenue,
    receita_prevista: stats.total_revenue,
    receita_avista: 0,
    receita_mensal_recorrente: 0,
    pedidos_ativos: activeOrdersCount,
    total_tentativas: stats.total_attempts,
    valor_abandonado: stats.abandoned_value,
    pedidos_aguardando_contrato: 0,
  };

  // Calcular taxa de conversão real
  const totalInteractions = (displayStats.pedidos_ativos || 0) + (displayStats.total_tentativas || 0) + (displayStats.pedidos_aguardando_contrato || 0);
  const conversionRate = totalInteractions > 0 
    ? Number((((displayStats.pedidos_ativos || 0) / totalInteractions) * 100).toFixed(1))
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      <AppleLikeMetricCard
        label="Total de Pedidos"
        value={displayStats.total_orders}
        icon={ShoppingBag}
      />
      
      <AppleLikeMetricCard
        label="Receita Confirmada"
        value={formatCurrency(displayStats.receita_confirmada)}
        icon={CheckCircle}
        variant="success"
      />
      
      <AppleLikeMetricCard
        label="A Receber"
        value={formatCurrency((displayStats.receita_prevista || 0) - (displayStats.receita_confirmada || 0))}
        icon={DollarSign}
      />
      
      <AppleLikeMetricCard
        label="Receita Mensal (MRR)"
        value={formatCurrency(displayStats.receita_mensal_recorrente || 0)}
        icon={TrendingUp}
        variant="success"
      />

      <AppleLikeMetricCard
        label="Valor Abandonado"
        value={formatCurrency(displayStats.valor_abandonado)}
        icon={Clock}
        variant="danger"
      />
      
      <AppleLikeMetricCard
        label="Campanhas Ativas"
        value={displayStats.pedidos_ativos || activeOrdersCount}
        icon={Tv2}
      />
    </div>
  );
};

export default OrdersCompactStats;

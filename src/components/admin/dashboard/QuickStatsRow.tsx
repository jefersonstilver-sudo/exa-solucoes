import React from 'react';
import { MessageCircle, MonitorPlay, DollarSign, AlertTriangle } from 'lucide-react';
import { MiniStatCard } from '@/components/ui/MiniStatCard';
import { DashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useNavigate } from 'react-router-dom';

interface QuickStatsRowProps {
  metrics: DashboardMetrics;
}

const QuickStatsRow = ({ metrics }: QuickStatsRowProps) => {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-2 px-2">
      <div className="flex gap-3 pb-2 snap-x snap-mandatory">
        <MiniStatCard
          title="Conversas"
          value={metrics.unreadConversations}
          icon={MessageCircle}
          badge={
            metrics.unreadConversations > 0
              ? { value: metrics.unreadConversations, variant: 'danger' }
              : undefined
          }
          onClick={() => navigate('/admin/monitoramento-ia/conversas')}
        />

        <MiniStatCard
          title="Painéis Online"
          value={`${metrics.panelsOnline}/${metrics.panelsTotal}`}
          icon={MonitorPlay}
          badge={
            metrics.panelsOffline > 0
              ? { value: metrics.panelsOffline, variant: 'warning' }
              : undefined
          }
          onClick={() => navigate('/admin/monitoramento-ia')}
        />

        <MiniStatCard
          title="Hoje"
          value={formatCurrency(metrics.todayRevenue)}
          icon={DollarSign}
          badge={
            metrics.todayRevenue > 0
              ? { value: '💰', variant: 'success' }
              : undefined
          }
        />

        <MiniStatCard
          title="Alertas"
          value={metrics.pendingOrders}
          icon={AlertTriangle}
          badge={
            metrics.pendingOrders > 0
              ? { value: metrics.pendingOrders, variant: 'warning' }
              : undefined
          }
          onClick={() => navigate('/admin/pedidos')}
        />
      </div>
    </div>
  );
};

export default QuickStatsRow;

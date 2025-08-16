import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, TrendingUp, MonitorPlay, ShoppingBag } from 'lucide-react';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';
interface DashboardActivitiesProps {
  stats: MonthlyDashboardStats;
}
const DashboardActivities = ({
  stats
}: DashboardActivitiesProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const recentActivities = [{
    id: 1,
    action: `${stats.total_users} novos usuários cadastrados este mês`,
    time: 'Dados do mês atual',
    type: 'success',
    icon: Users
  }, {
    id: 2,
    action: `Receita mensal: ${formatCurrency(stats.monthly_revenue)}`,
    time: 'Atualizado agora',
    type: 'success',
    icon: TrendingUp
  }, {
    id: 3,
    action: `${stats.online_panels} painéis operacionais de ${stats.total_panels_accumulated} total`,
    time: 'Status atual',
    type: stats.online_panels === stats.total_panels_accumulated ? 'success' : 'warning',
    icon: MonitorPlay
  }, {
    id: 4,
    action: `${stats.total_orders} pedidos realizados este mês`,
    time: 'Performance mensal',
    type: 'neutral',
    icon: ShoppingBag
  }];
  return <Card className="lg:col-span-2 shadow-lg border-0">
      
      
    </Card>;
};
export default DashboardActivities;
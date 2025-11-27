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
  
  return (
    <Card className="col-span-2 bg-white/90 backdrop-blur-xl border border-white/40 shadow-[var(--shadow-glass)] hover:shadow-[var(--shadow-xl)] transition-all duration-normal ease-apple rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg text-[hsl(var(--apple-gray-900))]">
          <Activity className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--exa-red))]" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:space-y-4">
          {recentActivities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-xl border border-[hsl(var(--apple-gray-200))] bg-gradient-to-br from-white to-[hsl(var(--apple-gray-50))] hover:shadow-md transition-all duration-200">
                <div className={`p-3 rounded-xl w-fit ${
                  activity.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' :
                  activity.type === 'warning' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                  'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    {activity.time}
                  </p>
                </div>
                <Badge 
                  className="w-fit"
                  variant={
                    activity.type === 'success' ? 'default' :
                    activity.type === 'warning' ? 'secondary' :
                    'outline'
                  }
                >
                  {activity.type === 'success' ? 'Sucesso' :
                   activity.type === 'warning' ? 'Atenção' :
                   'Info'}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
export default DashboardActivities;
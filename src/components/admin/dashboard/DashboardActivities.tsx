
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, TrendingUp, MonitorPlay, ShoppingBag } from 'lucide-react';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';

interface DashboardActivitiesProps {
  stats: MonthlyDashboardStats;
}

const DashboardActivities = ({ stats }: DashboardActivitiesProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const recentActivities = [
    { 
      id: 1, 
      action: `${stats.total_users} novos usuários cadastrados este mês`, 
      time: 'Dados do mês atual', 
      type: 'success',
      icon: Users
    },
    { 
      id: 2, 
      action: `Receita mensal: ${formatCurrency(stats.monthly_revenue)}`, 
      time: 'Atualizado agora', 
      type: 'success',
      icon: TrendingUp
    },
    { 
      id: 3, 
      action: `${stats.online_panels} painéis operacionais de ${stats.total_panels_accumulated} total`, 
      time: 'Status atual', 
      type: stats.online_panels === stats.total_panels_accumulated ? 'success' : 'warning',
      icon: MonitorPlay
    },
    { 
      id: 4, 
      action: `${stats.total_orders} pedidos realizados este mês`, 
      time: 'Performance mensal', 
      type: 'neutral',
      icon: ShoppingBag
    }
  ];

  return (
    <Card className="lg:col-span-2 shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-3 text-indexa-purple" />
          Atividades do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activity.type === 'success' ? 'bg-green-100 text-green-600' :
                activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <activity.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {activity.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardActivities;

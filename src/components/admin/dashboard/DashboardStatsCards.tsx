
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, MonitorPlay, DollarSign } from 'lucide-react';
import GrowthIndicator from './GrowthIndicator';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';
import DataIntegrityBadge from '../DataIntegrityBadge';

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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const hasRealData = stats.total_users > 0 || stats.total_orders > 0;

  const statsCards = [
    {
      title: 'Usuários do Mês',
      value: stats.total_users.toString(),
      accumulated: stats.total_users_accumulated,
      growth: growthData?.users || 0,
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Vendas Realizadas',
      value: stats.total_buildings.toString(),
      accumulated: stats.total_buildings_accumulated,
      growth: growthData?.buildings || 0,
      icon: ShoppingCart,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Painéis Online',
      value: `${stats.online_panels}/${stats.total_panels_accumulated}`,
      accumulated: stats.total_panels_accumulated,
      growth: 0,
      icon: MonitorPlay,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Receita do Mês',
      value: formatCurrency(stats.monthly_revenue),
      accumulated: null,
      growth: growthData?.revenue || 0,
      icon: DollarSign,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    }
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-base md:text-lg font-semibold text-gray-900">Estatísticas Gerais</h2>
        <DataIntegrityBadge 
          isRealData={hasRealData}
          dataSource="Supabase - Dados Reais"
          recordCount={stats.total_users + stats.total_orders}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statsCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">{stat.value}</div>
            <div className="space-y-1">
              <GrowthIndicator 
                value={stat.growth} 
                label="vs mês anterior" 
              />
              {stat.accumulated !== null && (
                <div className="text-xs text-gray-500">
                  Total acumulado: {stat.accumulated.toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardStatsCards;

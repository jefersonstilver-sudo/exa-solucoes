
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ShoppingBag, 
  MonitorPlay, 
  Building2, 
  DollarSign,
  Activity,
  ArrowUpRight,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import DashboardCharts from '@/components/admin/charts/DashboardCharts';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { stats, chartData, loading, refetch } = useSupabaseData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statsCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers.toString(),
      change: `+${Math.round(stats.totalUsers * 0.12)} este mês`,
      changeType: 'positive',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Prédios Cadastrados',
      value: stats.totalBuildings.toString(),
      change: `${stats.totalBuildings} ativos`,
      changeType: 'neutral',
      icon: Building2,
      color: 'text-green-600'
    },
    {
      title: 'Painéis Online',
      value: `${stats.onlinePanels}/${stats.totalPanels}`,
      change: `${Math.round((stats.onlinePanels/stats.totalPanels) * 100)}% funcionando`,
      changeType: stats.onlinePanels === stats.totalPanels ? 'positive' : 'warning',
      icon: MonitorPlay,
      color: 'text-purple-600'
    },
    {
      title: 'Receita Mensal',
      value: formatCurrency(stats.monthlyRevenue),
      change: '+15.3% vs mês anterior',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-emerald-600'
    }
  ];

  const recentActivities = [
    { 
      id: 1, 
      action: `Sistema operando com ${stats.totalUsers} usuários registrados`, 
      time: 'Status atual', 
      type: 'success',
      icon: Users
    },
    { 
      id: 2, 
      action: `Receita mensal confirmada: ${formatCurrency(stats.monthlyRevenue)}`, 
      time: 'Atualizado agora', 
      type: 'success',
      icon: TrendingUp
    },
    { 
      id: 3, 
      action: `${stats.onlinePanels} painéis operacionais de ${stats.totalPanels} total`, 
      time: 'Monitoramento ativo', 
      type: stats.onlinePanels === stats.totalPanels ? 'success' : 'warning',
      icon: MonitorPlay
    },
    { 
      id: 4, 
      action: `${stats.totalBuildings} prédios na plataforma`, 
      time: 'Base cadastral', 
      type: 'neutral',
      icon: Building2
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema INDEXA • {stats.totalUsers} usuários • {stats.totalBuildings} prédios
          </p>
        </div>
        <Button variant="outline" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="flex items-center text-sm">
                <div className={`flex items-center ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'warning' ? 'text-yellow-600' : 
                  'text-muted-foreground'
                }`}>
                  {stat.changeType === 'positive' && <ArrowUpRight className="h-4 w-4 mr-1" />}
                  {stat.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardCharts data={chartData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Atividades do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'success' ? 'bg-green-100 text-green-600' :
                    activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="default">
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Usuários ({stats.totalUsers})
            </Button>
            <Button variant="outline" className="w-full">
              <Building2 className="h-4 w-4 mr-2" />
              Gerenciar Prédios ({stats.totalBuildings})
            </Button>
            <Button variant="outline" className="w-full">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Ver Pedidos ({stats.totalOrders})
            </Button>
            <Button variant="outline" className="w-full">
              <MonitorPlay className="h-4 w-4 mr-2" />
              Monitorar Painéis ({stats.totalPanels})
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <DollarSign className="h-5 w-5 mr-2" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            <div className="text-center">
              <div className="text-3xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-sm opacity-80">Receita Mensal</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.activeOrders}</div>
              <p className="text-sm opacity-80">Pedidos Ativos</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.pendingOrders}</div>
              <p className="text-sm opacity-80">Pedidos Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

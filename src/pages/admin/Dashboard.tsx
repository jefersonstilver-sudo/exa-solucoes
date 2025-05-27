
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
  TrendingUp,
  Crown,
  Shield,
  Zap
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
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Prédios Cadastrados',
      value: stats.totalBuildings.toString(),
      change: `${stats.totalBuildings} ativos`,
      changeType: 'neutral',
      icon: Building2,
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Painéis Online',
      value: `${stats.onlinePanels}/${stats.totalPanels}`,
      change: `${Math.round((stats.onlinePanels/stats.totalPanels) * 100)}% funcionando`,
      changeType: stats.onlinePanels === stats.totalPanels ? 'positive' : 'warning',
      icon: MonitorPlay,
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Receita Mensal',
      value: formatCurrency(stats.monthlyRevenue),
      change: '+15.3% vs mês anterior',
      changeType: 'positive',
      icon: DollarSign,
      color: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
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
      <div className="space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
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
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indexa-purple to-indexa-purple-dark rounded-xl flex items-center justify-center shadow-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
              <p className="text-gray-600">
                Visão geral completa do sistema INDEXA • {stats.totalUsers} usuários • {stats.totalBuildings} prédios
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} className="shadow-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button className="bg-indexa-purple hover:bg-indexa-purple-dark shadow-lg">
            <Zap className="h-4 w-4 mr-2" />
            Ações Rápidas
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="flex items-center text-sm">
                <div className={`flex items-center ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'warning' ? 'text-yellow-600' : 
                  'text-gray-600'
                }`}>
                  {stat.changeType === 'positive' && <ArrowUpRight className="h-4 w-4 mr-1" />}
                  {stat.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <DashboardCharts data={chartData} />

      {/* Seção inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividades do Sistema */}
        <Card className="lg:col-span-2 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-3 text-indexa-purple" />
              Atividades do Sistema
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

        {/* Ações Rápidas */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-3 text-indexa-purple" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
              <Users className="h-4 w-4 mr-3" />
              Gerenciar Usuários ({stats.totalUsers})
            </Button>
            <Button variant="outline" className="w-full justify-start shadow-sm hover:shadow-md transition-shadow">
              <Building2 className="h-4 w-4 mr-3" />
              Gerenciar Prédios ({stats.totalBuildings})
            </Button>
            <Button variant="outline" className="w-full justify-start shadow-sm hover:shadow-md transition-shadow">
              <ShoppingBag className="h-4 w-4 mr-3" />
              Ver Pedidos ({stats.totalOrders})
            </Button>
            <Button variant="outline" className="w-full justify-start shadow-sm hover:shadow-md transition-shadow">
              <MonitorPlay className="h-4 w-4 mr-3" />
              Monitorar Painéis ({stats.totalPanels})
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Card de Resumo Financeiro */}
      <Card className="bg-gradient-to-r from-indexa-purple via-indexa-purple-dark to-indexa-purple text-white shadow-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <DollarSign className="h-6 w-6 mr-3" />
            Resumo Financeiro INDEXA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-sm opacity-80">Receita Mensal</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.activeOrders}</div>
              <p className="text-sm opacity-80">Pedidos Ativos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.pendingOrders}</div>
              <p className="text-sm opacity-80">Pedidos Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

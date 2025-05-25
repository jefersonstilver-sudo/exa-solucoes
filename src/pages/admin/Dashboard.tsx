
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
  Crown,
  Shield,
  TrendingUp,
  RefreshCw
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
      change: `${stats.totalUsers > 0 ? '+' : ''}${stats.totalUsers}`,
      changeType: 'positive',
      icon: Users,
      description: 'usuários cadastrados'
    },
    {
      title: 'Pedidos Ativos',
      value: stats.activeOrders.toString(),
      change: `${stats.totalOrders} total`,
      changeType: 'positive',
      icon: ShoppingBag,
      description: 'em andamento'
    },
    {
      title: 'Painéis Online',
      value: stats.onlinePanels.toString(),
      change: `${stats.totalPanels} total`,
      changeType: 'positive',
      icon: MonitorPlay,
      description: 'funcionando'
    },
    {
      title: 'Receita Total',
      value: formatCurrency(stats.monthlyRevenue),
      change: `${stats.monthlyRevenue > 0 ? '+' : ''}${formatCurrency(stats.monthlyRevenue)}`,
      changeType: 'positive',
      icon: DollarSign,
      description: 'faturamento'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'Novo usuário registrado', user: 'Sistema', time: '5 min atrás', type: 'success' },
    { id: 2, action: `Pedido confirmado - ${formatCurrency(stats.monthlyRevenue)}`, user: 'Sistema', time: '10 min atrás', type: 'info' },
    { id: 3, action: `${stats.onlinePanels} painéis online`, user: 'Sistema', time: '15 min atrás', type: 'warning' },
    { id: 4, action: `${stats.totalBuildings} prédios cadastrados`, user: 'Sistema', time: '1 hora atrás', type: 'success' }
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
            <Card key={i} className="bg-white">
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
      {/* Header com boas-vindas */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Crown className="h-8 w-8 mr-3 text-indexa-purple" />
            Dashboard Super Admin
          </h1>
          <p className="text-gray-600 mt-2">Controle total do sistema INDEXA com dados em tempo real</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Badge variant="outline" className="border-indexa-purple text-indexa-purple">
            <Shield className="h-4 w-4 mr-1" />
            Sistema Seguro
          </Badge>
        </div>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-indexa-purple/10 to-indexa-mint/10">
                <stat.icon className="h-4 w-4 text-indexa-purple" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="flex items-center text-sm text-gray-600">
                <div className={`flex items-center ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 mr-1 rotate-180" />
                  )}
                  {stat.change}
                </div>
                <span className="ml-2">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos do Dashboard */}
      <DashboardCharts data={chartData} />

      {/* Seção de atividades e ações rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Atividades recentes */}
        <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-indexa-purple" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.user} • {activity.time}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ações rápidas */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-indexa-purple hover:bg-indexa-purple-dark text-white shadow-md">
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Usuários ({stats.totalUsers})
            </Button>
            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
              <MonitorPlay className="h-4 w-4 mr-2" />
              Monitorar Painéis ({stats.totalPanels})
            </Button>
            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Ver Pedidos ({stats.totalOrders})
            </Button>
            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
              <Building2 className="h-4 w-4 mr-2" />
              Gerenciar Prédios ({stats.totalBuildings})
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resumo financeiro */}
      <Card className="bg-gradient-to-r from-indexa-purple to-indexa-purple-dark border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indexa-mint" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold text-indexa-mint">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-sm text-white/80">Receita Total</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indexa-mint">{stats.activeOrders}</div>
              <p className="text-sm text-white/80">Pedidos Ativos</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indexa-mint">{stats.pendingOrders}</div>
              <p className="text-sm text-white/80">Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

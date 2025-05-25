
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
  RefreshCw,
  CheckCircle,
  AlertCircle
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
      change: `${stats.totalUsers} registrados`,
      changeType: 'positive',
      icon: Users,
      description: 'usuários no sistema',
      color: 'bg-blue-500'
    },
    {
      title: 'Pedidos Ativos',
      value: stats.activeOrders.toString(),
      change: `${stats.totalOrders} total`,
      changeType: 'positive',
      icon: ShoppingBag,
      description: 'em andamento',
      color: 'bg-green-500'
    },
    {
      title: 'Painéis Online',
      value: stats.onlinePanels.toString(),
      change: `${stats.totalPanels} total`,
      changeType: 'positive',
      icon: MonitorPlay,
      description: 'funcionando',
      color: 'bg-indexa-mint'
    },
    {
      title: 'Receita Real',
      value: formatCurrency(stats.monthlyRevenue),
      change: `${stats.monthlyRevenue > 0 ? '+' : ''}${formatCurrency(stats.monthlyRevenue)}`,
      changeType: 'positive',
      icon: DollarSign,
      description: 'faturamento confirmado',
      color: 'bg-indexa-purple'
    }
  ];

  const recentActivities = [
    { 
      id: 1, 
      action: `${stats.totalUsers} usuários registrados no sistema`, 
      user: 'Sistema INDEXA', 
      time: 'Dados em tempo real', 
      type: 'success',
      icon: CheckCircle
    },
    { 
      id: 2, 
      action: `${stats.activeOrders} pedidos ativos gerando receita`, 
      user: 'Sistema INDEXA', 
      time: 'Dados em tempo real', 
      type: 'info',
      icon: ShoppingBag
    },
    { 
      id: 3, 
      action: `${stats.onlinePanels} painéis online de ${stats.totalPanels} total`, 
      user: 'Sistema INDEXA', 
      time: 'Status atual', 
      type: stats.onlinePanels === stats.totalPanels ? 'success' : 'warning',
      icon: MonitorPlay
    },
    { 
      id: 4, 
      action: `${stats.totalBuildings} prédios cadastrados na plataforma`, 
      user: 'Sistema INDEXA', 
      time: 'Total cadastrado', 
      type: 'success',
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
      {/* Header com boas-vindas e dados reais */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Crown className="h-8 w-8 mr-3 text-indexa-purple" />
            Dashboard Super Admin - DADOS REAIS
          </h1>
          <p className="text-gray-600 mt-2">
            Controle total do sistema INDEXA com dados conectados ao Supabase
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Dados
          </Button>
          <Badge variant="outline" className="border-green-500 text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Conectado ao Supabase
          </Badge>
        </div>
      </div>

      {/* Alert de conexão bem-sucedida */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Dashboard Conectado com Sucesso!</h3>
              <p className="text-green-700 text-sm">
                Todos os dados abaixo são reais e vêm diretamente do banco de dados Supabase.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de estatísticas principais com dados reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-4 w-4 text-indexa-purple`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="flex items-center text-sm text-gray-600">
                <div className={`flex items-center ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {stat.change}
                </div>
                <span className="ml-2">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos do Dashboard com dados reais */}
      <DashboardCharts data={chartData} />

      {/* Seção de atividades e ações rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Atividades recentes com dados reais */}
        <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-indexa-purple" />
              Status do Sistema (Dados Reais)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'success' ? 'bg-green-100' :
                    activity.type === 'warning' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <activity.icon className={`w-4 h-4 ${
                      activity.type === 'success' ? 'text-green-600' :
                      activity.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  </div>
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

        {/* Ações rápidas com contadores reais */}
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

      {/* Resumo financeiro com dados reais */}
      <Card className="bg-gradient-to-r from-indexa-purple to-indexa-purple-dark border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indexa-mint" />
            Resumo Financeiro Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold text-indexa-mint">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-sm text-white/80">Receita Real Confirmada</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indexa-mint">{stats.activeOrders}</div>
              <p className="text-sm text-white/80">Pedidos Ativos</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indexa-mint">{stats.pendingOrders}</div>
              <p className="text-sm text-white/80">Pedidos Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

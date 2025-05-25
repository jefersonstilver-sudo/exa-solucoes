
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ShoppingBag, 
  MonitorPlay, 
  Building2, 
  TrendingUp, 
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Shield
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total de Usuários',
      value: '2,543',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      description: 'vs. mês anterior'
    },
    {
      title: 'Pedidos Ativos',
      value: '124',
      change: '+8%',
      changeType: 'positive',
      icon: ShoppingBag,
      description: 'em andamento'
    },
    {
      title: 'Painéis Online',
      value: '89',
      change: '+15%',
      changeType: 'positive',
      icon: MonitorPlay,
      description: 'funcionando'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 45.230',
      change: '+23%',
      changeType: 'positive',
      icon: DollarSign,
      description: 'faturamento'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'Novo usuário registrado', user: 'João Silva', time: '5 min atrás', type: 'success' },
    { id: 2, action: 'Pedido #1234 confirmado', user: 'Sistema', time: '10 min atrás', type: 'info' },
    { id: 3, action: 'Painel P-001 atualizado', user: 'Sistema', time: '15 min atrás', type: 'warning' },
    { id: 4, action: 'Backup realizado com sucesso', user: 'Sistema', time: '1 hora atrás', type: 'success' }
  ];

  return (
    <div className="space-y-6">
      {/* Header com boas-vindas */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Crown className="h-8 w-8 mr-3 text-indexa-purple" />
            Dashboard Super Admin
          </h1>
          <p className="text-gray-600 mt-2">Controle total do sistema INDEXA</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="border-indexa-purple text-indexa-purple">
            <Shield className="h-4 w-4 mr-1" />
            Sistema Seguro
          </Badge>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-lg bg-indexa-purple/10">
                <stat.icon className="h-4 w-4 text-indexa-purple" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <div className={`flex items-center ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {stat.change}
                </div>
                <span className="ml-2">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seção principal com gráficos e atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Atividades recentes */}
        <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-indexa-purple" />
              Atividades Recentes
            </CardTitle>
            <CardDescription className="text-gray-600">
              Últimas ações no sistema
            </CardDescription>
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
            <CardDescription className="text-gray-600">
              Operações administrativas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-indexa-purple hover:bg-indexa-purple-dark text-white">
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Usuários
            </Button>
            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
              <MonitorPlay className="h-4 w-4 mr-2" />
              Monitorar Painéis
            </Button>
            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Ver Pedidos
            </Button>
            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
              <Building2 className="h-4 w-4 mr-2" />
              Gerenciar Prédios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de performance */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indexa-purple" />
            Performance do Sistema
          </CardTitle>
          <CardDescription className="text-gray-600">
            Métricas de desempenho em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-indexa-purple mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Gráfico de performance será implementado</p>
              <p className="text-sm text-gray-500 mt-1">Integração com dados em tempo real</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

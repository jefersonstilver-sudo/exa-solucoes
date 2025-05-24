
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
  FileText,
  Settings,
  Crown,
  Shield,
  Bell
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total de Usuários',
      value: '2,543',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pedidos Ativos',
      value: '124',
      change: '+8%',
      icon: ShoppingBag,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Painéis Online',
      value: '89',
      change: '+15%',
      icon: MonitorPlay,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 45.230',
      change: '+23%',
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'Novo usuário registrado', user: 'João Silva', time: '5 min atrás', type: 'user' },
    { id: 2, action: 'Pedido #1234 confirmado', user: 'Sistema', time: '10 min atrás', type: 'order' },
    { id: 3, action: 'Painel P-001 atualizado', user: 'Sistema', time: '15 min atrás', type: 'panel' },
    { id: 4, action: 'Backup realizado com sucesso', user: 'Sistema', time: '1 hora atrás', type: 'system' }
  ];

  return (
    <div className="space-y-8">
      {/* Header com boas-vindas */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center">
              <Crown className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard Super Admin</h1>
              <p className="text-slate-400">Controle total do sistema INDEXA</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="border-amber-500/30 text-amber-300">
            <Shield className="h-3 w-3 mr-1" />
            Sistema Seguro
          </Badge>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}/10`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change} em relação ao mês passado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seção principal com gráficos e atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Atividades recentes */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-amber-400" />
              Atividades Recentes
            </CardTitle>
            <CardDescription className="text-slate-400">
              Últimas ações no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="text-xs text-slate-400">{activity.user} • {activity.time}</p>
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
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="h-5 w-5 mr-2 text-amber-400" />
              Ações Rápidas
            </CardTitle>
            <CardDescription className="text-slate-400">
              Operações administrativas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Usuários
            </Button>
            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
              <MonitorPlay className="h-4 w-4 mr-2" />
              Monitorar Painéis
            </Button>
            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Ver Pedidos
            </Button>
            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de performance */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-amber-400" />
            Performance do Sistema
          </CardTitle>
          <CardDescription className="text-slate-400">
            Métricas de desempenho em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-slate-700/30 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <p className="text-slate-300">Gráfico de performance será implementado</p>
              <p className="text-sm text-slate-500">Integração com dados em tempo real</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

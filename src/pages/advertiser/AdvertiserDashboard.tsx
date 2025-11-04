import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, TrendingUp, Eye, Play, ShoppingBag, Calendar, Monitor, AlertCircle, CheckCircle, Clock, DollarSign, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
interface DashboardStats {
  totalPedidos: number;
  valorTotalGasto: number;
  campanhasAtivas: number;
  videosEnviados: number;
  pedidosPendentes: number;
  pedidosPagos: number;
  proximosVencimentos: number;
}
interface Pedido {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  lista_paineis: string[];
}
const AdvertiserDashboard = () => {
  const navigate = useNavigate();
  const {
    userProfile,
    isLoading,
    isLoggedIn
  } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPedidos: 0,
    valorTotalGasto: 0,
    campanhasAtivas: 0,
    videosEnviados: 0,
    pedidosPendentes: 0,
    pedidosPagos: 0,
    proximosVencimentos: 0
  });
  const [recentOrders, setRecentOrders] = useState<Pedido[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  useEffect(() => {
    if (isLoading) return;
    console.log('🔍 AdvertiserDashboard - Verificando acesso:', {
      email: userProfile?.email,
      role: userProfile?.role,
      isLoggedIn
    });

    // BLOQUEIO: Super admin não deve acessar área do anunciante
    if (userProfile?.role === 'super_admin') {
      console.log('🚫 BLOQUEIO: Super admin tentando acessar área do anunciante');
      toast.error('Super administrador deve usar o painel administrativo');
      navigate('/super_admin', {
        replace: true
      });
      return;
    }

    // Verificar se está logado
    if (!isLoggedIn) {
      console.log('🔐 Usuário não autenticado - redirecionando para login');
      toast.error('Você precisa estar logado para acessar a área do anunciante');
      navigate('/login', {
        replace: true
      });
      return;
    }

    // Verificar role adequada
    if (userProfile?.role !== 'client' && userProfile?.role !== 'admin') {
      console.log('🚫 Role inadequada para área do anunciante');
      toast.error('Você não tem permissão para acessar esta área');
      navigate('/login', {
        replace: true
      });
      return;
    }

    // Carregar dados do dashboard
    loadDashboardData();
  }, [userProfile, isLoading, isLoggedIn, navigate]);
  const loadDashboardData = async () => {
    if (!userProfile?.id) return;
    try {
      setLoadingStats(true);

      // Buscar pedidos do usuário
      const {
        data: pedidos,
        error: pedidosError
      } = await supabase.from('pedidos').select('*').eq('client_id', userProfile.id).order('created_at', {
        ascending: false
      });
      if (pedidosError) throw pedidosError;

      // Buscar campanhas legacy
      const {
        data: campanhas,
        error: campanhasError
      } = await supabase.from('campanhas').select('*').eq('client_id', userProfile.id);
      if (campanhasError) throw campanhasError;

      // Buscar campanhas avançadas (novas)
      const {
        data: campanhasAdvanced,
        error: campanhasAdvancedError
      } = await supabase.from('campaigns_advanced').select('*').eq('client_id', userProfile.id);
      if (campanhasAdvancedError) throw campanhasAdvancedError;

      // Buscar vídeos do usuário
      const {
        data: videos,
        error: videosError
      } = await supabase.from('videos').select('*').eq('client_id', userProfile.id);
      if (videosError) throw videosError;

      // Calcular estatísticas
      const pedidosPagos = pedidos?.filter(p => p.status === 'pago' || p.status === 'pago_pendente_video' || p.status === 'video_aprovado') || [];
      const pedidosPendentes = pedidos?.filter(p => p.status === 'pendente') || [];

      // Combinar campanhas legacy e avançadas ativas
      const campanhasLegacyAtivas = campanhas?.filter(c => c.status === 'ativo') || [];
      const campanhasAdvancedAtivas = campanhasAdvanced?.filter(c => c.status === 'active') || [];
      const totalCampanhasAtivas = campanhasLegacyAtivas.length + campanhasAdvancedAtivas.length;
      const videosEnviados = videos?.length || 0;

      // Calcular próximos vencimentos (próximos 30 dias)
      const proximosVencimentos = pedidosPagos.filter(p => {
        if (!p.data_fim) return false;
        const dataFim = new Date(p.data_fim);
        const hoje = new Date();
        const em30Dias = new Date();
        em30Dias.setDate(hoje.getDate() + 30);
        return dataFim >= hoje && dataFim <= em30Dias;
      }).length;
      const valorTotalGasto = pedidosPagos.reduce((total, pedido) => total + (pedido.valor_total || 0), 0);
      setStats({
        totalPedidos: pedidos?.length || 0,
        valorTotalGasto,
        campanhasAtivas: totalCampanhasAtivas,
        videosEnviados,
        pedidosPendentes: pedidosPendentes.length,
        pedidosPagos: pedidosPagos.length,
        proximosVencimentos
      });
      setRecentOrders(pedidos?.slice(0, 5) || []);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoadingStats(false);
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
      case 'pago_pendente_video':
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case 'video_aprovado':
        return <Badge className="bg-blue-100 text-blue-800">Aprovado</Badge>;
      case 'video_enviado':
        return <Badge className="bg-yellow-100 text-yellow-800">Em Análise</Badge>;
      case 'pendente':
        return <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Dados para gráficos
  const chartData = [{
    name: 'Jan',
    value: stats.valorTotalGasto * 0.1
  }, {
    name: 'Fev',
    value: stats.valorTotalGasto * 0.2
  }, {
    name: 'Mar',
    value: stats.valorTotalGasto * 0.3
  }, {
    name: 'Abr',
    value: stats.valorTotalGasto * 0.5
  }, {
    name: 'Mai',
    value: stats.valorTotalGasto
  }];
  const pieData = [{
    name: 'Pagos',
    value: stats.pedidosPagos,
    color: '#10B981'
  }, {
    name: 'Pendentes',
    value: stats.pedidosPendentes,
    color: '#F59E0B'
  }];
  if (isLoading || loadingStats) {
    return <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando dashboard...</p>
      </div>;
  }

  // Verificação adicional de segurança
  if (userProfile?.role === 'super_admin') {
    return <div className="flex items-center justify-center min-h-[60vh] flex-col">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Negado</h1>
        <p className="text-gray-600">Super administrador deve usar o painel administrativo</p>
      </div>;
  }
  if (!isLoggedIn || userProfile?.role !== 'client' && userProfile?.role !== 'admin') {
    return null; // Redirecionamento já foi feito no useEffect
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bem-vindo de volta! Aqui está o resumo das suas campanhas.</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => navigate('/paineis-digitais/loja')} className="bg-indexa-purple hover:bg-indexa-purple/90">
            Comprar Painéis
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.valorTotalGasto)}</div>
            <p className="text-xs text-muted-foreground">
              em {stats.totalPedidos} pedidos
            </p>
          </CardContent>
        </Card>

        

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vídeos Enviados</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.videosEnviados}</div>
            <p className="text-xs text-muted-foreground">
              arquivos carregados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próx. Vencimentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proximosVencimentos}</div>
            <p className="text-xs text-muted-foreground">
              nos próximos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução dos Investimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={value => [formatCurrency(Number(value)), 'Valor']} />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({
                name,
                value
              }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pedidos Recentes</CardTitle>
          <Button variant="outline" onClick={() => navigate('/meus-pedidos')}>
            Ver Todos
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? <div className="space-y-4">
              {recentOrders.map(order => <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-indexa-purple" />
                    </div>
                    <div>
                      <p className="font-medium">Pedido #{order.id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created_at)} • {order.lista_paineis?.length || 0} painéis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold">{formatCurrency(order.valor_total || 0)}</span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>)}
            </div> : <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500 mb-4">Comece fazendo seu primeiro pedido de painéis digitais.</p>
              <Button onClick={() => navigate('/paineis-digitais/loja')}>
                Explorar Painéis
              </Button>
            </div>}
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/anunciante/videos')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Upload de Vídeos</h3>
                <p className="text-sm text-gray-500">Envie seus materiais criativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/anunciante/relatorios')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Relatórios</h3>
                <p className="text-sm text-gray-500">Analise a performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AdvertiserDashboard;

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  ShoppingBag, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Filter,
  Search,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
}

interface OrderStats {
  total: number;
  valorTotal: number;
  pendentes: number;
  pagos: number;
}

const AdvertiserOrders = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    valorTotal: 0,
    pendentes: 0,
    pagos: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  useEffect(() => {
    loadOrders();
  }, [userProfile]);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

  const loadOrders = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList: Order[]) => {
    const total = ordersList.length;
    const valorTotal = ordersList.reduce((sum, order) => sum + (order.valor_total || 0), 0);
    const pendentes = ordersList.filter(order => order.status === 'pendente').length;
    const pagos = ordersList.filter(order => ['pago', 'pago_pendente_video', 'video_aprovado'].includes(order.status)).length;

    setStats({ total, valorTotal, pendentes, pagos });
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.valor_total.toString().includes(searchTerm)
      );
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pendente':
        return {
          label: 'Pendente',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Clock
        };
      case 'pago':
      case 'pago_pendente_video':
        return {
          label: 'Pago',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle
        };
      case 'video_aprovado':
        return {
          label: 'Aprovado',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: CheckCircle
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertCircle
        };
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando seus pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
          <p className="text-gray-600 mt-1">Acompanhe o status e histórico de todas as suas campanhas</p>
        </div>
        <Button onClick={() => navigate('/paineis-digitais/loja')} className="bg-indexa-purple hover:bg-indexa-purple/90">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            <p className="text-xs text-blue-600">pedidos realizados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.valorTotal)}</div>
            <p className="text-xs text-green-600">investimento total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.pendentes}</div>
            <p className="text-xs text-orange-600">aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Campanhas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.pagos}</div>
            <p className="text-xs text-purple-600">campanhas em execução</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por ID do pedido ou valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="video_aprovado">Aprovado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">
              {searchTerm || statusFilter !== 'todos' 
                ? 'Nenhum pedido encontrado' 
                : 'Você ainda não fez nenhum pedido'
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'todos'
                ? 'Tente ajustar os filtros para encontrar seus pedidos.'
                : 'Comece criando sua primeira campanha publicitária.'
              }
            </p>
            <Button onClick={() => navigate('/paineis-digitais/loja')} className="bg-indexa-purple hover:bg-indexa-purple/90">
              Explorar Painéis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={order.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-indexa-purple">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-indexa-purple" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Pedido #{order.id.substring(0, 8)}</h3>
                          <p className="text-sm text-gray-500">
                            Criado em {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Valor Total</p>
                          <p className="font-semibold text-lg">{formatCurrency(order.valor_total || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duração</p>
                          <p className="font-medium">{order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Painéis</p>
                          <p className="font-medium">{order.lista_paineis?.length || 0} selecionados</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Período</p>
                          <p className="font-medium flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {order.data_inicio ? formatDate(order.data_inicio) : 'A definir'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:items-end space-y-3">
                      <Badge className={`${statusConfig.color} border flex items-center space-x-1`}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusConfig.label}</span>
                      </Badge>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/pedido-confirmado?id=${order.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdvertiserOrders;

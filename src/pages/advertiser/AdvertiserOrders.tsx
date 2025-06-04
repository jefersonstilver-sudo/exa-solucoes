import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileAdvertiserOrders from './MobileAdvertiserOrders';
import { useAuth } from '@/hooks/useAuth';
import { useUserOrdersAndAttempts } from '@/hooks/useUserOrdersAndAttempts';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { 
  Loader2, 
  ShoppingBag, 
  Calendar, 
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const AdvertiserOrders = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { userOrdersAndAttempts, loading } = useUserOrdersAndAttempts(userProfile?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Return mobile version directly without wrapper layout since it's already handled by ResponsiveAdvertiserLayout
  if (isMobile) {
    return <MobileAdvertiserOrders />;
  }

  // Calcular estatísticas CORRIGIDAS
  const orders = userOrdersAndAttempts.filter(item => item.type === 'order');
  const attempts = userOrdersAndAttempts.filter(item => item.type === 'attempt');
  
  // Verificar se um pedido está dentro do período ativo
  const isWithinActivePeriod = (order: any) => {
    if (!order.data_inicio || !order.data_fim) return false;
    const today = new Date();
    const startDate = new Date(order.data_inicio);
    const endDate = new Date(order.data_fim);
    return today >= startDate && today <= endDate;
  };
  
  const stats = {
    // Pedidos ativos: pagos, com vídeo aprovado/ativo e dentro do período
    pedidosAtivos: orders.filter(order => 
      ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'].includes(order.status) &&
      isWithinActivePeriod(order)
    ).length,
    
    // Tentativas: compras não finalizadas
    tentativas: attempts.length,
    
    // Aguardando Vídeo: pedidos pagos mas aguardando envio de vídeo
    aguardandoVideo: orders.filter(order => 
      ['pago', 'pago_pendente_video'].includes(order.status)
    ).length,
    
    // Pedidos finalizados: expirados ou fora do período
    pedidosFinalizados: orders.filter(order => 
      order.status === 'expirado' || 
      (['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'].includes(order.status) && !isWithinActivePeriod(order))
    ).length
  };

  // Filtrar itens
  const filteredItems = userOrdersAndAttempts.filter(item => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.valor_total.toString().includes(searchTerm);
    
    const matchesStatus = 
      statusFilter === 'todos' || 
      (item.type === 'order' && item.status === statusFilter) ||
      (item.type === 'attempt' && statusFilter === 'tentativa');

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const OrderCard = ({ item }: { item: any }) => {
    const statusInfo = useOrderStatus(item);
    const StatusIcon = statusInfo.icon;
    const painelsList = item.type === 'order' ? (item.lista_paineis || []) : (item.predios_selecionados || []);

    return (
      <Card className={cn(
        'hover:shadow-lg transition-all duration-200 border-l-4',
        item.type === 'attempt' ? 'border-l-orange-500' : 'border-l-indexa-purple'
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  item.type === 'attempt' ? 'bg-orange-500/10' : 'bg-indexa-purple/10'
                )}>
                  <StatusIcon className={cn(
                    'h-5 w-5',
                    item.type === 'attempt' ? 'text-orange-500' : statusInfo.color.replace('text-', '')
                  )} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {item.type === 'attempt' ? 'Tentativa' : 'Pedido'} #{item.id.substring(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Criado em {formatDate(item.created_at)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Valor Total</p>
                  <p className={cn(
                    'font-semibold text-lg',
                    item.type === 'attempt' ? 'text-orange-600' : 'text-gray-900'
                  )}>
                    {formatCurrency(item.valor_total || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Duração</p>
                  <p className="font-medium">
                    {item.type === 'order' ? `${item.plano_meses} meses` : '1 mês (est.)'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Painéis</p>
                  <p className="font-medium">{painelsList.length} selecionados</p>
                </div>
                <div>
                  <p className="text-gray-500">Período</p>
                  <p className="font-medium flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {item.type === 'order' && item.data_inicio ? formatDate(item.data_inicio) : 'A definir'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:items-end space-y-3">
              <Badge className={cn('border flex items-center space-x-1', statusInfo.bgColor)}>
                <StatusIcon className="h-3 w-3" />
                <span>{statusInfo.label}</span>
              </Badge>

              <div className="flex space-x-2">
                {statusInfo.action && (
                  <Button
                    variant={statusInfo.action.variant}
                    size="sm"
                    onClick={statusInfo.action.onClick}
                    className="mr-2"
                  >
                    {statusInfo.action.label}
                  </Button>
                )}
                
                {item.type === 'order' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/anunciante/pedido/${item.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
          <p className="text-gray-600 mt-1">Acompanhe o status e histórico de todas as suas campanhas e tentativas</p>
        </div>
        <Button onClick={() => navigate('/paineis-digitais/loja')} className="bg-indexa-purple hover:bg-indexa-purple/90">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Pedidos Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.pedidosAtivos}</div>
            <p className="text-xs text-green-600">em execução</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Tentativas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.tentativas}</div>
            <p className="text-xs text-orange-600">não finalizadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Aguardando Vídeo</CardTitle>
            <Upload className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.aguardandoVideo}</div>
            <p className="text-xs text-blue-600">pagos sem vídeo</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Pedidos Finalizados</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pedidosFinalizados}</div>
            <p className="text-xs text-gray-600">expirados</p>
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
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="tentativa">Tentativas</SelectItem>
                <SelectItem value="pago">Aguardando Vídeo</SelectItem>
                <SelectItem value="video_aprovado">Aprovado</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredItems.length === 0 ? (
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
          {filteredItems.map((item) => (
            <OrderCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvertiserOrders;

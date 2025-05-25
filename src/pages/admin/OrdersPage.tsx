
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Package,
  Calendar,
  User,
  DollarSign,
  RefreshCw,
  Video,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { useOrdersDataComplete } from '@/hooks/useOrdersDataComplete';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { orders, stats, loading, refetch } = useOrdersDataComplete();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string, color: string }> = {
      pendente: { variant: 'secondary', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      pago: { variant: 'success', label: 'Pago', color: 'bg-green-100 text-green-800' },
      pago_pendente_video: { variant: 'secondary', label: 'Aguardando Vídeo', color: 'bg-orange-100 text-orange-800' },
      video_enviado: { variant: 'secondary', label: 'Vídeo Enviado', color: 'bg-blue-100 text-blue-800' },
      video_aprovado: { variant: 'success', label: 'Vídeo Aprovado', color: 'bg-green-100 text-green-800' },
      video_rejeitado: { variant: 'destructive', label: 'Vídeo Rejeitado', color: 'bg-red-100 text-red-800' },
      ativo: { variant: 'default', label: 'Ativo', color: 'bg-green-100 text-green-800' },
      cancelado: { variant: 'destructive', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    };
    
    return variants[status] || { variant: 'secondary', label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getVideoStatusIcon = (status: string) => {
    switch (status) {
      case 'pago_pendente_video':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'video_enviado':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'video_aprovado':
        return <Video className="h-4 w-4 text-green-500" />;
      case 'video_rejeitado':
        return <Video className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/super_admin/pedidos/${orderId}`);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
          <span className="ml-2 text-indexa-purple">Carregando pedidos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
          <p className="text-gray-600">Visualize e gerencie todos os pedidos com status de vídeo</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button className="bg-indexa-purple hover:bg-indexa-purple-dark text-white">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total de Pedidos</CardTitle>
            <Package className="h-4 w-4 text-indexa-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-green-600">Sistema conectado</p>
          </CardContent>
        </Card>

        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">R$ {stats.revenue.toFixed(2)}</div>
            <p className="text-xs text-green-600">Pedidos pagos</p>
          </CardContent>
        </Card>

        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Aguardando Vídeo</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.awaiting_video}</div>
            <p className="text-xs text-orange-500">Clientes pagaram</p>
          </CardContent>
        </Card>

        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Para Aprovação</CardTitle>
            <Video className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.video_sent}</div>
            <p className="text-xs text-blue-600">Vídeos enviados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ID, nome ou email do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pago_pendente_video')}>
                  Aguardando Vídeo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('video_enviado')}>
                  Vídeo Enviado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('video_aprovado')}>
                  Vídeo Aprovado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pendente')}>
                  Pendentes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('cancelado')}>
                  Cancelados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Lista de Pedidos</CardTitle>
          <CardDescription className="text-gray-600">
            {filteredOrders.length} pedidos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const statusInfo = getStatusBadge(order.status);
                const videoIcon = getVideoStatusIcon(order.status);
                
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-indexa-purple" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{order.client_name}</h3>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                          {videoIcon}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Email:</strong> {order.client_email}
                        </p>
                        <p className="text-sm text-gray-600">
                          ID: {order.id.substring(0, 8)}... • {order.plano_meses} meses • {Array.isArray(order.lista_paineis) ? order.lista_paineis.length : 0} painéis
                        </p>
                        <p className="text-xs text-gray-500">
                          <strong>Status do Vídeo:</strong> {order.video_status} • Criado em: {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">R$ {Number(order.valor_total || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {order.data_inicio && order.data_fim ? `${order.data_inicio} - ${order.data_fim}` : 'Período não definido'}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => handleViewOrder(order.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;

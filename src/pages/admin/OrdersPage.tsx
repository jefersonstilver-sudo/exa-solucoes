
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  Download,
  Package,
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
import { useOrdersDataComplete } from '@/hooks/useOrdersDataComplete';
import OrdersTable from '@/components/admin/orders/OrdersTable';

const OrdersPage = () => {
  const { orders, stats, loading, refetch } = useOrdersDataComplete();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
            <div className="text-2xl font-bold text-gray-900">
              R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
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
                  Status: {statusFilter === 'all' ? 'Todos' : statusFilter}
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
                <DropdownMenuItem onClick={() => setStatusFilter('pago')}>
                  Pagos
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
          <OrdersTable orders={filteredOrders} />
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;

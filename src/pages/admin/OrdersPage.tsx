
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
  Clock,
  CheckCircle,
  XCircle,
  Play
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEnhancedOrdersData } from '@/hooks/useEnhancedOrdersData';
import OrdersTable from '@/components/admin/orders/OrdersTable';
import DataMigrationPanel from '@/components/admin/orders/DataMigrationPanel';

const OrdersPage = () => {
  const { orders, stats, loading, refetch } = useEnhancedOrdersData();
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
          <span className="ml-2 text-gray-900 font-medium">Carregando pedidos...</span>
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
          <p className="text-gray-700 font-medium">Sistema completo de pedidos com dados sincronizados</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={refetch} 
            disabled={loading}
            className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button className="bg-indexa-purple hover:bg-indexa-purple/90 text-white font-semibold">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Data Migration Panel */}
      <DataMigrationPanel />

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Total</CardTitle>
            <Package className="h-4 w-4 text-indexa-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-indexa-purple font-medium">pedidos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indexa-purple/20 to-indexa-purple/10 border-indexa-purple/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Receita</CardTitle>
            <DollarSign className="h-4 w-4 text-indexa-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-indexa-purple font-medium">total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-100 to-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Aguard. Vídeo</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.awaiting_video}</div>
            <p className="text-xs text-orange-600 font-medium">pendentes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Vídeo Enviado</CardTitle>
            <Video className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.video_sent}</div>
            <p className="text-xs text-blue-600 font-medium">para análise</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.video_approved}</div>
            <p className="text-xs text-green-600 font-medium">aprovados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-100 to-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Rejeitados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.video_rejected}</div>
            <p className="text-xs text-red-600 font-medium">rejeitados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indexa-purple/20 to-indexa-purple/10 border-indexa-purple/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Ativos</CardTitle>
            <Play className="h-4 w-4 text-indexa-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
            <p className="text-xs text-indexa-purple font-medium">rodando</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 font-bold">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por ID, nome ou email do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white font-medium"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter === 'all' ? 'Todos' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-200">
                <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pago_pendente_video')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Aguardando Vídeo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('video_enviado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Vídeo Enviado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('video_aprovado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Vídeo Aprovado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('video_rejeitado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Vídeo Rejeitado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('ativo')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Ativos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pendente')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Pendentes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('cancelado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Cancelados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 font-bold">Lista de Pedidos</CardTitle>
          <CardDescription className="text-gray-700 font-medium">
            Sistema completo com dados dos clientes sincronizados e corrigidos
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

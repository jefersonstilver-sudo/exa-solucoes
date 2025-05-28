
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
import { useRealOrdersData } from '@/hooks/useRealOrdersData';
import OrdersTable from '@/components/admin/orders/OrdersTable';

const OrdersPage = () => {
  const { orders, stats, loading, refetch } = useRealOrdersData();
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
          <RefreshCw className="h-8 w-8 animate-spin text-[#00FFAB]" />
          <span className="ml-2 text-white">Carregando pedidos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Pedidos</h1>
          <p className="text-slate-300">Visualize e gerencie todos os pedidos com status de vídeo</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={refetch} 
            disabled={loading}
            className="border-[#00FFAB] text-[#00FFAB] hover:bg-[#00FFAB] hover:text-[#3C1361]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button className="bg-[#00FFAB] hover:bg-[#00FFAB]/80 text-[#3C1361] font-semibold">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total de Pedidos</CardTitle>
            <Package className="h-4 w-4 text-[#00FFAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-[#00FFAB]">Sistema conectado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#00FFAB]/20 to-[#00FFAB]/10 border-[#00FFAB]/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-[#00FFAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#00FFAB]">Pedidos pagos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3C1361]/30 to-[#3C1361]/20 border-[#3C1361]/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Aguardando Vídeo</CardTitle>
            <Clock className="h-4 w-4 text-[#00FFAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.awaiting_video}</div>
            <p className="text-xs text-[#00FFAB]">Clientes pagaram</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-700/50 to-slate-600/30 border-slate-600/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Para Aprovação</CardTitle>
            <Video className="h-4 w-4 text-[#00FFAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.video_sent}</div>
            <p className="text-xs text-[#00FFAB]">Vídeos enviados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por ID, nome ou email do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-[#00FFAB] text-[#00FFAB] hover:bg-[#00FFAB] hover:text-[#3C1361]"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter === 'all' ? 'Todos' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-white hover:bg-slate-700">
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pago_pendente_video')} className="text-white hover:bg-slate-700">
                  Aguardando Vídeo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('video_enviado')} className="text-white hover:bg-slate-700">
                  Vídeo Enviado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('video_aprovado')} className="text-white hover:bg-slate-700">
                  Vídeo Aprovado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pendente')} className="text-white hover:bg-slate-700">
                  Pendentes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pago')} className="text-white hover:bg-slate-700">
                  Pagos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('cancelado')} className="text-white hover:bg-slate-700">
                  Cancelados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Lista de Pedidos</CardTitle>
          <CardDescription className="text-slate-300">
            Gerenciamento completo de todos os pedidos com dados reais
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

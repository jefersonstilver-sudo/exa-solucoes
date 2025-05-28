
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
          <p className="text-slate-300">Sistema completo de pedidos com dados sincronizados</p>
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

      {/* Data Migration Panel */}
      <DataMigrationPanel />

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total</CardTitle>
            <Package className="h-4 w-4 text-[#00FFAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-[#00FFAB]">pedidos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#00FFAB]/20 to-[#00FFAB]/10 border-[#00FFAB]/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Receita</CardTitle>
            <DollarSign className="h-4 w-4 text-[#00FFAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#00FFAB]">total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3C1361]/30 to-[#3C1361]/20 border-[#3C1361]/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Aguard. Vídeo</CardTitle>
            <Clock className="h-4 w-4 text-[#00FFAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.awaiting_video}</div>
            <p className="text-xs text-[#00FFAB]">pendentes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-700/50 to-slate-600/30 border-slate-600/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Vídeo Enviado</CardTitle>
            <Video className="h-4 w-4 text-[#00FFAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.video_sent}</div>
            <p className="text-xs text-[#00FFAB]">para análise</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-500/10 border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.video_approved}</div>
            <p className="text-xs text-green-400">aprovados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-red-500/10 border-red-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Rejeitados</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.video_rejected}</div>
            <p className="text-xs text-red-400">rejeitados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#00FFAB]/20 to-[#00FFAB]/10 border-[#00FFAB]/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Ativos</CardTitle>
            <Play className="h-4 w-4 text-[#00FFAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.active}</div>
            <p className="text-xs text-[#00FFAB]">rodando</p>
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
                <DropdownMenuItem onClick={() => setStatusFilter('video_rejeitado')} className="text-white hover:bg-slate-700">
                  Vídeo Rejeitado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('ativo')} className="text-white hover:bg-slate-700">
                  Ativos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pendente')} className="text-white hover:bg-slate-700">
                  Pendentes
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

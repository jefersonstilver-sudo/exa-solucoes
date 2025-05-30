
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrdersWithAttempts } from '@/hooks/useOrdersWithAttempts';
import OrdersStatsCards from '@/components/admin/orders/OrdersStatsCards';
import DataMigrationPanel from '@/components/admin/orders/DataMigrationPanel';
import OrdersTabs from '@/components/admin/orders/OrdersTabs';

const OrdersPage = () => {
  const { ordersAndAttempts, stats, loading, refetch } = useOrdersWithAttempts();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredItems = ordersAndAttempts.filter(item => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type === 'order' ? item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (item.type === 'order' ? item.client_email.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (item.type === 'attempt' && item.client_email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (item.type === 'order' && item.status === statusFilter) ||
      (item.type === 'attempt' && statusFilter === 'tentativa');
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Separar pedidos por status para mostrar estatísticas mais claras
  const pendingOrders = filteredItems.filter(item => 
    item.type === 'order' && item.status === 'pendente'
  ).length;

  const totalAttempts = filteredItems.filter(item => item.type === 'attempt').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
          <span className="ml-2 text-gray-900 font-medium">Carregando pedidos e tentativas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Todos os Pedidos</h1>
          <p className="text-gray-800 font-medium">Sistema completo incluindo pedidos concluídos e tentativas de compra para CRM</p>
          
          {/* Alertas importantes */}
          {pendingOrders > 0 && (
            <div className="mt-2 flex items-center text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                {pendingOrders} pedido{pendingOrders > 1 ? 's' : ''} aguardando pagamento
              </span>
            </div>
          )}
          
          {totalAttempts > 0 && (
            <div className="mt-2 flex items-center text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                {totalAttempts} tentativa{totalAttempts > 1 ? 's' : ''} de compra - Oportunidades de CRM
              </span>
            </div>
          )}
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
      <OrdersStatsCards stats={stats} />

      {/* Filters and Search */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 font-bold">
            <TrendingUp className="h-5 w-5 mr-2 text-indexa-purple" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                <Input
                  placeholder="Buscar por ID, nome ou email do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-600 focus:border-indexa-purple focus:ring-indexa-purple"
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
                  Tipo: {typeFilter === 'all' ? 'Todos' : typeFilter === 'order' ? 'Pedidos' : 'Tentativas'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-200">
                <DropdownMenuItem onClick={() => setTypeFilter('all')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('order')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Apenas Pedidos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('attempt')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  Apenas Tentativas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                <DropdownMenuItem onClick={() => setStatusFilter('pendente')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  ⏳ Aguardando Pagamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('tentativa')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  ❌ Tentativas Abandonadas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pago_pendente_video')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  📹 Aguardando Vídeo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('video_enviado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  📤 Vídeo Enviado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('video_aprovado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  ✅ Vídeo Aprovado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('ativo')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  🟢 Ativos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('cancelado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  🚫 Cancelados
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('expirado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                  ⏰ Expirados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* NEW: Sistema de Abas */}
      <OrdersTabs />
    </div>
  );
};

export default OrdersPage;

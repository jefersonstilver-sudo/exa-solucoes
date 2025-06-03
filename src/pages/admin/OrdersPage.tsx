
import React, { useState } from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useOrdersWithAttempts } from '@/hooks/useOrdersWithAttempts';
import { useRealOrderDetails } from '@/hooks/useRealOrderDetails';
import OrdersStatsCards from '@/components/admin/orders/OrdersStatsCards';
import OrdersTabs from '@/components/admin/orders/OrdersTabs';
import OrdersPageHeader from '@/components/admin/orders/OrdersPageHeader';
import OrdersPageAlerts from '@/components/admin/orders/OrdersPageAlerts';
import OrdersPageFilters from '@/components/admin/orders/OrdersPageFilters';
import { RealOrderHeader } from '@/components/admin/orders/RealOrderHeader';
import { RealOrderCustomerCard } from '@/components/admin/orders/RealOrderCustomerCard';
import { RealOrderInfoCard } from '@/components/admin/orders/RealOrderInfoCard';
import { RealOrderFinancialCard } from '@/components/admin/orders/RealOrderFinancialCard';
import { RealOrderPanelsCard } from '@/components/admin/orders/RealOrderPanelsCard';
import { RealOrderVideosCard } from '@/components/admin/orders/RealOrderVideosCard';
import { Button } from '@/components/ui/button';

const OrdersPage = () => {
  const { ordersAndAttempts, stats, loading, refetch } = useOrdersWithAttempts();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Hook para carregar detalhes do pedido selecionado
  const { loading: orderDetailsLoading, orderDetails, orderVideos, panelData } = useRealOrderDetails(selectedOrderId || '');

  // Calcular pedidos ativos para os stats
  const activeOrdersCount = ordersAndAttempts.filter(item => {
    if (item.type !== 'order') return false;
    if (!['ativo', 'video_aprovado'].includes(item.status)) return false;
    if (!item.data_inicio || !item.data_fim) return false;
    
    const today = new Date();
    const startDate = new Date(item.data_inicio);
    const endDate = new Date(item.data_fim);
    return today >= startDate && today <= endDate;
  }).length;

  const filteredItems = ordersAndAttempts.filter(item => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.type === 'order' ? item.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (item.type === 'order' ? item.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (item.type === 'attempt' && item.client_email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (item.type === 'order' && item.status === statusFilter) ||
      (item.type === 'attempt' && statusFilter === 'tentativa');
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewOrderDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
  };

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

  // Se um pedido está selecionado, mostrar os detalhes
  if (selectedOrderId) {
    if (orderDetailsLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Lista
            </Button>
          </div>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
            <span className="ml-2 text-gray-900 font-medium">Carregando detalhes do pedido...</span>
          </div>
        </div>
      );
    }

    if (!orderDetails) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Lista
            </Button>
          </div>
          <div className="text-center bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">Pedido não encontrado</h2>
            <p className="text-gray-600 mt-2">O pedido solicitado não existe ou foi removido.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Botão de voltar */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Lista
          </Button>
        </div>

        {/* Detalhes do pedido */}
        <div className="space-y-8">
          {/* Header com informações principais e export profissional */}
          <RealOrderHeader 
            order={orderDetails} 
            panels={panelData}
            videos={orderVideos}
          />

          {/* Grid de informações principais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações do Cliente */}
            <RealOrderCustomerCard order={orderDetails} />

            {/* Informações do Pedido */}
            <RealOrderInfoCard order={orderDetails} />

            {/* Resumo Financeiro */}
            <RealOrderFinancialCard order={orderDetails} />
          </div>

          {/* Seção de Painéis */}
          <RealOrderPanelsCard panels={panelData} order={orderDetails} />

          {/* Seção de Gestão de Vídeos */}
          <RealOrderVideosCard videos={orderVideos} orderId={orderDetails.id} />
        </div>
      </div>
    );
  }

  // Visualização padrão da lista de pedidos
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <OrdersPageHeader onRefresh={refetch} loading={loading} />
        <div className="mt-2">
          <OrdersPageAlerts ordersAndAttempts={filteredItems} />
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <OrdersStatsCards stats={stats} activeOrdersCount={activeOrdersCount} />

      {/* Filters and Search */}
      <OrdersPageFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
      />

      {/* Sistema de Abas */}
      <OrdersTabs onViewOrderDetails={handleViewOrderDetails} />
    </div>
  );
};

export default OrdersPage;

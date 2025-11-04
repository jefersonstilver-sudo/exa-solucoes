import React, { useState, useMemo } from 'react';
import { RefreshCw, Gift, Download, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrdersWithAttemptsRefactored } from '@/hooks/useOrdersWithAttemptsRefactored';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import OrdersStatsCards from '@/components/admin/orders/OrdersStatsCards';
import OrdersTabs from '@/components/admin/orders/OrdersTabs';
import OrdersPageHeader from '@/components/admin/orders/OrdersPageHeader';
import OrdersPageAlerts from '@/components/admin/orders/OrdersPageAlerts';
import OrdersPageFilters from '@/components/admin/orders/OrdersPageFilters';
import { OrderMobileList } from '@/components/admin/orders/OrderMobileList';
import { MobileActionMenu } from '@/components/admin/shared/MobileActionMenu';
import { OrderPeriodFilter, filterByPeriod, PeriodFilter } from '@/components/admin/orders/OrderPeriodFilter';
import { calculateStats } from '@/services/ordersAndAttemptsProcessor';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { isMobile } = useAdvancedResponsive();
  const { ordersAndAttempts, stats, loading, refetch } = useOrdersWithAttemptsRefactored();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('current_month'); // Default: mês atual
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Aplicar filtro de período primeiro
  const periodFilteredItems = useMemo(() => {
    return filterByPeriod(ordersAndAttempts, periodFilter);
  }, [ordersAndAttempts, periodFilter]);

  // Recalcular stats baseado no período filtrado
  const filteredStats = useMemo(() => {
    const orders = periodFilteredItems.filter(item => item.type === 'order');
    const attempts = periodFilteredItems.filter(item => item.type === 'attempt');
    return calculateStats(orders, attempts);
  }, [periodFilteredItems]);

  // Calcular pedidos ativos para os stats (sempre considerar todos, não filtrar por período)
  const activeOrdersCount = ordersAndAttempts.filter(item => {
    if (item.type !== 'order') return false;
    if (item.status !== 'video_aprovado') return false;
    if (!item.data_inicio || !item.data_fim) return false;
    
    const today = new Date();
    const startDate = new Date(item.data_inicio);
    const endDate = new Date(item.data_fim);
    return today >= startDate && today <= endDate;
  }).length;

  const filteredItems = periodFilteredItems.filter(item => {
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
    navigate(`/super_admin/pedidos/${orderId}`);
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

  // Mobile Actions Menu
  const mobileMenuItems = [
    {
      icon: <RefreshCw className="h-4 w-4" />,
      label: 'Atualizar',
      onClick: refetch,
    },
    {
      icon: <Download className="h-4 w-4" />,
      label: 'Exportar Relatório',
      onClick: () => {},
    },
    {
      icon: <Filter className="h-4 w-4" />,
      label: 'Filtros',
      onClick: () => setShowMobileFilters(!showMobileFilters),
    },
  ];

  // Mobile Layout
  if (isMobile) {
    const orders = filteredItems.filter(item => item.type === 'order');
    
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] border-b border-white/20 shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Pedidos</h1>
                  <p className="text-sm text-white/90">
                    {stats.total_orders} pedidos • {stats.total_attempts} tentativas
                  </p>
                </div>
              </div>
              <MobileActionMenu items={mobileMenuItems} />
            </div>
          </div>
        </div>

        {/* Period Filter */}
        <div className="p-4 bg-white border-b">
          <OrderPeriodFilter value={periodFilter} onChange={setPeriodFilter} />
        </div>

        {/* Mobile Stats - Compact */}
        <div className="p-4 bg-white border-b">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Pedidos</p>
              <p className="text-lg font-bold text-foreground">{filteredStats.total_orders}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita</p>
              <p className="text-lg font-bold text-green-600">
                R$ {(filteredStats.total_revenue / 1000).toFixed(1)}k
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conversão</p>
              <p className="text-lg font-bold text-blue-600">{filteredStats.conversion_rate}%</p>
            </div>
          </div>
        </div>

        {/* Mobile Filters (conditionally shown) */}
        {showMobileFilters && (
          <div className="p-4 bg-white border-b space-y-3 animate-fade-in">
            <input
              type="text"
              placeholder="🔍 Buscar pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">Todos os Status</option>
                <option value="pago">Pago</option>
                <option value="aguardando_pagamento">Aguardando</option>
                <option value="video_aprovado">Aprovado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">Todos os Tipos</option>
                <option value="order">Pedidos</option>
                <option value="attempt">Tentativas</option>
              </select>
            </div>
          </div>
        )}

        {/* Mobile Order List */}
        <div className="p-4">
          <OrderMobileList
            orders={orders}
            loading={loading}
            onViewDetails={handleViewOrderDetails}
          />
        </div>
      </div>
    );
  }

  // Desktop Layout (unchanged)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <OrdersPageHeader onRefresh={refetch} loading={loading} />
        <div className="mt-2">
          <OrdersPageAlerts ordersAndAttempts={filteredItems} />
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex justify-end">
        <OrderPeriodFilter value={periodFilter} onChange={setPeriodFilter} />
      </div>

      {/* Enhanced Stats Cards */}
      <OrdersStatsCards stats={filteredStats} activeOrdersCount={activeOrdersCount} />

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

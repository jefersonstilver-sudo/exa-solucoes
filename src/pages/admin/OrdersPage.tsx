import React, { useState, useMemo } from 'react';
import { RefreshCw, ShoppingCart, Download, Search, Filter, Loader2 } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOrdersWithAttemptsRefactored } from '@/hooks/useOrdersWithAttemptsRefactored';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import OrdersCompactStats from '@/components/admin/orders/OrdersCompactStats';
import OrdersTabs from '@/components/admin/orders/OrdersTabs';
import OrdersCompactHeader from '@/components/admin/orders/OrdersCompactHeader';
import OrdersPageAlerts from '@/components/admin/orders/OrdersPageAlerts';
import OrdersPageFilters from '@/components/admin/orders/OrdersPageFilters';
import { OrderMobileList } from '@/components/admin/orders/OrderMobileList';
import { MobileActionMenu } from '@/components/admin/shared/MobileActionMenu';
import { MobileFilterSheet } from '@/components/admin/shared/MobileFilterSheet';
import { FilterChips } from '@/components/admin/shared/FilterChips';
import { OrderPeriodFilter, filterByPeriod, PeriodFilter } from '@/components/admin/orders/OrderPeriodFilter';
import { calculateStats } from '@/services/ordersAndAttemptsProcessor';
import { FixPedidoListaPaineisButton } from '@/components/admin/FixPedidoListaPaineisButton';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { isMobile } = useAdvancedResponsive();
  const { canViewOrders, isLoadingCustom } = useUserPermissions();
  const { ordersAndAttempts, stats, loading, refetch } = useOrdersWithAttemptsRefactored();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [couponFilter, setCouponFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('current_month');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // 🔒 CRITICAL: Wait for permissions to load before checking
  if (isLoadingCustom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!canViewOrders) {
    return <Navigate to="/admin" replace />;
  }

  // Aplicar filtro de período primeiro
  const periodFilteredItems = useMemo(() => {
    return filterByPeriod(ordersAndAttempts, periodFilter);
  }, [ordersAndAttempts, periodFilter]);

  // Aplicar filtros de busca, status, tipo, cupom e tipo de pagamento
  const filteredItems = useMemo(() => {
    return periodFilteredItems.filter(item => {
      const matchesSearch = 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type === 'order' ? item.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        (item.type === 'order' ? item.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        (item.type === 'attempt' && item.client_email?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
        (item.type === 'order' && item.status === statusFilter) ||
        (item.type === 'attempt' && statusFilter === 'tentativa');
      
      const matchesType = typeFilter === 'all' || item.type === typeFilter;

      const matchesCoupon = couponFilter === 'all' ||
        (couponFilter === 'with' && (item.cupom_id || item.coupon_code)) ||
        (couponFilter === 'without' && !item.cupom_id && !item.coupon_code);
      
      const matchesPaymentType = paymentTypeFilter === 'all' ||
        (paymentTypeFilter === 'fidelidade' && item.is_fidelidade) ||
        (paymentTypeFilter === 'avista' && !item.is_fidelidade && item.tipo_pagamento === 'pix_avista') ||
        (paymentTypeFilter === 'cartao' && item.tipo_pagamento === 'cartao');
      
      return matchesSearch && matchesStatus && matchesType && matchesCoupon && matchesPaymentType;
    });
  }, [periodFilteredItems, searchTerm, statusFilter, typeFilter, couponFilter, paymentTypeFilter]);

  // Recalcular stats baseado nos itens filtrados
  const filteredStats = useMemo(() => {
    const orders = filteredItems.filter(item => item.type === 'order');
    const attempts = filteredItems.filter(item => item.type === 'attempt');
    return calculateStats(orders, attempts);
  }, [filteredItems]);

  // Calcular pedidos com vídeos ativos (campanhas ativas)
  const [activeOrdersCount, setActiveOrdersCount] = React.useState(0);
  
  React.useEffect(() => {
    const fetchActiveOrdersCount = async () => {
      const { data, error } = await supabase
        .from('pedido_videos')
        .select('pedido_id', { count: 'exact', head: false })
        .eq('is_active', true);
      
      if (!error && data) {
        // Contar pedidos únicos com vídeos ativos
        const uniquePedidos = new Set(data.map(pv => pv.pedido_id));
        setActiveOrdersCount(uniquePedidos.size);
      }
    };
    
    fetchActiveOrdersCount();
  }, [ordersAndAttempts]);

  // Contadores para filtros
  const countByStatus = (status: string) => 
    periodFilteredItems.filter(item => item.status === status).length;
  
  const countByType = (type: string) => 
    periodFilteredItems.filter(item => item.type === type).length;

  const countByCoupon = (hasCoupon: boolean) =>
    periodFilteredItems.filter(item => 
      hasCoupon ? (item.cupom_id || item.coupon_code) : (!item.cupom_id && !item.coupon_code)
    ).length;

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (couponFilter !== 'all') count++;
    if (paymentTypeFilter !== 'all') count++;
    return count;
  }, [searchTerm, statusFilter, typeFilter, couponFilter, paymentTypeFilter]);

  // Chips de filtros
  const filterChips = useMemo(() => {
    const chips = [];
    if (searchTerm) {
      chips.push({ key: 'search', label: `Busca: "${searchTerm}"`, value: searchTerm });
    }
    if (statusFilter !== 'all') {
      const statusLabels: Record<string, string> = {
        pago: 'Pago',
        'pago_pendente_video': 'Pago (Pendente Vídeo)',
        'video_enviado': 'Vídeo Enviado',
        'video_aprovado': 'Vídeo Aprovado',
        pending: 'Pendente',
        bloqueado: 'Bloqueado',
      };
      chips.push({ key: 'status', label: statusLabels[statusFilter] || statusFilter, value: statusFilter });
    }
    if (typeFilter !== 'all') {
      chips.push({ key: 'type', label: typeFilter === 'order' ? 'Pedidos' : 'Tentativas', value: typeFilter });
    }
    if (couponFilter !== 'all') {
      chips.push({ key: 'coupon', label: couponFilter === 'with' ? 'Com Cupom' : 'Sem Cupom', value: couponFilter });
    }
    if (paymentTypeFilter !== 'all') {
      const paymentLabels: Record<string, string> = {
        fidelidade: 'Fidelidade',
        avista: 'PIX à Vista',
        cartao: 'Cartão'
      };
      chips.push({ key: 'payment', label: paymentLabels[paymentTypeFilter] || paymentTypeFilter, value: paymentTypeFilter });
    }
    return chips;
  }, [searchTerm, statusFilter, typeFilter, couponFilter, paymentTypeFilter]);

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case 'search': setSearchTerm(''); break;
      case 'status': setStatusFilter('all'); break;
      case 'type': setTypeFilter('all'); break;
      case 'coupon': setCouponFilter('all'); break;
      case 'payment': setPaymentTypeFilter('all'); break;
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCouponFilter('all');
    setPaymentTypeFilter('all');
  };

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
      label: 'Exportar',
      onClick: () => console.log('Export clicked'),
    },
    {
      icon: <Filter className="h-4 w-4" />,
      label: 'Filtros',
      badge: activeFiltersCount > 0 ? activeFiltersCount : undefined,
      onClick: () => setShowMobileFilters(true),
    },
  ];

  // Mobile Layout - Apple-like Clean Design
  if (isMobile) {
    const orders = filteredItems.filter(item => item.type === 'order');
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
        {/* Mobile Header - Clean glassmorphism */}
        <div className="sticky top-0 z-10 mobile-header-clean">
          <div className="px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-sm">
                  <ShoppingCart className="w-4.5 h-4.5 text-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Pedidos</h1>
                  <p className="text-xs text-muted-foreground">
                    {filteredItems.length} resultados
                  </p>
                </div>
              </div>
              <MobileActionMenu items={mobileMenuItems} />
            </div>
          </div>
        </div>

        {/* Period Filter - Clean style */}
        <div className="px-3 py-2 border-b border-border/30">
          <OrderPeriodFilter value={periodFilter} onChange={setPeriodFilter} />
        </div>

        {/* Mobile Stats - Glassmorphism cards */}
        <div className="grid grid-cols-3 gap-2 px-3 py-3">
          <div className="glass-card-mobile-subtle p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Pedidos</p>
            <p className="text-lg font-bold text-foreground">{filteredStats.total_orders}</p>
          </div>
          <div className="glass-card-mobile-subtle p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Receita</p>
            <p className="text-lg font-bold text-emerald-600">
              R$ {(filteredStats.total_revenue / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="glass-card-mobile-subtle p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Conversão</p>
            <p className="text-lg font-bold text-blue-600">{filteredStats.conversion_rate}%</p>
          </div>
        </div>

        {/* Filter Chips */}
        <FilterChips
          chips={filterChips}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />

        {/* Mobile Order List */}
        <div className="px-3 py-2">
          <OrderMobileList
            orders={orders}
            loading={loading}
            onViewDetails={handleViewOrderDetails}
          />
        </div>

        {/* Mobile Filter Sheet */}
        <MobileFilterSheet
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          filters={{
            search: searchTerm,
            status: statusFilter,
            type: typeFilter,
            coupon: couponFilter,
            payment: paymentTypeFilter,
          }}
          onFiltersChange={(newFilters) => {
            setSearchTerm(newFilters.search || '');
            setStatusFilter(newFilters.status || 'all');
            setTypeFilter(newFilters.type || 'all');
            setCouponFilter(newFilters.coupon || 'all');
            setPaymentTypeFilter(newFilters.payment || 'all');
          }}
          categories={[
            {
              id: 'status',
              title: '📊 Status',
              options: [
                { value: 'all', label: 'Todos', count: periodFilteredItems.length },
                { value: 'pago', label: 'Pago', count: countByStatus('pago') },
                { value: 'pago_pendente_video', label: 'Pago (Vídeo)', count: countByStatus('pago_pendente_video') },
                { value: 'video_enviado', label: 'Vídeo Enviado', count: countByStatus('video_enviado') },
                { value: 'video_aprovado', label: 'Aprovado', count: countByStatus('video_aprovado') },
                { value: 'pending', label: 'Pendente', count: countByStatus('pending') },
                { value: 'bloqueado', label: 'Bloqueado', count: countByStatus('bloqueado') },
              ],
            },
            {
              id: 'type',
              title: '🏷️ Tipo',
              options: [
                { value: 'all', label: 'Todos', count: periodFilteredItems.length },
                { value: 'order', label: 'Pedidos', count: countByType('order') },
                { value: 'attempt', label: 'Tentativas', count: countByType('attempt') },
              ],
            },
            {
              id: 'coupon',
              title: '🎫 Cupom',
              options: [
                { value: 'all', label: 'Todos', count: periodFilteredItems.length },
                { value: 'with', label: 'Com Cupom', count: countByCoupon(true) },
                { value: 'without', label: 'Sem Cupom', count: countByCoupon(false) },
              ],
            },
            {
              id: 'payment',
              title: '💳 Pagamento',
              options: [
                { value: 'all', label: 'Todos', count: periodFilteredItems.length },
                { value: 'fidelidade', label: 'Fidelidade', count: periodFilteredItems.filter(i => i.is_fidelidade).length },
                { value: 'avista', label: 'PIX à Vista', count: periodFilteredItems.filter(i => !i.is_fidelidade && i.tipo_pagamento === 'pix_avista').length },
                { value: 'cartao', label: 'Cartão', count: periodFilteredItems.filter(i => i.tipo_pagamento === 'cartao').length },
              ],
            },
          ]}
          activeFiltersCount={activeFiltersCount}
        />
      </div>
    );
  }

  // Desktop Layout - Apple-like Minimalista
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/90 border-b border-border/30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6">
          <OrdersCompactHeader 
            onRefresh={refetch} 
            loading={loading}
            periodFilter={periodFilter}
            onPeriodChange={setPeriodFilter}
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        {/* Alerts */}
        {filteredItems.length > 0 && <OrdersPageAlerts ordersAndAttempts={filteredItems} />}

        {/* Compact Stats Row */}
        <div className="animate-fade-in">
          <OrdersCompactStats stats={filteredStats} activeOrdersCount={activeOrdersCount} />
        </div>

        {/* Filters and Search */}
        <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-border/50 p-4 shadow-sm">
          <OrdersPageFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            paymentTypeFilter={paymentTypeFilter}
            setPaymentTypeFilter={setPaymentTypeFilter}
          />
        </div>

        {/* Orders Tabs */}
        <div className="animate-fade-in">
          <OrdersTabs onViewOrderDetails={handleViewOrderDetails} />
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;

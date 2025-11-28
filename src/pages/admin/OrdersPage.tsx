import React, { useState, useMemo } from 'react';
import { RefreshCw, Gift, Download, Search, Filter, Loader2 } from 'lucide-react';
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
import { RealtimeOrderNotification } from '@/components/admin/orders/RealtimeOrderNotification';
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

  // Aplicar filtros de busca, status, tipo e cupom
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
      
      return matchesSearch && matchesStatus && matchesType && matchesCoupon;
    });
  }, [periodFilteredItems, searchTerm, statusFilter, typeFilter, couponFilter]);

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
    return count;
  }, [searchTerm, statusFilter, typeFilter, couponFilter]);

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
    return chips;
  }, [searchTerm, statusFilter, typeFilter, couponFilter]);

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case 'search': setSearchTerm(''); break;
      case 'status': setStatusFilter('all'); break;
      case 'type': setTypeFilter('all'); break;
      case 'coupon': setCouponFilter('all'); break;
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCouponFilter('all');
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
                    {filteredItems.length} resultados
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

        {/* Filter Chips */}
        <FilterChips
          chips={filterChips}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />

        {/* Mobile Order List */}
        <div className="p-4">
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
          }}
          onFiltersChange={(newFilters) => {
            setSearchTerm(newFilters.search || '');
            setStatusFilter(newFilters.status || 'all');
            setTypeFilter(newFilters.type || 'all');
            setCouponFilter(newFilters.coupon || 'all');
          }}
          categories={[
            {
              id: 'status',
              title: '📊 Status',
              options: [
                { value: 'all', label: 'Todos', count: periodFilteredItems.length },
                { value: 'pago', label: 'Pago', count: countByStatus('pago') },
                { value: 'pago_pendente_video', label: 'Pago (Pendente Vídeo)', count: countByStatus('pago_pendente_video') },
                { value: 'video_enviado', label: 'Vídeo Enviado', count: countByStatus('video_enviado') },
                { value: 'video_aprovado', label: 'Vídeo Aprovado', count: countByStatus('video_aprovado') },
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
        {/* Realtime Notification - Floating */}
        <div className="fixed top-24 right-8 z-30">
          <RealtimeOrderNotification />
        </div>

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

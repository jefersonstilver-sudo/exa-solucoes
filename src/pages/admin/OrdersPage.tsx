import React, { useState, useMemo } from 'react';
import { RefreshCw, ShoppingCart, Download, Search, Filter, Loader2, Plus } from 'lucide-react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOrdersWithAttemptsRefactored } from '@/hooks/useOrdersWithAttemptsRefactored';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import ResumoPedidos from '@/components/admin/orders/ResumoPedidos';
import OrdersTabsRefactored from '@/components/admin/orders/OrdersTabsRefactored';
import { OrderMobileList } from '@/components/admin/orders/OrderMobileList';
import { MobileActionMenu } from '@/components/admin/shared/MobileActionMenu';
import { MobileFilterSheet } from '@/components/admin/shared/MobileFilterSheet';
import { FilterChips } from '@/components/admin/shared/FilterChips';
import { OrderPeriodFilter, filterByPeriod, PeriodFilter } from '@/components/admin/orders/OrderPeriodFilter';
import { calculateStats } from '@/services/ordersAndAttemptsProcessor';
import { FixPedidoListaPaineisButton } from '@/components/admin/FixPedidoListaPaineisButton';
import AdminCreateOrderDialog from '@/components/admin/orders/create/AdminCreateOrderDialog';
import { Pagina, Cabecalho, Busca, Pilulas, BOTAO, BOTAO2, CAMPO, Carregando } from '@/components/admin/ui/exa';


const OrdersPage = () => {
  const navigate = useNavigate();
  const { isMobile } = useAdvancedResponsive();
  const { canViewOrders, isLoadingCustom } = useUserPermissions();
  const { ordersAndAttempts, stats, loading, refetch } = useOrdersWithAttemptsRefactored();
  
  const [qs] = useSearchParams();
  // ?busca= vem das fichas do CRM (ex.: Lívia → pedidos do cliente)
  const [searchTerm, setSearchTerm] = useState(qs.get('busca') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [couponFilter, setCouponFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'all' | 'pagos' | 'aguardando' | 'ativos'>('all');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  
  // Estado para pedidos com vídeos ativos (campanhas em exibição)
  const [activeOrdersCount, setActiveOrdersCount] = React.useState(0);
  const [activePedidoIds, setActivePedidoIds] = React.useState<Set<string>>(new Set());
  
  // Buscar pedidos com vídeos ativos
  React.useEffect(() => {
    const fetchActiveOrdersData = async () => {
      const { data, error } = await supabase
        .from('pedido_videos')
        .select('pedido_id')
        .eq('is_active', true);
      
      if (!error && data) {
        const uniquePedidoIds = new Set(data.map(pv => pv.pedido_id).filter(Boolean) as string[]);
        setActivePedidoIds(uniquePedidoIds);
        setActiveOrdersCount(uniquePedidoIds.size);
      }
    };
    
    fetchActiveOrdersData();
  }, [ordersAndAttempts]);
  
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
        (item.type === 'order' ? (item as any).empresa_nome?.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        (item.type === 'order' ? (item as any).nome_pedido?.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        (item.type === 'order' ? item.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
        (item.type === 'attempt' && item.client_email?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status inteligentes que não são status diretos do banco
      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'em_exibicao') {
        // Pedidos com vídeos ativos na tabela pedido_videos
        matchesStatus = item.type === 'order' && activePedidoIds.has(item.id);
      } else if (statusFilter === 'aguardando_video') {
        // Pedidos pagos aguardando envio de vídeo
        matchesStatus = item.type === 'order' && ['pago', 'pago_pendente_video'].includes(item.status);
      } else if (statusFilter === 'aguardando_aprovacao') {
        // Pedidos com vídeo enviado aguardando aprovação
        matchesStatus = item.type === 'order' && item.status === 'video_enviado';
      } else if (statusFilter === 'aguardando_pagamento') {
        // Pedidos pendentes de pagamento
        matchesStatus = item.type === 'order' && item.status === 'pendente';
      } else if (statusFilter === 'tentativa') {
        // Tentativas de compra abandonadas
        matchesStatus = item.type === 'attempt';
      } else {
        // Status diretos do banco
        matchesStatus = item.type === 'order' && item.status === statusFilter;
      }
      
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
  }, [periodFilteredItems, searchTerm, statusFilter, typeFilter, couponFilter, paymentTypeFilter, activePedidoIds]);
  const idsFiltrados = useMemo(() => new Set(filteredItems.map((i) => i.id)), [filteredItems]);

  // Recalcular stats baseado nos itens filtrados
  const filteredStats = useMemo(() => {
    const orders = filteredItems.filter(item => item.type === 'order');
    const attempts = filteredItems.filter(item => item.type === 'attempt');
    return calculateStats(orders, attempts);
  }, [filteredItems]);

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
    // Sempre abre a página de detalhe administrativo do pedido.
    // A visualização "como cliente" fica disponível dentro dessa página, em modal interno.
    navigate(`/super_admin/pedidos/${orderId}`);
  };

  if (loading) return <Carregando texto="Carregando pedidos…" />;

  // Mobile Actions Menu
  const mobileMenuItems = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: 'Novo Pedido',
      onClick: () => setShowCreateOrder(true),
    },
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
    // Apply quick filter to orders
    const ordersOnly = filteredItems.filter(item => item.type === 'order');
    const quickFilteredOrders = ordersOnly.filter(order => {
      if (quickFilter === 'all') return true;
      if (quickFilter === 'pagos') return ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'].includes(order.status);
      if (quickFilter === 'aguardando') return order.status === 'pago_pendente_video';
      if (quickFilter === 'ativos') return ['ativo', 'video_aprovado'].includes(order.status);
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Count for quick filters
    const countPagos = ordersOnly.filter(o => ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'].includes(o.status)).length;
    const countAguardando = ordersOnly.filter(o => o.status === 'pago_pendente_video').length;
    const countAtivos = ordersOnly.filter(o => ['ativo', 'video_aprovado'].includes(o.status)).length;
    
    return (
      <div className="-m-3 min-h-full pb-4">
        {/* Cabeçalho do celular */}
        <div className="sticky top-0 z-10 bg-[#F4F1EC]/90 backdrop-blur-xl">
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#17181A]">Pedidos</h1>
                  <p className="text-[12px] text-gray-500">
                    {quickFilteredOrders.length} resultados
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-[148px]"><OrderPeriodFilter value={periodFilter} onChange={setPeriodFilter} /></div>
                <MobileActionMenu items={mobileMenuItems} />
              </div>
            </div>
          </div>
          
          {/* Filtros rápidos: pílulas simples (preto = ativo) */}
          <div className="px-3 pb-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 whitespace-nowrap">
              {([
                ['all', 'Todos', ordersOnly.length],
                ['pagos', 'Pagos', countPagos],
                ['aguardando', 'Aguardando vídeo', countAguardando],
                ['ativos', 'Ativos', countAtivos],
              ] as const).map(([v, l, n]) => (
                <button
                  key={v}
                  onClick={() => setQuickFilter(v as any)}
                  className={`h-8 px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
                    quickFilter === v ? 'bg-[#17181A] text-white' : 'bg-black/[0.05] text-[#55565B] active:bg-black/10'
                  }`}
                >
                  {l} <span className="opacity-60">{n}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resumo em uma linha */}
        <div className="mx-3 mt-1 mb-2 flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-black/[0.06]">
          <div><p className="text-[11px] font-semibold text-gray-500">Pedidos</p><p className="text-lg font-extrabold tabular-nums text-gray-900">{filteredStats.total_orders}</p></div>
          <div className="h-8 w-px bg-black/[0.07]" />
          <div><p className="text-[11px] font-semibold text-gray-500">Receita</p><p className="text-lg font-extrabold tabular-nums text-emerald-700">R$ {(filteredStats.total_revenue / 1000).toFixed(1).replace('.', ',')} mil</p></div>
          <div className="h-8 w-px bg-black/[0.07]" />
          <div><p className="text-[11px] font-semibold text-gray-500">Conversão</p><p className="text-lg font-extrabold tabular-nums text-gray-900">{filteredStats.conversion_rate}%</p></div>
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
            orders={quickFilteredOrders}
            loading={loading}
            onViewDetails={handleViewOrderDetails}
            onStatusChanged={refetch}
            onBulkDelete={async (ids) => {
              const { error } = await supabase
                .from('pedidos')
                .delete()
                .in('id', ids);
              if (!error) {
                refetch();
              }
            }}
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

        {/* Create Order Dialog */}
        <AdminCreateOrderDialog
          open={showCreateOrder}
          onOpenChange={setShowCreateOrder}
          onSuccess={refetch}
        />

      </div>
    );
  }

  // Desktop (07/11/2026): kit de vidro — cabeçalho, resumo, busca com pílulas de status, lista
  const nStatus = (v: string) => periodFilteredItems.filter((i) => {
    if (v === 'em_exibicao') return i.type === 'order' && ['ativo', 'video_aprovado'].includes(i.status);
    if (v === 'aguardando_video') return i.type === 'order' && ['pago', 'pago_pendente_video'].includes(i.status);
    if (v === 'aguardando_aprovacao') return i.type === 'order' && i.status === 'video_enviado';
    if (v === 'aguardando_pagamento') return i.type === 'order' && ['pendente', 'pending', 'aguardando_pagamento'].includes(i.status);
    if (v === 'bloqueado') return i.type === 'order' && i.status === 'bloqueado';
    if (v === 'tentativa') return i.type === 'attempt';
    return true;
  }).length;
  return (
    <Pagina larga>
      <Cabecalho
        titulo="Pedidos"
        sub="Quem está no ar, quem deve, quem termina em breve. Bloqueados ficam cinza no fim e fora da receita."
        acoes={(
          <>
            <div className="w-[170px]"><OrderPeriodFilter value={periodFilter} onChange={setPeriodFilter} /></div>
            <button type="button" className={BOTAO2} onClick={() => refetch()} title="Atualizar"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <button type="button" className={BOTAO} onClick={() => setShowCreateOrder(true)}><Plus className="h-4 w-4" /> Novo pedido</button>
          </>
        )}
      />

      <ResumoPedidos items={periodFilteredItems} />

      <Busca valor={searchTerm} onChange={setSearchTerm} placeholder="Cliente, empresa, pedido ou e-mail">
        <Pilulas valor={statusFilter} onChange={setStatusFilter} opcoes={[
          { valor: 'all', rotulo: 'Todos', n: periodFilteredItems.length },
          { valor: 'em_exibicao', rotulo: 'No ar', n: nStatus('em_exibicao') },
          { valor: 'aguardando_video', rotulo: 'Aguardando vídeo', n: nStatus('aguardando_video') },
          { valor: 'aguardando_aprovacao', rotulo: 'Aprovar vídeo', n: nStatus('aguardando_aprovacao') },
          { valor: 'aguardando_pagamento', rotulo: 'Aguardando pagamento', n: nStatus('aguardando_pagamento') },
          { valor: 'bloqueado', rotulo: 'Bloqueados', n: nStatus('bloqueado') },
          { valor: 'tentativa', rotulo: 'Tentativas', n: nStatus('tentativa') },
        ]} />
        <select value={paymentTypeFilter} onChange={(e) => setPaymentTypeFilter(e.target.value)} className={`${CAMPO} w-auto`} aria-label="Forma de pagamento">
          <option value="all">Pagamento: todos</option><option value="fidelidade">Fidelidade</option><option value="avista">Pix à vista</option><option value="cartao">Cartão</option>
        </select>
      </Busca>

      <OrdersTabsRefactored onViewOrderDetails={handleViewOrderDetails} searchTerm={searchTerm} idsPermitidos={idsFiltrados} />

      <AdminCreateOrderDialog open={showCreateOrder} onOpenChange={setShowCreateOrder} onSuccess={refetch} />
    </Pagina>
  );
};

export default OrdersPage;

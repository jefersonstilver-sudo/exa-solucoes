
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useOrdersWithAttempts } from '@/hooks/useOrdersWithAttempts';
import OrdersStatsCards from '@/components/admin/orders/OrdersStatsCards';
import OrdersTabs from '@/components/admin/orders/OrdersTabs';
import OrdersPageHeader from '@/components/admin/orders/OrdersPageHeader';
import OrdersPageAlerts from '@/components/admin/orders/OrdersPageAlerts';
import OrdersPageFilters from '@/components/admin/orders/OrdersPageFilters';

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
      <div>
        <OrdersPageHeader onRefresh={refetch} loading={loading} />
        <div className="mt-2">
          <OrdersPageAlerts ordersAndAttempts={filteredItems} />
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <OrdersStatsCards stats={stats} />

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
      <OrdersTabs />
    </div>
  );
};

export default OrdersPage;

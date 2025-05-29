
import React from 'react';
import { useParams } from 'react-router-dom';
import { AdminOrderHeader } from '@/components/admin/orders/AdminOrderHeader';
import { AdminOrderCustomerCard } from '@/components/admin/orders/AdminOrderCustomerCard';
import { AdminOrderInfoCard } from '@/components/admin/orders/AdminOrderInfoCard';
import { AdminOrderFinancialCard } from '@/components/admin/orders/AdminOrderFinancialCard';
import { AdminOrderItemsCard } from '@/components/admin/orders/AdminOrderItemsCard';

const OrderDetails = () => {
  const { id } = useParams();

  // Mock data - em produção viria da API/Supabase
  const order = {
    id: id,
    orderNumber: 'PED-2024-001',
    customer: {
      name: 'João Silva',
      email: 'joao@exemplo.com',
      phone: '(11) 99999-9999',
      document: '123.456.789-00'
    },
    status: 'completed',
    total: 2500.00,
    subtotal: 2200.00,
    discount: 200.00,
    tax: 500.00,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
    paymentMethod: 'Cartão de Crédito',
    transactionId: 'TXN-789123456',
    items: [
      {
        id: '1',
        panelCode: 'P001',
        panelName: 'Painel Shopping Center Norte',
        location: 'São Paulo, SP',
        duration: '30 dias',
        price: 800.00,
        startDate: '2024-02-01',
        endDate: '2024-03-01'
      },
      {
        id: '2',
        panelCode: 'P002',
        panelName: 'Painel Av. Paulista',
        location: 'São Paulo, SP',
        duration: '30 dias',
        price: 1200.00,
        startDate: '2024-02-01',
        endDate: '2024-03-01'
      },
      {
        id: '3',
        panelCode: 'P003',
        panelName: 'Painel Centro Comercial',
        location: 'São Paulo, SP',
        duration: '15 dias',
        price: 400.00,
        startDate: '2024-02-15',
        endDate: '2024-03-01'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminOrderHeader
        orderNumber={order.orderNumber}
        status={order.status}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <AdminOrderCustomerCard customer={order.customer} />

        {/* Order Information */}
        <AdminOrderInfoCard
          status={order.status}
          createdAt={order.createdAt}
          updatedAt={order.updatedAt}
          paymentMethod={order.paymentMethod}
          transactionId={order.transactionId}
        />

        {/* Financial Summary */}
        <AdminOrderFinancialCard
          subtotal={order.subtotal}
          discount={order.discount}
          tax={order.tax}
          total={order.total}
        />
      </div>

      {/* Order Items */}
      <AdminOrderItemsCard items={order.items} />
    </div>
  );
};

export default OrderDetails;

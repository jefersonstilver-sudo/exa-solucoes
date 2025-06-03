import React from 'react';
import { AlertCircle } from 'lucide-react';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';

interface OrdersPageAlertsProps {
  ordersAndAttempts: OrderOrAttempt[];
}

const OrdersPageAlerts: React.FC<OrdersPageAlertsProps> = ({ ordersAndAttempts }) => {
  const pendingOrders = ordersAndAttempts.filter(item => 
    item.type === 'order' && item.status === 'pendente'
  ).length;

  const totalAttempts = ordersAndAttempts.filter(item => item.type === 'attempt').length;

  return (
    <div className="space-y-2">
      {pendingOrders > 0 && (
        <div className="flex items-center text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">
            {pendingOrders} pedido{pendingOrders > 1 ? 's' : ''} aguardando pagamento
          </span>
        </div>
      )}
      
      {totalAttempts > 0 && (
        <div className="flex items-center text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">
            {totalAttempts} tentativa{totalAttempts > 1 ? 's' : ''} de compra - Oportunidades de CRM
          </span>
        </div>
      )}
    </div>
  );
};

export default OrdersPageAlerts;

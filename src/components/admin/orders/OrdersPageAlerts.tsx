import React from 'react';
import { AlertCircle } from 'lucide-react';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';
interface OrdersPageAlertsProps {
  ordersAndAttempts: OrderOrAttempt[];
}
const OrdersPageAlerts: React.FC<OrdersPageAlertsProps> = ({
  ordersAndAttempts
}) => {
  const pendingOrders = ordersAndAttempts.filter(item => item.type === 'order' && item.status === 'pendente').length;
  const totalAttempts = ordersAndAttempts.filter(item => item.type === 'attempt').length;
  
  if (pendingOrders === 0 && totalAttempts === 0) {
    return null;
  }
  
  return <div className="space-y-2">
      {totalAttempts > 0 && <div className="flex items-center gap-3 text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100/50 px-4 py-2.5 rounded-xl border border-amber-200/50 shadow-sm backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
          <span className="text-sm font-medium">
            {totalAttempts} tentativa{totalAttempts > 1 ? 's' : ''} de compra - Oportunidades de CRM
          </span>
        </div>}
    </div>;
};
export default OrdersPageAlerts;
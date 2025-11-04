import React from 'react';
import { OrderMobileCard } from './OrderMobileCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';

interface OrderMobileListProps {
  orders: any[];
  loading?: boolean;
  onViewDetails: (orderId: string) => void;
}

export const OrderMobileList: React.FC<OrderMobileListProps> = ({
  orders,
  loading = false,
  onViewDetails,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-lg font-medium text-foreground">Nenhum pedido encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">
          Os pedidos aparecerão aqui quando forem criados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderMobileCard
          key={order.id}
          order={order}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

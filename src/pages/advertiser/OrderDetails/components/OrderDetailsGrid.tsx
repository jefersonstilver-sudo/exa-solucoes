
import React, { Suspense } from 'react';
import { OrderDetailsSkeleton } from '@/components/loading/OrderDetailsSkeleton';
import { OrderStatusAlerts } from '@/components/order/OrderStatusAlerts';

const PurchaseInfoCard = React.lazy(() => 
  import('@/components/order/PurchaseInfoCard').then(module => ({
    default: module.PurchaseInfoCard
  }))
);

const OrderSummaryCard = React.lazy(() => 
  import('@/components/order/OrderSummaryCard').then(module => ({
    default: module.OrderSummaryCard
  }))
);

interface OrderDetailsGridProps {
  orderDetails: any;
  displayPanels: string[];
  enhancedData: any;
}

export const OrderDetailsGrid: React.FC<OrderDetailsGridProps> = ({
  orderDetails,
  displayPanels,
  enhancedData
}) => {
  return (
    <Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse" />}>
      {/* Grid de Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Informações de Compra */}
        <PurchaseInfoCard orderDetails={orderDetails} />

        {/* Resumo do Pedido */}
        <OrderSummaryCard
          orderDetails={orderDetails}
          displayPanels={displayPanels}
          isRecovered={enhancedData?.isRecovered}
        />
      </div>

      {/* Alertas de Status */}
      <OrderStatusAlerts
        isRecovered={enhancedData?.isRecovered}
        enhancedError={null}
        videosLoadError={null}
      />
    </Suspense>
  );
};

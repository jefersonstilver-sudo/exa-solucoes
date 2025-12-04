import React, { useState, useCallback } from 'react';
import { OrderMobileCard } from './OrderMobileCard';
import { MobileSelectionToolbar } from './MobileSelectionToolbar';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';
import { useBulkSelection } from '@/hooks/useBulkSelection';

interface OrderMobileListProps {
  orders: any[];
  loading?: boolean;
  onViewDetails: (orderId: string) => void;
  onBulkDelete?: (orderIds: string[]) => Promise<void>;
}

export const OrderMobileList: React.FC<OrderMobileListProps> = ({
  orders,
  loading = false,
  onViewDetails,
  onBulkDelete,
}) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const orderIds = orders.map(o => o.id);
  const {
    selectedIds,
    isAllSelected,
    selectedCount,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
  } = useBulkSelection(orderIds);

  const handleLongPress = useCallback((orderId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      toggleSelectItem(orderId);
    }
  }, [isSelectionMode, toggleSelectItem]);

  const handleClearSelection = useCallback(() => {
    clearSelection();
    setIsSelectionMode(false);
  }, [clearSelection]);

  const handleDelete = useCallback(async () => {
    if (!onBulkDelete || selectedCount === 0) return;
    
    setIsDeleting(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      handleClearSelection();
    } finally {
      setIsDeleting(false);
    }
  }, [onBulkDelete, selectedIds, selectedCount, handleClearSelection]);

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
    <>
      <div className="space-y-3 pb-24">
        {orders.map((order) => (
          <OrderMobileCard
            key={order.id}
            order={order}
            onViewDetails={onViewDetails}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.has(order.id)}
            onLongPress={() => handleLongPress(order.id)}
            onToggleSelect={() => toggleSelectItem(order.id)}
          />
        ))}
      </div>

      <MobileSelectionToolbar
        selectedCount={selectedCount}
        totalCount={orders.length}
        onSelectAll={toggleSelectAll}
        onClearSelection={handleClearSelection}
        onDelete={handleDelete}
        isAllSelected={isAllSelected}
        isDeleting={isDeleting}
      />
    </>
  );
};

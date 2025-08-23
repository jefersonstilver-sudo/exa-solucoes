import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';
import OrdersTableRow from './components/OrdersTableRow';
import OrdersTableHeader from './components/OrdersTableHeader';
import OrdersEmptyState from './components/OrdersEmptyState';

interface OrdersAndAttemptsTableProps {
  ordersAndAttempts: (OrderOrAttempt & { daysRemaining?: number | null })[];
  onViewOrderDetails?: (orderId: string) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string, checked: boolean) => void;
  onSelectAllChange?: (checked: boolean) => void;
  showBulkActions?: boolean;
}

const OrdersAndAttemptsTable: React.FC<OrdersAndAttemptsTableProps> = ({ 
  ordersAndAttempts, 
  onViewOrderDetails,
  selectedIds = new Set(),
  onSelectionChange,
  onSelectAllChange,
  showBulkActions = false
}) => {
  const orderIds = ordersAndAttempts.filter(item => item.type === 'order').map(item => item.id);
  const isAllSelected = orderIds.length > 0 && orderIds.every(id => selectedIds.has(id));
  if (ordersAndAttempts.length === 0) {
    return <OrdersEmptyState />;
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <OrdersTableHeader 
                hasSelectableItems={showBulkActions && orderIds.length > 0}
                isAllSelected={isAllSelected}
                onSelectAllChange={onSelectAllChange}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersAndAttempts.map((item) => (
              <OrdersTableRow 
                key={item.id} 
                item={item} 
                onViewDetails={onViewOrderDetails}
                isSelected={selectedIds.has(item.id)}
                onSelectionChange={onSelectionChange}
                showCheckbox={showBulkActions && item.type === 'order'}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrdersAndAttemptsTable;


import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderOrAttempt } from '@/hooks/useOrdersWithAttempts';
import OrdersTableRow from './components/OrdersTableRow';
import OrdersTableHeader from './components/OrdersTableHeader';
import OrdersEmptyState from './components/OrdersEmptyState';

interface OrdersAndAttemptsTableProps {
  ordersAndAttempts: (OrderOrAttempt & { daysRemaining?: number | null })[];
  onViewOrderDetails?: (orderId: string) => void;
}

const OrdersAndAttemptsTable: React.FC<OrdersAndAttemptsTableProps> = ({ 
  ordersAndAttempts, 
  onViewOrderDetails 
}) => {
  if (ordersAndAttempts.length === 0) {
    return <OrdersEmptyState />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <OrdersTableHeader />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordersAndAttempts.map((item) => (
            <OrdersTableRow 
              key={item.id} 
              item={item} 
              onViewDetails={onViewOrderDetails}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersAndAttemptsTable;

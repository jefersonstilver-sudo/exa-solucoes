
import React from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { OrderOrAttempt } from '@/hooks/useOrdersWithAttempts';
import OrdersTableHeader from './components/OrdersTableHeader';
import OrdersTableRow from './components/OrdersTableRow';
import OrdersEmptyState from './components/OrdersEmptyState';

interface OrdersAndAttemptsTableProps {
  ordersAndAttempts: OrderOrAttempt[];
}

const OrdersAndAttemptsTable: React.FC<OrdersAndAttemptsTableProps> = ({ ordersAndAttempts }) => {
  if (ordersAndAttempts.length === 0) {
    return <OrdersEmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <OrdersTableHeader />
        <TableBody>
          {ordersAndAttempts.map((item) => (
            <OrdersTableRow key={`${item.type}-${item.id}`} item={item} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersAndAttemptsTable;

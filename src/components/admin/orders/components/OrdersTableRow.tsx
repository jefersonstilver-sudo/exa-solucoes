import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar } from 'lucide-react';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';
import { 
  getStatusBadge, 
  formatDate, 
  formatCurrency, 
  getClientName, 
  getClientEmail, 
  getPanelsCount, 
  getPlanDuration, 
  getPeriod, 
  getTypeBadge 
} from '../utils/orderTableUtils';

interface OrdersTableRowProps {
  item: OrderOrAttempt & { daysRemaining?: number | null };
  onViewDetails?: (orderId: string) => void;
}

const OrdersTableRow: React.FC<OrdersTableRowProps> = ({ item, onViewDetails }) => {
  const handleViewDetails = () => {
    if (item.type === 'order' && onViewDetails) {
      onViewDetails(item.id);
    }
  };

  return (
    <TableRow className="border-gray-200 hover:bg-gray-50">
      <TableCell>
        {getTypeBadge(item)}
      </TableCell>
      <TableCell className="font-medium text-gray-900">
        {item.id.substring(0, 8)}...
      </TableCell>
      <TableCell className="text-gray-800 font-medium">
        {formatDate(item.created_at)}
      </TableCell>
      <TableCell>
        {getStatusBadge(item)}
        {/* Mostrar dias restantes para pedidos ativos */}
        {item.daysRemaining !== undefined && item.daysRemaining !== null && (
          <div className="mt-1">
            <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {item.daysRemaining > 0 ? `${item.daysRemaining} dias restantes` : 'Vencido'}
            </Badge>
          </div>
        )}
      </TableCell>
      <TableCell className={`font-bold text-base ${item.type === 'attempt' ? 'text-orange-600' : 'text-gray-900'}`}>
        {formatCurrency(item.valor_total || 0)}
      </TableCell>
      <TableCell className="text-gray-800 font-medium">
        {getPlanDuration(item)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center text-gray-800 font-medium">
          <Calendar className="h-4 w-4 mr-1 text-indexa-purple" />
          <span>{getPeriod(item)}</span>
        </div>
      </TableCell>
      <TableCell className="text-gray-800 font-medium">
        {getPanelsCount(item)}
      </TableCell>
      <TableCell className="text-gray-800 font-medium">
        {getClientName(item)}
      </TableCell>
      <TableCell className="text-gray-700 font-medium">
        {getClientEmail(item)}
      </TableCell>
      <TableCell>
        {item.type === 'order' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white font-medium"
          >
            <Eye className="h-3 w-3 mr-1" />
            Ver Detalhes
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-300 text-gray-500 font-medium cursor-not-allowed"
          >
            Tentativa
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default OrdersTableRow;

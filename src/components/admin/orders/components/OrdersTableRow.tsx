
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, MapPin, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrderOrAttempt } from '@/hooks/useOrdersWithAttempts';
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
  item: OrderOrAttempt;
}

const OrdersTableRow: React.FC<OrdersTableRowProps> = ({ item }) => {
  const navigate = useNavigate();

  return (
    <TableRow key={`${item.type}-${item.id}`} className="border-gray-200 hover:bg-gray-50">
      <TableCell>
        {getTypeBadge(item)}
      </TableCell>
      <TableCell className="font-mono text-sm text-gray-900 font-medium">
        {item.id.substring(0, 8)}...
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{getClientName(item)}</span>
          <span className="text-sm text-gray-700">{getClientEmail(item)}</span>
        </div>
      </TableCell>
      <TableCell className="text-gray-800 font-medium">
        {formatDate(item.created_at)}
      </TableCell>
      <TableCell>
        {getStatusBadge(item)}
      </TableCell>
      <TableCell className={`font-bold text-base ${item.type === 'attempt' ? 'text-orange-600' : 'text-green-700'}`}>
        {formatCurrency(item.valor_total || 0)}
      </TableCell>
      <TableCell className="text-gray-800 font-medium">
        {getPlanDuration(item)}
      </TableCell>
      <TableCell>
        <div className="flex items-center text-gray-800 font-medium">
          <MapPin className="h-4 w-4 mr-1 text-indexa-purple" />
          <span>{getPanelsCount(item)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-sm text-gray-800 font-medium">
          <Calendar className="h-4 w-4 mr-1 text-indexa-purple" />
          <span className="whitespace-nowrap">
            {getPeriod(item)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {item.type === 'order' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/super_admin/pedidos/${item.id}`)}
            className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white font-medium"
          >
            <Eye className="h-3 w-3 mr-1" />
            Ver
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-300 text-gray-500 cursor-not-allowed"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Tentativa
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default OrdersTableRow;

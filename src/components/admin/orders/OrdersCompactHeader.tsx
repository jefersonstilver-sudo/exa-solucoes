import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { OrderPeriodFilter, PeriodFilter } from './OrderPeriodFilter';
import NotificationSoundControl from './NotificationSoundControl';

interface OrdersCompactHeaderProps {
  onRefresh: () => void;
  loading: boolean;
  periodFilter: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
}

const OrdersCompactHeader: React.FC<OrdersCompactHeaderProps> = ({
  onRefresh,
  loading,
  periodFilter,
  onPeriodChange
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
      
      <div className="flex items-center gap-3">
        <OrderPeriodFilter value={periodFilter} onChange={onPeriodChange} />
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh} 
          disabled={loading}
          className="border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        
        <NotificationSoundControl />
      </div>
    </div>
  );
};

export default OrdersCompactHeader;

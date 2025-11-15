import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import NotificationSoundControl from './NotificationSoundControl';
interface OrdersPageHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}
const OrdersPageHeader: React.FC<OrdersPageHeaderProps> = ({
  onRefresh,
  loading
}) => {
  return <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
        
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="outline" onClick={onRefresh} disabled={loading} className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white font-medium">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <NotificationSoundControl />
        <Button className="bg-indexa-purple hover:bg-indexa-purple/90 text-white font-semibold">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>
    </div>;
};
export default OrdersPageHeader;
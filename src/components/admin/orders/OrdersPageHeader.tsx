import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

interface OrdersPageHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

const OrdersPageHeader: React.FC<OrdersPageHeaderProps> = ({
  onRefresh,
  loading
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button variant="default">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>
    </div>
  );
};

export default OrdersPageHeader;
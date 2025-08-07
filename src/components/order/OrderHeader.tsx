
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderHeaderProps {
  orderId: string;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ orderId }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:space-x-4">
      <Button 
        variant="outline" 
        onClick={() => navigate('/anunciante/pedidos')}
        className="flex items-center w-full sm:w-auto"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
          Detalhes do Pedido
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">#{orderId.substring(0, 8)}</p>
      </div>
    </div>
  );
};

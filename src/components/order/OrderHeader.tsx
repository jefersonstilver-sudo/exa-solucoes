
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
    <div className="flex items-center space-x-4">
      <Button 
        variant="outline" 
        onClick={() => navigate('/anunciante/pedidos')}
        className="flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Detalhes do Pedido</h1>
        <p className="text-gray-600 mt-1">#{orderId.substring(0, 8)}</p>
      </div>
    </div>
  );
};

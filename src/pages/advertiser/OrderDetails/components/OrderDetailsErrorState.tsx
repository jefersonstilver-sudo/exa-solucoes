
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderDetailsErrorStateProps {
  error?: string | null;
  orderDetails?: any;
  refetch: () => void;
}

export const OrderDetailsErrorState: React.FC<OrderDetailsErrorStateProps> = ({
  error,
  orderDetails,
  refetch
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center py-12 max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-xl font-medium mb-2">
          {error ? 'Erro ao carregar' : 'Pedido não encontrado'}
        </h3>
        <p className="text-gray-600 mb-4">
          {error || 'Não foi possível carregar os detalhes do pedido.'}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => navigate('/anunciante/pedidos')} variant="outline">
            Voltar aos Pedidos
          </Button>
          <Button onClick={refetch} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    </div>
  );
};

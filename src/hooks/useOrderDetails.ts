
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseOrderDetailsProps {
  orderId: string | null;
}

export function useOrderDetails({ orderId }: UseOrderDetailsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "ID do pedido não encontrado."
        });
        navigate('/checkout');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select('*, lista_paineis, plano_meses, data_inicio, data_fim, status, valor_total')
          .eq('id', orderId)
          .single();
          
        if (error) throw error;
        
        setOrderDetails(data);
        
        // If we have an order, update its status if needed
        if (data && data.status === 'pendente') {
          await supabase
            .from('pedidos')
            .update({ status: 'pago' })
            .eq('id', orderId);
            
          console.log('Order status updated to paid');
        }
        
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os detalhes do pedido."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, toast, navigate]);

  return {
    loading,
    orderDetails
  };
}


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { prepareForUpdate, filterEq, unwrapData } from '@/utils/supabaseUtils';
import { Database } from '@/integrations/supabase/types';

interface UseOrderDetailsProps {
  orderId: string | null;
}

type PedidoUpdate = Database['public']['Tables']['pedidos']['Update'];

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
          .eq('id', filterEq(orderId))
          .single();
          
        if (error) throw error;
        
        // Verify we have valid data
        const safeData = unwrapData(data);
        if (!safeData) throw new Error('No data returned');
        
        setOrderDetails(safeData);
        
        // If we have an order, update its status if needed
        if (safeData && safeData.status === 'pendente') {
          const updateData: PedidoUpdate = {
            status: 'pago'
          };
          
          await supabase
            .from('pedidos')
            .update(prepareForUpdate<PedidoUpdate>(updateData))
            .eq('id', filterEq(orderId));
            
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

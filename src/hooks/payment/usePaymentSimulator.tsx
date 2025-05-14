
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const usePaymentSimulator = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to simulate a successful payment (for demo purposes)
  const simulateSuccessfulPayment = async (
    pedidoId: string,
    cartItems: CartItem[],
    sessionUser: any,
    startDate: Date,
    endDate: Date,
    handleClearCart: () => void
  ) => {
    try {
      // Add a slight delay to simulate payment processing
      toast({
        title: "Processando pagamento",
        description: "Aguarde enquanto processamos seu pagamento...",
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update pedido status to 'pago'
      await supabase
        .from('pedidos')
        .update({
          status: 'pago',
          log_pagamento: {
            payment_status: 'approved',
            payment_method: 'credit_card',
            payment_date: new Date().toISOString(),
            payment_id: `DEMO-${Date.now()}`
          }
        })
        .eq('id', pedidoId);
      
      // Create campaigns for each panel
      for (const item of cartItems) {
        await supabase
          .from('campanhas')
          .insert([
            {
              client_id: sessionUser.id,
              painel_id: item.panel.id,
              video_id: '00000000-0000-0000-0000-000000000000', // Placeholder
              data_inicio: startDate.toISOString().split('T')[0],
              data_fim: endDate.toISOString().split('T')[0],
              status: 'aguardando_video',
              obs: `Criado automaticamente do pedido ${pedidoId}`,
            }
          ]);
      }
      
      // Só limpa o carrinho depois que todas as campanhas foram criadas com sucesso
      handleClearCart();
      
      // Show success message
      sonnerToast.success("Pagamento realizado com sucesso!");
      
      // Redirect to confirmation page
      navigate(`/pedido-confirmado?id=${pedidoId}`);
      
      // Reset state
      setIsCreatingPayment(false);
      
    } catch (error: any) {
      console.error('Error handling payment success:', error);
      setIsCreatingPayment(false);
      toast({
        variant: "destructive",
        title: "Erro ao processar confirmação",
        description: error.message || "Houve um problema ao finalizar o pedido.",
      });
    }
  };

  return {
    isCreatingPayment,
    setIsCreatingPayment,
    simulateSuccessfulPayment
  };
};

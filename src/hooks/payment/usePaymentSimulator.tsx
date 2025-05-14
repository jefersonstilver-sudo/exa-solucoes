
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

  // Função para simular um pagamento bem-sucedido (apenas para demonstração)
  const simulateSuccessfulPayment = async (
    pedidoId: string,
    cartItems: CartItem[],
    sessionUser: any,
    startDate: Date,
    endDate: Date,
    handleClearCart: () => void
  ) => {
    try {
      // Adiciona um pequeno atraso para simular o processamento do pagamento
      toast({
        title: "Processando pagamento",
        description: "Aguarde enquanto processamos seu pagamento...",
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualiza o status do pedido para 'pago'
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
      
      // Cria campanhas para cada painel
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
      
      // Exibe mensagem de sucesso
      sonnerToast.success("Pagamento realizado com sucesso!");
      
      // Redireciona para a página de confirmação
      navigate(`/pedido-confirmado?id=${pedidoId}`);
      
      // Reinicia o estado
      setIsCreatingPayment(false);
      
    } catch (error: any) {
      console.error('Erro ao processar confirmação de pagamento:', error);
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

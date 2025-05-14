
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOrderCreation } from './useOrderCreation';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const usePaymentSimulator = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const { createCampaignsAfterPayment } = useOrderCreation();
  const { toast } = useToast();

  /**
   * Simula um pagamento bem-sucedido para testes
   */
  const simulateSuccessfulPayment = async (
    pedidoId: string,
    cartItems: CartItem[],
    sessionUser: any,
    startDate: Date,
    endDate: Date,
    handleClearCart: () => void
  ) => {
    try {
      console.log("Simulando pagamento bem-sucedido para o pedido:", pedidoId);
      
      // Simula o tempo de processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Criar campanhas e atualizar o status do pedido
      const result = await createCampaignsAfterPayment(pedidoId, sessionUser.id);
      
      if (!result.success) {
        throw new Error('Erro ao processar pós-pagamento');
      }
      
      // Limpar o carrinho
      handleClearCart();
      
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Seu pedido foi confirmado e suas campanhas foram criadas.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Erro ao simular pagamento:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error.message || "Ocorreu um erro durante o processamento do pagamento.",
      });
      return false;
    }
  };

  return {
    isCreatingPayment,
    setIsCreatingPayment,
    simulateSuccessfulPayment
  };
};

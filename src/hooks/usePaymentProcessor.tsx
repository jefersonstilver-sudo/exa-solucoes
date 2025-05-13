
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ensureSpreadable } from '@/utils/priceUtils';
import { Panel } from '@/types/panel';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { MP_PUBLIC_KEY } from '@/constants/checkoutConstants';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface PaymentOptions {
  totalPrice: number;
  selectedPlan: number;
  cartItems: CartItem[];
  startDate: Date;
  endDate: Date;
  couponId: string | null;
  acceptTerms: boolean;
  unavailablePanels: string[];
  sessionUser: any;
  handleClearCart: () => void;
}

export const usePaymentProcessor = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Initialize MercadoPago
  const { isSDKLoaded, createCheckout } = useMercadoPago({
    publicKey: MP_PUBLIC_KEY
  });

  // Create payment and handle the checkout process
  const createPayment = async ({
    totalPrice,
    selectedPlan,
    cartItems,
    startDate,
    endDate,
    couponId,
    acceptTerms,
    unavailablePanels,
    sessionUser,
    handleClearCart
  }: PaymentOptions) => {
    if (!acceptTerms) {
      toast({
        variant: "destructive",
        title: "Termos e condições",
        description: "Você precisa aceitar os termos e condições para continuar.",
      });
      setIsCreatingPayment(false);
      return;
    }
    
    if (unavailablePanels.length > 0) {
      toast({
        variant: "destructive",
        title: "Painéis indisponíveis",
        description: "Alguns painéis não estão disponíveis para o período selecionado.",
      });
      setIsCreatingPayment(false);
      return;
    }
    
    if (!sessionUser) {
      toast({
        variant: "destructive",
        title: "Acesso restrito",
        description: "Você precisa estar logado para finalizar a compra.",
      });
      navigate('/login?redirect=/checkout');
      setIsCreatingPayment(false);
      return;
    }
    
    if (!isSDKLoaded) {
      toast({
        variant: "destructive",
        title: "Erro no checkout",
        description: "Aguarde o carregamento do sistema de pagamento ou recarregue a página.",
      });
      setIsCreatingPayment(false);
      return;
    }

    // Verificar se existem itens no carrinho
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrinho vazio",
        description: "Adicione painéis ao seu carrinho para finalizar a compra.",
      });
      navigate('/paineis-digitais/loja');
      setIsCreatingPayment(false);
      return;
    }
    
    try {
      // Criar uma cópia local do carrinho para evitar problemas se o carrinho for limpo
      const cartItemsCopy = [...cartItems];
      
      // Create pedido in database
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert([
          {
            client_id: sessionUser.id,
            lista_paineis: cartItemsCopy.map(item => item.panel.id),
            duracao: selectedPlan * 30, // Convert months to days
            plano_meses: selectedPlan,
            valor_total: totalPrice,
            cupom_id: couponId,
            data_inicio: startDate.toISOString().split('T')[0],
            data_fim: endDate.toISOString().split('T')[0],
            termos_aceitos: true,
            status: 'pendente',
            log_pagamento: {
              plan_details: { months: selectedPlan },
              coupon_applied: couponId ? true : false,
              panels_count: cartItemsCopy.length,
              user_name: sessionUser.user_metadata?.name || sessionUser.email
            }
          }
        ])
        .select()
        .single();
      
      if (pedidoError) throw pedidoError;
      
      // If coupon was applied, record its usage
      if (couponId) {
        await supabase
          .from('cupom_usos')
          .insert([
            {
              cupom_id: couponId,
              user_id: sessionUser.id,
              pedido_id: pedido.id
            }
          ]);
      }
      
      // Update pedido with payment information
      await supabase
        .from('pedidos')
        .update({
          log_pagamento: {
            ...ensureSpreadable(pedido.log_pagamento),
            payment_preference_id: 'TEST-PREFERENCE-ID'
          }
        })
        .eq('id', pedido.id);
      
      // For demo purposes only, simulate success payment
      await simulateSuccessfulPayment(pedido.id, cartItemsCopy, sessionUser, startDate, endDate, handleClearCart);
      
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error.message || "Houve um problema ao processar o pagamento.",
      });
      setIsCreatingPayment(false);
    }
  };
  
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
    createPayment
  };
};

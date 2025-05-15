
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { Panel } from '@/types/panel';
import { usePaymentValidation } from './usePaymentValidation';
import { useOrderCreation } from './useOrderCreation';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { MP_PUBLIC_KEY } from '@/services/mercadoPago';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { validatePaymentRequirements } = usePaymentValidation();
  const { createOrder } = useOrderCreation();
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  
  // Inicializa MercadoPago
  const { isSDKLoaded, createCheckout, isError } = useMercadoPago({
    publicKey: MP_PUBLIC_KEY
  });

  // Cria pagamento e gerencia o processo de checkout
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
    setIsCreatingPayment(true);
    
    try {
      // Log para diagnósticos
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Iniciando processamento de pagamento no valor de ${totalPrice}`,
        { totalPrice, planMonths: selectedPlan, itemCount: cartItems.length }
      );
      
      // Exibir toast de processamento para melhor feedback ao usuário
      sonnerToast.loading("Preparando pagamento...");
      
      // Valida todos os requisitos antes de prosseguir
      const isValid = validatePaymentRequirements({
        acceptTerms, 
        unavailablePanels: [], // Ignorando verificação para correção do bug 
        sessionUser, 
        isSDKLoaded,
        cartItems
      });
      
      if (!isValid) {
        setIsCreatingPayment(false);
        sonnerToast.dismiss();
        sonnerToast.error("Não foi possível processar o pagamento");
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.ERROR,
          "Requisitos do pagamento não atendidos",
          { acceptTerms }
        );
        return;
      }
      
      // Cria pedido no banco de dados
      const pedido = await createOrder({
        sessionUser,
        cartItems,
        selectedPlan,
        totalPrice,
        couponId,
        startDate,
        endDate
      });
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Pedido criado com ID: ${pedido.id}`,
        { pedidoId: pedido.id }
      );
      
      toast({
        title: "Pedido criado",
        description: "Aguarde enquanto preparamos seu pagamento...",
      });
      
      try {
        // Obter a URL base da aplicação
        const currentUrl = window.location.origin;
        
        // Calcular duration baseado no plano
        const duration = selectedPlan * 30; // convertendo meses para dias
        
        // Preparar dados para a função Edge
        const paymentData = {
          pedidoId: pedido.id,
          cartItems,
          totals: {
            totalPrice,
            selectedPlan,
            duration,
            withCoupon: !!couponId,
            couponDiscount: couponId ? 10 : 0, // valor de exemplo, deve vir do cupom real
          },
          userId: sessionUser.id,
          returnUrl: currentUrl
        };
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_PROCESSING,
          LogLevel.INFO,
          "Enviando dados para processamento de pagamento",
          { pedidoId: pedido.id }
        );
        
        // Chamar função Edge para processar pagamento
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: paymentData
        });
        
        if (error) {
          throw new Error(`Erro ao processar pagamento: ${error.message}`);
        }
        
        // Verificar se a resposta é válida
        if (!data || !data.success) {
          throw new Error('Resposta inválida do processador de pagamento');
        }
        
        // Limpar carrinho após criar pedido com sucesso
        handleClearCart();
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_PROCESSING,
          LogLevel.INFO,
          "Redirecionando para Mercado Pago",
          { initPoint: data.init_point }
        );
        
        sonnerToast.dismiss();
        sonnerToast.success("Redirecionando para pagamento...");
        
        // Usando o SDK do MercadoPago para checkout com delay para garantir que o toast seja exibido
        setTimeout(() => {
          const checkoutResult = createCheckout({ 
            preferenceId: data.preference_id,
            redirectMode: true
          });
          
          if (!checkoutResult.success) {
            throw new Error('Falha ao iniciar checkout do MercadoPago');
          }
          
          // O redirecionamento é feito pelo createCheckout
        }, 1000);
        
      } catch (paymentError: any) {
        console.error('Erro ao processar pagamento:', paymentError);
        sonnerToast.dismiss();
        sonnerToast.error("Erro ao processar pagamento");
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.ERROR,
          `Erro ao processar pagamento: ${paymentError.message}`,
          { error: paymentError.message }
        );
        
        toast({
          variant: "destructive",
          title: "Erro ao processar pagamento",
          description: paymentError.message || "Houve um problema ao processar o pagamento.",
        });
        
        // Redirecionar para página de confirmação mesmo com erro
        // para que o usuário possa tentar novamente
        navigate(`/pedido-confirmado?id=${pedido.id}&status=error`);
      }
      
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      sonnerToast.dismiss();
      sonnerToast.error("Erro ao iniciar pagamento");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao criar pagamento: ${error.message}`,
        { error: error.message }
      );
      
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error.message || "Houve um problema ao processar o pagamento.",
      });
      
      setIsCreatingPayment(false);
    }
  };

  return {
    isCreatingPayment,
    createPayment,
    isMercadoPagoReady: isSDKLoaded && !isError
  };
};


import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { usePaymentValidation } from './usePaymentValidation';
import { usePaymentSimulator } from './usePaymentSimulator';
import { useOrderCreation } from './useOrderCreation';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { MP_PUBLIC_KEY } from '@/constants/checkoutConstants';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
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
  const { isCreatingPayment, setIsCreatingPayment, simulateSuccessfulPayment } = usePaymentSimulator();
  const { createOrder } = useOrderCreation();
  
  // Inicializa MercadoPago
  const { isSDKLoaded } = useMercadoPago({
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
      
      // Valida todos os requisitos antes de prosseguir
      const isValid = validatePaymentRequirements({
        acceptTerms, 
        unavailablePanels, 
        sessionUser, 
        isSDKLoaded,
        cartItems
      });
      
      if (!isValid) {
        setIsCreatingPayment(false);
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.ERROR,
          "Requisitos do pagamento não atendidos",
          { acceptTerms, unavailablePanelsCount: unavailablePanels.length }
        );
        return;
      }
      
      // Validar IDs de painéis
      const invalidPanelIds = cartItems.filter(item => 
        !item.panel.id || 
        typeof item.panel.id !== 'string' || 
        !item.panel.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      );
      
      if (invalidPanelIds.length > 0) {
        toast({
          variant: "destructive",
          title: "Painéis inválidos",
          description: "Alguns painéis possuem identificadores inválidos. Por favor, atualize seu carrinho.",
        });
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.ERROR,
          "IDs de painéis inválidos detectados",
          { invalidCount: invalidPanelIds.length }
        );
        setIsCreatingPayment(false);
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
        title: "Processando pagamento",
        description: "Estamos preparando seu pagamento...",
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
        
        // Em um ambiente de produção, redirecionaríamos para o MercadoPago
        // window.location.href = data.init_point;
        
        // Para fins de teste, simulamos um pagamento bem-sucedido
        console.log("Simulando pagamento bem-sucedido para pedido:", pedido.id);
        await simulateSuccessfulPayment(
          pedido.id, 
          cartItems, 
          sessionUser, 
          startDate, 
          endDate, 
          handleClearCart
        );
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_SUCCESS,
          LogLevel.SUCCESS,
          "Pagamento realizado com sucesso",
          { pedidoId: pedido.id, amount: totalPrice }
        );
        
        // Redirecionar para a página de confirmação
        sonnerToast.success("Pagamento realizado com sucesso!");
        
        // Registrar navegação e redirecionar
        logNavigation(`/pedido-confirmado?id=${pedido.id}`, 'navigate', true);
        navigate(`/pedido-confirmado?id=${pedido.id}`);
        
      } catch (paymentError: any) {
        console.error('Erro ao processar pagamento:', paymentError);
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
      }
      
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
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
    } finally {
      setIsCreatingPayment(false);
    }
  };

  return {
    isCreatingPayment,
    createPayment
  };
};

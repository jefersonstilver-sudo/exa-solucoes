import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrderCreation } from './useOrderCreation';
import { unwrapData } from '@/utils/supabaseUtils';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface CheckoutProParams {
  sessionUser: any;
  cartItems: CartItem[];
  selectedPlan: number;
  totalPrice: number;
  couponId: string | null;
  startDate: Date;
  endDate: Date;
}

/**
 * Hook para criar checkout direto com Mercado Pago Checkout Pro
 * Fluxo: Criar pedido → Criar preferência → Redirecionar para Mercado Pago
 */
export const useCheckoutPro = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { createPaymentOrder } = useOrderCreation();

  const createCheckoutProSession = async (params: CheckoutProParams) => {
    if (isProcessing) {
      console.log('⚠️ Já processando checkout, ignorando requisição duplicada');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('🚀 [CHECKOUT_PRO] Iniciando criação de checkout direto:', {
        userId: params.sessionUser.id,
        cartItems: params.cartItems.length,
        totalPrice: params.totalPrice
      });

      // FASE 1: Criar pedido no banco de dados
      console.log('📝 [CHECKOUT_PRO] Criando pedido no banco...');
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        'Iniciando criação de pedido para Checkout Pro',
        { totalPrice: params.totalPrice, itemCount: params.cartItems.length }
      );

      const pedidoResult = await createPaymentOrder({
        sessionUser: params.sessionUser,
        cartItems: params.cartItems,
        selectedPlan: params.selectedPlan,
        totalPrice: params.totalPrice,
        couponId: params.couponId,
        startDate: params.startDate,
        endDate: params.endDate,
        paymentMethod: 'credit_card'
      });

      const pedido = unwrapData(pedidoResult) as any;
      
      console.log('✅ [CHECKOUT_PRO] Pedido criado:', pedido.id);

      // FASE 2: Criar preferência do Mercado Pago
      console.log('💳 [CHECKOUT_PRO] Criando preferência Mercado Pago...');
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        'Criando preferência Mercado Pago Checkout Pro',
        { orderId: pedido.id }
      );

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          pedido_id: pedido.id,
          create_preference: true
        }
      });

      if (error) {
        console.error('❌ [CHECKOUT_PRO] Erro ao criar preferência:', error);
        throw error;
      }

      if (!data?.init_point) {
        console.error('❌ [CHECKOUT_PRO] URL de checkout não disponível:', data);
        throw new Error('URL de checkout não disponível');
      }

      console.log('✅ [CHECKOUT_PRO] Preferência criada, init_point:', data.init_point);

      // FASE 3: Redirecionar para Mercado Pago
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        'Redirecionando para Mercado Pago Checkout Pro',
        { 
          orderId: pedido.id,
          initPoint: data.init_point 
        }
      );

      toast.success('Redirecionando para checkout seguro...', { duration: 2000 });

      // Pequeno delay para mostrar a mensagem
      setTimeout(() => {
        console.log('🌐 [CHECKOUT_PRO] Redirecionando para:', data.init_point);
        window.location.href = data.init_point;
      }, 500);

      return { success: true, orderId: pedido.id };

    } catch (error: any) {
      console.error('💥 [CHECKOUT_PRO] Erro ao criar checkout:', error);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        'Erro ao criar Checkout Pro',
        { error: error.message }
      );

      toast.error('Erro ao iniciar checkout', {
        description: error.message || 'Tente novamente em alguns instantes'
      });

      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createCheckoutProSession,
    isProcessing
  };
};

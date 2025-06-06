
import { useCallback } from 'react';
import { useOrderCreationMonitor } from './useOrderCreationMonitor';
import { useCheckoutDataPersistence } from './useCheckoutDataPersistence';
import { usePaymentValidation } from './payment/usePaymentValidation';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export const useEnhancedCheckoutFlow = () => {
  const { validatePreOrderCreation } = useOrderCreationMonitor();
  const { saveCompletePurchaseAttempt, verifyCartDataIntegrity } = useCheckoutDataPersistence();
  const { validateUniquePayment } = usePaymentValidation();

  // Fluxo de checkout aprimorado com validações
  const processEnhancedCheckout = useCallback(async (
    cartItems: any[],
    selectedPlan: number,
    totalPrice: number,
    sessionUser: any,
    createPaymentFunction: (params: any) => Promise<any>
  ) => {
    console.log('🚀 [ENHANCED_CHECKOUT] Iniciando fluxo de checkout aprimorado...');

    try {
      // Etapa 1: Verificar integridade dos dados do carrinho
      await verifyCartDataIntegrity(cartItems, sessionUser.id);
      console.log('✅ [ENHANCED_CHECKOUT] Integridade do carrinho verificada');

      // Etapa 2: Validação pré-criação completa
      const preValidation = await validatePreOrderCreation(
        cartItems,
        selectedPlan,
        totalPrice,
        sessionUser
      );

      if (!preValidation.success) {
        const errorMessage = preValidation.errors?.join(', ') || 'Validação falhou';
        toast.error(`Erro na validação: ${errorMessage}`);
        
        logCheckoutEvent(
          CheckoutEvent.CHECKOUT_ERROR,
          LogLevel.ERROR,
          'Falha na validação pré-criação',
          preValidation
        );
        
        throw new Error(errorMessage);
      }

      if (preValidation.warnings && preValidation.warnings.length > 0) {
        preValidation.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }

      console.log('✅ [ENHANCED_CHECKOUT] Validação pré-criação aprovada');

      // Etapa 3: Verificar pagamentos únicos
      const uniqueValidation = await validateUniquePayment(
        sessionUser.id,
        totalPrice,
        cartItems
      );

      if (!uniqueValidation.isValid) {
        toast.error(uniqueValidation.error || 'Validação de pagamento único falhou');
        throw new Error(uniqueValidation.error || 'Pagamento duplicado');
      }

      console.log('✅ [ENHANCED_CHECKOUT] Validação de pagamento único aprovada');

      // Etapa 4: Salvar tentativa de compra antes de prosseguir
      try {
        await saveCompletePurchaseAttempt(sessionUser.id, cartItems, totalPrice);
        console.log('✅ [ENHANCED_CHECKOUT] Tentativa de compra salva');
      } catch (attemptError) {
        console.warn('⚠️ [ENHANCED_CHECKOUT] Falha ao salvar tentativa (continuando):', attemptError);
      }

      // Etapa 5: Prosseguir com criação do pagamento
      console.log('💳 [ENHANCED_CHECKOUT] Iniciando criação do pagamento...');
      
      const paymentResult = await createPaymentFunction({
        cartItems,
        selectedPlan,
        totalPrice,
        sessionUser
      });

      console.log('✅ [ENHANCED_CHECKOUT] Pagamento criado com sucesso');

      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.SUCCESS,
        'Checkout aprimorado concluído com sucesso',
        {
          userId: sessionUser.id.substring(0, 8),
          totalPrice,
          cartItemsCount: cartItems.length,
          selectedPlan,
          paymentResult: paymentResult ? 'Success' : 'Failed'
        }
      );

      return paymentResult;

    } catch (error: any) {
      console.error('💥 [ENHANCED_CHECKOUT] Erro no fluxo aprimorado:', error);
      
      logCheckoutEvent(
        CheckoutEvent.CHECKOUT_ERROR,
        LogLevel.ERROR,
        'Erro no fluxo de checkout aprimorado',
        {
          error: error.message,
          userId: sessionUser?.id?.substring(0, 8),
          totalPrice,
          cartItemsCount: cartItems?.length
        }
      );

      throw error;
    }
  }, [validatePreOrderCreation, verifyCartDataIntegrity, validateUniquePayment, saveCompletePurchaseAttempt]);

  return {
    processEnhancedCheckout
  };
};

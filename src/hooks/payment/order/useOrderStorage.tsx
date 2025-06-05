
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { StoreCheckoutInfoParams } from '@/types/order';

export const useOrderStorage = () => {
  const storeCheckoutInfo = (params: StoreCheckoutInfoParams) => {
    const { pedidoId, paymentMethod, preferenceId } = params;
    
    try {
      const checkoutInfo = {
        orderId: pedidoId,
        paymentMethod,
        preferenceId,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('checkout_info', JSON.stringify(checkoutInfo));
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        'Informações de checkout armazenadas',
        checkoutInfo
      );

    } catch (error: any) {
      console.error('Erro ao armazenar informações de checkout:', error);
    }
  };

  return { storeCheckoutInfo };
};


import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export const validateCartForCheckout = (cartItems: any[]) => {
  console.log('🔍 [CartValidation] Validando carrinho para checkout:', cartItems.length, 'itens');
  
  if (!cartItems || cartItems.length === 0) {
    console.warn('🔍 [CartValidation] Carrinho vazio detectado');
    
    logCheckoutEvent(
      CheckoutEvent.CHECKOUT_INITIATION,
      LogLevel.ERROR,
      "Tentativa de checkout com carrinho vazio"
    );
    
    return {
      isValid: false,
      error: 'Carrinho vazio'
    };
  }
  
  // Verificar se todos os itens têm dados válidos
  const invalidItems = cartItems.filter(item => 
    !item.panel || !item.panel.id || !item.duration
  );
  
  if (invalidItems.length > 0) {
    console.warn('🔍 [CartValidation] Itens inválidos detectados:', invalidItems);
    
    logCheckoutEvent(
      CheckoutEvent.EMPTY_CART_ATTEMPT,
      LogLevel.ERROR,
      `${invalidItems.length} itens inválidos no carrinho`,
      { invalidItems }
    );
    
    return {
      isValid: false,
      error: 'Itens inválidos no carrinho'
    };
  }
  
  console.log('✅ [CartValidation] Carrinho válido para checkout');
  return {
    isValid: true,
    error: null
  };
};

export const getCartSummary = (cartItems: any[]) => {
  if (!cartItems || cartItems.length === 0) {
    logCheckoutEvent(
      CheckoutEvent.EMPTY_CART_ATTEMPT,
      LogLevel.WARNING,
      "Tentativa de obter resumo de carrinho vazio"
    );
    
    return {
      totalItems: 0,
      totalPrice: 0,
      avgDuration: 0
    };
  }
  
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const avgDuration = cartItems.reduce((sum, item) => sum + (item.duration || 0), 0) / cartItems.length;
  
  return {
    totalItems: cartItems.length,
    totalPrice,
    avgDuration
  };
};

export const saveCartToLocalStorage = (cartItems: any[]) => {
  try {
    localStorage.setItem('indexa_cart', JSON.stringify(cartItems));
    console.log('💾 [CartValidation] Carrinho salvo no localStorage');
    return true;
  } catch (error) {
    console.error('❌ [CartValidation] Erro ao salvar carrinho:', error);
    return false;
  }
};

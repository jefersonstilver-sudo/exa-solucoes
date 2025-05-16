
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

// Nome da chave para armazenamento no localStorage
export const CART_STORAGE_KEY = 'panelCart';

/**
 * Salva o carrinho no localStorage
 */
export const saveCartToStorage = (cartItems: any[]): boolean => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART,
      LogLevel.INFO,
      `Carrinho salvo no localStorage: ${cartItems.length} itens`,
      { itemCount: cartItems.length, storageKey: CART_STORAGE_KEY }
    );
    
    return true;
  } catch (error) {
    console.error(`Erro ao salvar carrinho no localStorage [${CART_STORAGE_KEY}]:`, error);
    
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART,
      LogLevel.ERROR,
      `Erro ao salvar carrinho no localStorage [${CART_STORAGE_KEY}]`,
      { error: String(error), storageKey: CART_STORAGE_KEY }
    );
    
    return false;
  }
};

/**
 * Carrega o carrinho do localStorage
 */
export const loadCartFromStorage = (): any[] => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    
    if (!savedCart) {
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART,
        LogLevel.INFO,
        `Carrinho não encontrado no localStorage [${CART_STORAGE_KEY}]`,
        { storageKey: CART_STORAGE_KEY }
      );
      
      return [];
    }
    
    const parsedCart = JSON.parse(savedCart);
    
    if (!Array.isArray(parsedCart)) {
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART,
        LogLevel.WARNING,
        `Carrinho inválido no localStorage [${CART_STORAGE_KEY}]: não é um array`,
        { storageKey: CART_STORAGE_KEY, foundType: typeof parsedCart }
      );
      
      return [];
    }
    
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART,
      LogLevel.SUCCESS,
      `Carrinho carregado do localStorage [${CART_STORAGE_KEY}]: ${parsedCart.length} itens`,
      { itemCount: parsedCart.length, storageKey: CART_STORAGE_KEY }
    );
    
    return parsedCart;
  } catch (error) {
    console.error(`Erro ao carregar carrinho do localStorage [${CART_STORAGE_KEY}]:`, error);
    
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART,
      LogLevel.ERROR,
      `Erro ao carregar carrinho do localStorage [${CART_STORAGE_KEY}]`,
      { error: String(error), storageKey: CART_STORAGE_KEY }
    );
    
    return [];
  }
};

/**
 * Verifica se o carrinho está vazio
 */
export const isCartEmpty = (): boolean => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    
    if (!savedCart) {
      return true;
    }
    
    const parsedCart = JSON.parse(savedCart);
    
    if (!Array.isArray(parsedCart) || parsedCart.length === 0) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Erro ao verificar carrinho no localStorage [${CART_STORAGE_KEY}]:`, error);
    return true;
  }
};

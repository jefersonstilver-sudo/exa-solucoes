
import { CartItem } from '@/hooks/cart/useCartState';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

// Armazenamento para o carrinho
export const CART_STORAGE_KEY = 'panelCart';

/**
 * Limpa itens órfãos e corrige problemas de sincronização do carrinho
 */
export function cleanOrphanedCartItems(): boolean {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) return true;
    
    const parsedCart = JSON.parse(rawCart);
    if (!Array.isArray(parsedCart)) {
      localStorage.removeItem(CART_STORAGE_KEY);
      logCheckoutEvent(
        CheckoutEvent.CLEAR_CART,
        LogLevel.WARNING,
        `Carrinho com estrutura inválida removido [${CART_STORAGE_KEY}]`,
        { rawCart }
      );
      return true;
    }
    
    // Filtrar itens válidos
    const validItems = parsedCart.filter(item => {
      return item && 
             item.panel && 
             typeof item.panel === 'object' && 
             item.panel.id && 
             typeof item.duration === 'number' &&
             item.duration > 0;
    });
    
    if (validItems.length !== parsedCart.length) {
      if (validItems.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
      }
      
      logCheckoutEvent(
        CheckoutEvent.CLEAR_CART,
        LogLevel.INFO,
        `${parsedCart.length - validItems.length} itens órfãos removidos do carrinho [${CART_STORAGE_KEY}]`,
        { 
          originalCount: parsedCart.length, 
          validCount: validItems.length 
        }
      );
      
      return true;
    }
    
    return false;
  } catch (e) {
    console.error("Erro ao limpar itens órfãos:", e);
    localStorage.removeItem(CART_STORAGE_KEY);
    return true;
  }
}

/**
 * Verifica se o carrinho está vazio
 * @returns {boolean} true se o carrinho estiver vazio
 */
export function isCartEmpty(): boolean {
  try {
    // Primeiro limpar itens órfãos
    cleanOrphanedCartItems();
    
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) return true;
    
    const parsedCart = JSON.parse(rawCart);
    return !Array.isArray(parsedCart) || parsedCart.length === 0;
  } catch (e) {
    console.error("Erro ao verificar se o carrinho está vazio:", e);
    return true;
  }
}

/**
 * Carrega o carrinho do localStorage com tratamento de erros robusto
 * @returns {CartItem[]} Array de itens do carrinho
 */
export function loadCartFromStorage(): CartItem[] {
  try {
    // Primeiro limpar itens órfãos
    cleanOrphanedCartItems();
    
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) {
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART,
        LogLevel.INFO,
        `Carrinho vazio ou não encontrado no localStorage [${CART_STORAGE_KEY}]`,
        { timestamp: Date.now() }
      );
      return [];
    }
    
    // Validar que é um JSON válido antes de parsear
    const parsedCart = JSON.parse(rawCart);
    
    // Validar estrutura do carrinho (deve ser um array)
    if (!Array.isArray(parsedCart)) {
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART,
        LogLevel.ERROR,
        `Estrutura inválida do carrinho no localStorage [${CART_STORAGE_KEY}] - não é um array`,
        { value: rawCart, timestamp: Date.now() }
      );
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
    
    // Validar cada item do carrinho
    const validItems = parsedCart.filter(item => {
      const isValid = item && 
                     item.panel && 
                     typeof item.panel === 'object' && 
                     item.panel.id && 
                     typeof item.duration === 'number' &&
                     item.duration > 0;
      
      if (!isValid) {
        logCheckoutEvent(
          CheckoutEvent.LOAD_CART,
          LogLevel.WARNING,
          `Item inválido encontrado no carrinho [${CART_STORAGE_KEY}]`,
          { item: JSON.stringify(item), timestamp: Date.now() }
        );
      }
      
      return isValid;
    });
    
    // Se removemos itens inválidos, atualizar o localStorage
    if (validItems.length !== parsedCart.length) {
      if (validItems.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
      }
      
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART,
        LogLevel.WARNING,
        `${parsedCart.length - validItems.length} itens inválidos removidos do carrinho [${CART_STORAGE_KEY}]`,
        { originalCount: parsedCart.length, validCount: validItems.length, timestamp: Date.now() }
      );
    }
    
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART,
      LogLevel.SUCCESS,
      `Carrinho carregado com sucesso [${CART_STORAGE_KEY}]: ${validItems.length} itens válidos`,
      { itemCount: validItems.length, timestamp: Date.now() }
    );
    
    return validItems;
  } catch (e) {
    console.error("Erro ao carregar carrinho:", e);
    
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART,
      LogLevel.ERROR,
      `Erro ao carregar carrinho [${CART_STORAGE_KEY}]`,
      { error: String(e), timestamp: Date.now() }
    );
    
    // Em caso de erro, limpar o localStorage para evitar problemas futuros
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

/**
 * Salva o carrinho no localStorage com validação e tratamento de erros
 * @param {CartItem[]} cartItems Itens do carrinho a serem salvos
 * @returns {boolean} true se o salvamento foi bem-sucedido
 */
export function saveCartToStorage(cartItems: CartItem[]): boolean {
  try {
    // Validar que os itens do carrinho são válidos antes de salvar
    const validItems = cartItems.filter(item => {
      return item && 
             item.panel && 
             typeof item.panel === 'object' && 
             item.panel.id && 
             typeof item.duration === 'number' &&
             item.duration > 0;
    });
    
    if (validItems.length !== cartItems.length) {
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART,
        LogLevel.WARNING,
        `${cartItems.length - validItems.length} itens inválidos removidos ao salvar carrinho [${CART_STORAGE_KEY}]`,
        { originalCount: cartItems.length, validCount: validItems.length, timestamp: Date.now() }
      );
    }
    
    // Se não há itens válidos, remover do localStorage
    if (validItems.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART,
        LogLevel.INFO,
        `Carrinho vazio removido do localStorage [${CART_STORAGE_KEY}]`,
        { timestamp: Date.now() }
      );
      return true;
    }
    
    // Salvar no localStorage
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
    
    // Verificar se o salvamento foi bem-sucedido
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) {
      throw new Error(`Failed to save cart to localStorage [${CART_STORAGE_KEY}]`);
    }
    
    // Comparar número de itens para confirmar
    const parsedSavedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedSavedCart) || parsedSavedCart.length !== validItems.length) {
      throw new Error(`Saved cart length (${parsedSavedCart.length}) doesn't match expected length (${validItems.length})`);
    }
    
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART,
      LogLevel.SUCCESS,
      `Carrinho salvo com sucesso [${CART_STORAGE_KEY}]: ${validItems.length} itens`,
      { itemCount: validItems.length, timestamp: Date.now() }
    );
    
    return true;
  } catch (e) {
    console.error("Erro ao salvar carrinho:", e);
    
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART,
      LogLevel.ERROR,
      `Erro ao salvar carrinho [${CART_STORAGE_KEY}]`,
      { error: String(e), timestamp: Date.now() }
    );
    
    return false;
  }
}

/**
 * Limpa completamente o carrinho do localStorage
 */
export function clearCartStorage(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    
    logCheckoutEvent(
      CheckoutEvent.CLEAR_CART,
      LogLevel.INFO,
      `Carrinho removido do localStorage [${CART_STORAGE_KEY}]`,
      { timestamp: Date.now() }
    );
  } catch (e) {
    console.error("Erro ao limpar carrinho:", e);
    
    logCheckoutEvent(
      CheckoutEvent.CLEAR_CART,
      LogLevel.ERROR,
      `Erro ao limpar carrinho [${CART_STORAGE_KEY}]`,
      { error: String(e), timestamp: Date.now() }
    );
  }
}

/**
 * Força a limpeza de todos os dados do carrinho
 */
export function forceCleanCart(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    sessionStorage.removeItem('lastCart');
    
    logCheckoutEvent(
      CheckoutEvent.CLEAR_CART,
      LogLevel.INFO,
      `Limpeza forçada do carrinho executada [${CART_STORAGE_KEY}]`,
      { timestamp: Date.now() }
    );
    
    console.log('🧹 [CART] Limpeza forçada do carrinho executada');
  } catch (e) {
    console.error("Erro na limpeza forçada do carrinho:", e);
  }
}

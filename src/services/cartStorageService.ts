
import { CartItem } from '@/types/cart';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

// Armazenamento para o carrinho
export const CART_STORAGE_KEY = 'panelCart';

// Tipo legado para compatibilidade
export interface LegacyCartItem {
  panel: Panel;
  duration: number;
}

/**
 * Verifica se o carrinho está vazio
 * @returns {boolean} true se o carrinho estiver vazio
 */
export function isCartEmpty(): boolean {
  try {
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
 * Limpa itens órfãos do carrinho (itens com estrutura inválida)
 */
export function cleanOrphanCartItems(): LegacyCartItem[] {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) return [];
    
    const parsedCart = JSON.parse(rawCart);
    if (!Array.isArray(parsedCart)) return [];
    
    const validItems = parsedCart.filter(item => {
      const isValid = item && 
                     item.panel && 
                     typeof item.panel === 'object' && 
                     item.panel.id && 
                     typeof item.duration === 'number';
      
      if (!isValid) {
        console.warn('🧹 [CART CLEANUP] Item órfão removido:', item);
        logCheckoutEvent(
          CheckoutEvent.LOAD_CART,
          LogLevel.WARNING,
          `Item órfão removido do carrinho`,
          { item: JSON.stringify(item) }
        );
      }
      
      return isValid;
    });
    
    if (validItems.length !== parsedCart.length) {
      console.log(`🧹 [CART CLEANUP] ${parsedCart.length - validItems.length} itens órfãos removidos`);
      saveCartToStorage(validItems);
    }
    
    return validItems;
  } catch (e) {
    console.error("Erro ao limpar itens órfãos:", e);
    return [];
  }
}

/**
 * Carrega o carrinho do localStorage com tratamento de erros robusto
 * @returns {LegacyCartItem[]} Array de itens do carrinho
 */
export function loadCartFromStorage(): LegacyCartItem[] {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) {
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART,
        LogLevel.INFO,
        `Carrinho não encontrado no localStorage [${CART_STORAGE_KEY}]`,
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
      return [];
    }
    
    // Usar função de limpeza para validar itens
    const validItems = cleanOrphanCartItems();
    
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
 * @param {LegacyCartItem[]} cartItems Itens do carrinho a serem salvos
 * @returns {boolean} true se o salvamento foi bem-sucedido
 */
export function saveCartToStorage(cartItems: LegacyCartItem[]): boolean {
  try {
    // Validar que os itens do carrinho são válidos antes de salvar
    const validItems = cartItems.filter(item => {
      return item && 
             item.panel && 
             typeof item.panel === 'object' && 
             item.panel.id && 
             typeof item.duration === 'number';
    });
    
    if (validItems.length !== cartItems.length) {
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART,
        LogLevel.WARNING,
        `${cartItems.length - validItems.length} itens inválidos removidos ao salvar carrinho [${CART_STORAGE_KEY}]`,
        { originalCount: cartItems.length, validCount: validItems.length, timestamp: Date.now() }
      );
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

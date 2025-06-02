
import { CartItem } from '@/types/cart';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

// Armazenamento para o carrinho - ÚNICA CHAVE
export const CART_STORAGE_KEY = 'panelCart';

// Tipo legado para compatibilidade
export interface LegacyCartItem {
  panel: Panel;
  duration: number;
}

/**
 * Verifica se o carrinho está vazio
 */
export function isCartEmpty(): boolean {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) return true;
    
    const parsedCart = JSON.parse(rawCart);
    return !Array.isArray(parsedCart) || parsedCart.length === 0;
  } catch (e) {
    console.error("❌ [CART STORAGE] Erro ao verificar se o carrinho está vazio:", e);
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
        console.warn('🧹 [CART STORAGE] Item órfão removido:', item);
      }
      
      return isValid;
    });
    
    if (validItems.length !== parsedCart.length) {
      console.log(`🧹 [CART STORAGE] ${parsedCart.length - validItems.length} itens órfãos removidos`);
      saveCartToStorage(validItems);
    }
    
    return validItems;
  } catch (e) {
    console.error("❌ [CART STORAGE] Erro ao limpar itens órfãos:", e);
    return [];
  }
}

/**
 * Carrega o carrinho do localStorage com tratamento de erros robusto
 */
export function loadCartFromStorage(): LegacyCartItem[] {
  try {
    console.log('📂 [CART STORAGE] Carregando carrinho do localStorage...');
    
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) {
      console.log('📂 [CART STORAGE] Nenhum carrinho encontrado no localStorage');
      return [];
    }
    
    const parsedCart = JSON.parse(rawCart);
    
    if (!Array.isArray(parsedCart)) {
      console.error('📂 [CART STORAGE] Estrutura inválida - não é um array');
      return [];
    }
    
    const validItems = cleanOrphanCartItems();
    
    console.log('✅ [CART STORAGE] Carrinho carregado:', {
      totalItems: validItems.length,
      items: validItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        duration: item.duration
      }))
    });
    
    return validItems;
  } catch (e) {
    console.error("❌ [CART STORAGE] Erro ao carregar carrinho:", e);
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

/**
 * Salva o carrinho no localStorage com validação e tratamento de erros
 */
export function saveCartToStorage(cartItems: LegacyCartItem[]): boolean {
  try {
    console.log('💾 [CART STORAGE] Salvando carrinho...', {
      itemCount: cartItems.length,
      items: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        duration: item.duration
      }))
    });
    
    // Validar que os itens do carrinho são válidos antes de salvar
    const validItems = cartItems.filter(item => {
      return item && 
             item.panel && 
             typeof item.panel === 'object' && 
             item.panel.id && 
             typeof item.duration === 'number';
    });
    
    if (validItems.length !== cartItems.length) {
      console.warn(`💾 [CART STORAGE] ${cartItems.length - validItems.length} itens inválidos removidos`);
    }
    
    // Salvar no localStorage
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
    
    // Verificar se o salvamento foi bem-sucedido
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) {
      throw new Error('Falha ao salvar no localStorage');
    }
    
    const parsedSavedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedSavedCart) || parsedSavedCart.length !== validItems.length) {
      throw new Error(`Comprimento salvo (${parsedSavedCart.length}) não corresponde ao esperado (${validItems.length})`);
    }
    
    console.log('✅ [CART STORAGE] Carrinho salvo com sucesso:', validItems.length, 'itens');
    return true;
  } catch (e) {
    console.error("❌ [CART STORAGE] Erro ao salvar carrinho:", e);
    return false;
  }
}

/**
 * Limpa completamente o carrinho do localStorage
 */
export function clearCartStorage(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    console.log('🗑️ [CART STORAGE] Carrinho removido do localStorage');
  } catch (e) {
    console.error("❌ [CART STORAGE] Erro ao limpar carrinho:", e);
  }
}

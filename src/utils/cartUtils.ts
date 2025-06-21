
// Utilitário centralizado para gerenciar dados do carrinho
import { CartItem } from '@/types/cart';

export const CART_STORAGE_KEYS = {
  SIMPLE_CART: 'simple_cart',
  UNIFIED_CART: 'indexa_unified_cart', 
  PANEL_CART: 'panelCart'
} as const;

export interface CartSearchResult {
  cartItems: CartItem[];
  usedKey: string;
  success: boolean;
}

/**
 * Busca itens do carrinho em todas as possíveis chaves do localStorage
 * Prioriza 'simple_cart' como fonte principal
 */
export const findCartItems = (): CartSearchResult => {
  const searchOrder = [
    CART_STORAGE_KEYS.SIMPLE_CART,
    CART_STORAGE_KEYS.UNIFIED_CART,
    CART_STORAGE_KEYS.PANEL_CART
  ];
  
  console.log("🔍 [CartUtils] Iniciando busca por itens do carrinho...");
  
  for (const key of searchOrder) {
    try {
      const rawData = localStorage.getItem(key);
      console.log(`🔍 [CartUtils] Verificando '${key}':`, rawData ? 'DADOS ENCONTRADOS' : 'VAZIO');
      
      if (rawData) {
        const parsedData = JSON.parse(rawData);
        
        // Verificar se é um array válido com itens
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log(`✅ [CartUtils] Carrinho válido encontrado em '${key}':`, {
            itemCount: parsedData.length,
            firstItemStructure: Object.keys(parsedData[0] || {})
          });
          
          return {
            cartItems: parsedData,
            usedKey: key,
            success: true
          };
        }
      }
    } catch (error) {
      console.error(`❌ [CartUtils] Erro ao processar '${key}':`, error);
    }
  }
  
  // Debug completo se nenhum carrinho foi encontrado
  console.warn("⚠️ [CartUtils] Nenhum carrinho válido encontrado. Debug completo:", {
    allLocalStorageKeys: Object.keys(localStorage),
    cartKeys: Object.values(CART_STORAGE_KEYS).map(key => ({
      key,
      hasData: !!localStorage.getItem(key),
      data: localStorage.getItem(key)
    }))
  });
  
  return {
    cartItems: [],
    usedKey: '',
    success: false
  };
};

/**
 * Salva itens do carrinho na chave principal (simple_cart)
 */
export const saveCartItems = (items: CartItem[]): boolean => {
  try {
    localStorage.setItem(CART_STORAGE_KEYS.SIMPLE_CART, JSON.stringify(items));
    console.log(`💾 [CartUtils] Carrinho salvo com sucesso em '${CART_STORAGE_KEYS.SIMPLE_CART}':`, items.length, 'itens');
    return true;
  } catch (error) {
    console.error("❌ [CartUtils] Erro ao salvar carrinho:", error);
    return false;
  }
};

/**
 * Limpa todos os carrinhos do localStorage
 */
export const clearAllCarts = (): void => {
  Object.values(CART_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
    console.log(`🧹 [CartUtils] Removido: ${key}`);
  });
  console.log("✅ [CartUtils] Todos os carrinhos foram limpos");
};

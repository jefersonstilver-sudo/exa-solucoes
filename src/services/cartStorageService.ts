
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

// Constante para a chave do localStorage, evitando inconsistências
export const CART_STORAGE_KEY = 'indexa_cart';

/**
 * Salva o carrinho no localStorage com verificações adicionais de segurança
 */
export const saveCartToStorage = (cartItems: any[]): boolean => {
  try {
    // Verificação de segurança - não salvar carrinhos vazios
    if (!Array.isArray(cartItems)) {
      throw new Error("Tentativa de salvar um carrinho que não é array");
    }
    
    // Verificar se todos os itens têm a estrutura esperada
    const itemsValid = cartItems.every(item => 
      item && 
      item.panel && 
      typeof item.panel === 'object' && 
      item.panel.id && 
      typeof item.duration === 'number'
    );
    
    if (!itemsValid && cartItems.length > 0) {
      throw new Error("Estrutura inválida dos itens do carrinho");
    }

    // Convertemos para string primeiro para capturar erros de serialização
    const cartString = JSON.stringify(cartItems);
    
    // Salvamos no localStorage
    localStorage.setItem(CART_STORAGE_KEY, cartString);
    
    // Log detalhado do que foi salvo
    console.log("Carrinho salvo no localStorage:", cartItems);
    
    // Verificamos se foi salvo corretamente
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) {
      throw new Error("Falha ao verificar salvamento do carrinho");
    }
    
    // Verificamos se o JSON pode ser parseado novamente
    const parsedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedCart)) {
      throw new Error("O carrinho salvo não é um array válido");
    }
    
    // Verificamos se a quantidade de itens é a mesma
    if (parsedCart.length !== cartItems.length) {
      throw new Error(`Quantidade de itens divergente: ${parsedCart.length} vs ${cartItems.length}`);
    }
    
    // Log do sucesso
    console.log("Carrinho salvo no localStorage com sucesso:", parsedCart.length, "itens");
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART,
      LogLevel.SUCCESS,
      `Carrinho salvo com sucesso [${CART_STORAGE_KEY}]: ${cartItems.length} itens`,
      { 
        cartItemCount: cartItems.length,
        storageKey: CART_STORAGE_KEY,
        items: cartItems.map(item => ({
          id: item.panel.id,
          nome: item.panel.buildings?.nome || 'Desconhecido',
          duration: item.duration
        }))
      }
    );
    
    return true;
  } catch (error) {
    // Log do erro
    console.error("Erro ao salvar carrinho no localStorage:", error);
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART,
      LogLevel.ERROR,
      `Erro ao salvar carrinho [${CART_STORAGE_KEY}]: ${error}`,
      { 
        error: String(error),
        cartState: JSON.stringify(cartItems),
        storageKey: CART_STORAGE_KEY,
        browserStorage: {
          available: typeof localStorage !== 'undefined',
          storageSize: typeof localStorage !== 'undefined' ? JSON.stringify(localStorage).length : 0
        }
      }
    );
    
    return false;
  }
};

/**
 * Carrega o carrinho do localStorage com verificações adicionais de segurança
 */
export const loadCartFromStorage = () => {
  try {
    console.log("Tentando carregar carrinho do localStorage com chave:", CART_STORAGE_KEY);
    
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    console.log("Carrinho bruto encontrado:", savedCart);
    
    if (!savedCart) {
      console.log("Nenhum carrinho encontrado no localStorage com chave:", CART_STORAGE_KEY);
      
      // Verificar se existe um carrinho na chave antiga para migração
      const legacyCart = localStorage.getItem('panelCart');
      if (legacyCart) {
        console.log("Carrinho encontrado em chave legada 'panelCart', migrando...");
        localStorage.setItem(CART_STORAGE_KEY, legacyCart);
        return JSON.parse(legacyCart);
      }
      
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART,
        LogLevel.INFO,
        `Nenhum carrinho encontrado no localStorage [${CART_STORAGE_KEY}] - criando novo carrinho vazio`,
        { timestamp: Date.now(), storageKey: CART_STORAGE_KEY }
      );
      return [];
    }
    
    const parsedCart = JSON.parse(savedCart);
    console.log("Carrinho carregado e parseado:", parsedCart);
    
    if (!Array.isArray(parsedCart)) {
      throw new Error(`O carrinho carregado [${CART_STORAGE_KEY}] não é um array válido`);
    }
    
    // Validar estrutura dos itens
    if (parsedCart.length > 0) {
      const itemsValid = parsedCart.every(item => 
        item && 
        item.panel && 
        typeof item.panel === 'object' && 
        item.panel.id && 
        typeof item.duration === 'number'
      );
      
      if (!itemsValid) {
        throw new Error(`Estrutura de carrinho inválida carregada do localStorage [${CART_STORAGE_KEY}]`);
      }
    }
    
    console.log("Carrinho carregado do localStorage com sucesso:", parsedCart.length, "itens");
    const logLevel = parsedCart.length === 0 ? LogLevel.WARNING : LogLevel.SUCCESS;
    
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART,
      logLevel,
      `Carrinho carregado [${CART_STORAGE_KEY}] ${parsedCart.length === 0 ? '(vazio)' : 'com sucesso'}: ${parsedCart.length} itens`,
      { 
        cartItemCount: parsedCart.length,
        isEmpty: parsedCart.length === 0,
        storageKey: CART_STORAGE_KEY,
        items: parsedCart.length > 0 ? parsedCart.map(item => ({
          id: item.panel?.id || 'unknown',
          nome: item.panel?.buildings?.nome || 'Desconhecido',
          duration: item.duration
        })) : []
      }
    );
    
    return parsedCart;
  } catch (error) {
    console.error("Erro ao carregar carrinho do localStorage:", error);
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART,
      LogLevel.ERROR,
      `Erro ao carregar carrinho [${CART_STORAGE_KEY}]: ${error}`,
      { 
        error: String(error),
        storageKey: CART_STORAGE_KEY,
        localStorage: {
          cartContent: localStorage.getItem(CART_STORAGE_KEY)
        }
      }
    );
    
    // Em caso de erro, retornamos um array vazio
    return [];
  }
};

/**
 * Função para verificar se o carrinho está vazio
 * Realiza verificações de segurança adicionais
 */
export const isCartEmpty = (): boolean => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    console.log("Verificando se carrinho está vazio. Valor bruto:", savedCart);
    
    // Se não existir
    if (!savedCart) return true;
    
    // Tenta fazer o parse
    const parsedCart = JSON.parse(savedCart);
    console.log("Carrinho parseado para verificação de vazio:", parsedCart);
    
    // Verifica se é um array e se tem itens
    const isEmpty = !Array.isArray(parsedCart) || parsedCart.length === 0;
    console.log("Resultado da verificação de carrinho vazio:", isEmpty);
    return isEmpty;
  } catch (e) {
    // Em caso de erro, consideramos vazio para garantir segurança
    console.error("Erro ao verificar se carrinho está vazio:", e);
    return true;
  }
};

/**
 * Limpa o carrinho e registra a ação 
 */
export const clearCart = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    console.log("Carrinho removido do localStorage");
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART,
      LogLevel.INFO,
      `Carrinho removido do localStorage [${CART_STORAGE_KEY}]`,
      { action: 'clear', storageKey: CART_STORAGE_KEY }
    );
    return true;
  } catch (e) {
    console.error("Erro ao limpar carrinho:", e);
    return false;
  }
};

/**
 * Função para contar itens no carrinho com segurança
 * Permite verificações rápidas sem precisar carregar todo o conteúdo
 */
export const countCartItems = (): number => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) return 0;
    
    const parsedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedCart)) return 0;
    
    return parsedCart.length;
  } catch (e) {
    console.error("Erro ao contar itens do carrinho:", e);
    return 0;
  }
};

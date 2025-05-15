
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

/**
 * Salva o carrinho no localStorage com verificações adicionais de segurança
 */
export const saveCartToStorage = (cartItems: any[]): boolean => {
  try {
    // Verificação de segurança - não salvar carrinhos vazios
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Tentativa de salvar um carrinho vazio ou inválido");
    }
    
    // Verificar se todos os itens têm a estrutura esperada
    const itemsValid = cartItems.every(item => 
      item && 
      item.panel && 
      typeof item.panel === 'object' && 
      item.panel.id && 
      typeof item.duration === 'number'
    );
    
    if (!itemsValid) {
      throw new Error("Estrutura inválida dos itens do carrinho");
    }

    // Convertemos para string primeiro para capturar erros de serialização
    const cartString = JSON.stringify(cartItems);
    
    // Salvamos no localStorage
    localStorage.setItem('panelCart', cartString);
    
    // Verificamos se foi salvo corretamente
    const savedCart = localStorage.getItem('panelCart');
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
    console.log("Carrinho salvo no localStorage:", cartItems.length, "itens");
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART,
      LogLevel.SUCCESS,
      `Carrinho salvo com sucesso: ${cartItems.length} itens`,
      { 
        cartItemCount: cartItems.length,
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
      `Erro ao salvar carrinho: ${error}`,
      { 
        error: String(error),
        cartState: JSON.stringify(cartItems),
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
    const savedCart = localStorage.getItem('panelCart');
    if (!savedCart) {
      console.log("Nenhum carrinho encontrado no localStorage");
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART,
        LogLevel.INFO,
        "Nenhum carrinho encontrado no localStorage - criando novo carrinho vazio",
        { timestamp: Date.now() }
      );
      return [];
    }
    
    const parsedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedCart)) {
      throw new Error("O carrinho carregado não é um array válido");
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
        throw new Error("Estrutura de carrinho inválida carregada do localStorage");
      }
    }
    
    console.log("Carrinho carregado do localStorage:", parsedCart.length, "itens");
    const logLevel = parsedCart.length === 0 ? LogLevel.WARNING : LogLevel.SUCCESS;
    
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART,
      logLevel,
      `Carrinho carregado ${parsedCart.length === 0 ? '(vazio)' : 'com sucesso'}: ${parsedCart.length} itens`,
      { 
        cartItemCount: parsedCart.length,
        isEmpty: parsedCart.length === 0,
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
      `Erro ao carregar carrinho: ${error}`,
      { 
        error: String(error),
        localStorage: {
          panelCart: localStorage.getItem('panelCart')
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
    const savedCart = localStorage.getItem('panelCart');
    
    // Se não existir
    if (!savedCart) return true;
    
    // Tenta fazer o parse
    const parsedCart = JSON.parse(savedCart);
    
    // Verifica se é um array e se tem itens
    return !Array.isArray(parsedCart) || parsedCart.length === 0;
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
    localStorage.removeItem('panelCart');
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART,
      LogLevel.INFO,
      "Carrinho removido do localStorage",
      { action: 'clear' }
    );
    return true;
  } catch (e) {
    console.error("Erro ao limpar carrinho:", e);
    return false;
  }
};

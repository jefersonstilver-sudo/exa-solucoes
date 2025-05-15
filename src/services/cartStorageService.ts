
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export const CART_STORAGE_KEY = 'indexa_cart';

export interface CartItem {
  panel: Panel;
  duration: number;
}

/**
 * Carrega o carrinho do localStorage com tratamento robusto de erros
 */
export const loadCartFromStorage = (): CartItem[] => {
  try {
    console.log(`Tentando carregar carrinho do localStorage com chave: ${CART_STORAGE_KEY}`);
    
    // Obter conteúdo bruto do localStorage
    const cartJSON = localStorage.getItem(CART_STORAGE_KEY);
    console.log(`Carrinho bruto encontrado:`, cartJSON);
    
    if (!cartJSON) {
      // Carrinho não existe
      console.log(`Nenhum carrinho encontrado em: ${CART_STORAGE_KEY}`);
      
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART, 
        LogLevel.INFO, 
        `Nenhum carrinho encontrado em [${CART_STORAGE_KEY}], retornando array vazio`, 
        { storageKey: CART_STORAGE_KEY }
      );
      
      return [];
    }

    // Tentar parsejar o JSON
    let parsedCart: CartItem[];
    try {
      parsedCart = JSON.parse(cartJSON);
      console.log(`Carrinho carregado e parseado:`, parsedCart);
    } catch (parseError) {
      // Erro ao parsear JSON
      console.error(`Erro ao parsear carrinho de [${CART_STORAGE_KEY}]:`, parseError);
      
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART, 
        LogLevel.ERROR, 
        `Erro ao parsear carrinho de [${CART_STORAGE_KEY}]`, 
        { error: String(parseError), rawCart: cartJSON }
      );
      
      return [];
    }

    // Verificar se é um array
    if (!Array.isArray(parsedCart)) {
      console.error(`Carrinho carregado não é um array: ${typeof parsedCart}`);
      
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART, 
        LogLevel.ERROR, 
        `Formato inválido de carrinho em [${CART_STORAGE_KEY}] - não é um array`, 
        { type: typeof parsedCart }
      );
      
      return [];
    }

    // Filtrar itens inválidos e verificar estrutura
    const validatedCart = parsedCart.filter(item => 
      item && 
      typeof item === 'object' &&
      item.panel && 
      typeof item.panel === 'object' &&
      item.panel.id && 
      typeof item.duration === 'number'
    );
    
    // Se o tamanho do array filtrado for diferente, alguns itens eram inválidos
    if (validatedCart.length !== parsedCart.length) {
      console.warn(`${parsedCart.length - validatedCart.length} itens inválidos removidos do carrinho`);
      
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART, 
        LogLevel.WARNING, 
        `${parsedCart.length - validatedCart.length} itens inválidos removidos do carrinho [${CART_STORAGE_KEY}]`, 
        { 
          originalCount: parsedCart.length, 
          validCount: validatedCart.length
        }
      );
    }

    // Log de sucesso
    console.log(`Carrinho carregado do localStorage com sucesso: ${validatedCart.length} itens`);
    
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART, 
      LogLevel.SUCCESS, 
      `Carrinho carregado [${CART_STORAGE_KEY}] com sucesso: ${validatedCart.length} itens`, 
      { 
        cartItemCount: validatedCart.length,
        isEmpty: validatedCart.length === 0,
        storageKey: CART_STORAGE_KEY,
        items: validatedCart.map(item => ({
          id: item.panel.id,
          nome: item.panel.buildings?.nome || 'Desconhecido',
          duration: item.duration
        }))
      }
    );
    
    return validatedCart;
    
  } catch (error) {
    // Erro geral
    console.error(`Erro ao carregar carrinho de [${CART_STORAGE_KEY}]:`, error);
    
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART, 
      LogLevel.ERROR, 
      `Erro ao carregar carrinho de [${CART_STORAGE_KEY}]`, 
      { error: String(error), storageKey: CART_STORAGE_KEY }
    );
    
    return [];
  }
};

/**
 * Salva o carrinho no localStorage com verificações robustas
 */
export const saveCartToStorage = (cart: CartItem[]): boolean => {
  try {
    // Verificar se o carrinho é um array
    if (!Array.isArray(cart)) {
      console.error(`Tentativa de salvar carrinho inválido (não é array): ${typeof cart}`);
      
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART, 
        LogLevel.ERROR, 
        `Tentativa de salvar carrinho inválido em [${CART_STORAGE_KEY}] (não é array)`, 
        { type: typeof cart }
      );
      
      return false;
    }
    
    // Filtrar itens inválidos
    const validatedCart = cart.filter(item => 
      item && 
      item.panel && 
      typeof item.panel === 'object' &&
      item.panel.id && 
      typeof item.duration === 'number'
    );
    
    // Verificar se há itens válidos para salvar
    if (validatedCart.length === 0 && cart.length > 0) {
      console.error("Todos os itens do carrinho são inválidos, nada será salvo");
      
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART, 
        LogLevel.ERROR, 
        `Todos os itens do carrinho são inválidos para [${CART_STORAGE_KEY}], nada será salvo`, 
        { originalCount: cart.length }
      );
      
      return false;
    }
    
    // Se o tamanho do array filtrado for diferente, alguns itens eram inválidos
    if (validatedCart.length !== cart.length) {
      console.warn(`${cart.length - validatedCart.length} itens inválidos removidos ao salvar`);
      
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART, 
        LogLevel.WARNING, 
        `${cart.length - validatedCart.length} itens inválidos removidos ao salvar em [${CART_STORAGE_KEY}]`, 
        { 
          originalCount: cart.length, 
          savedCount: validatedCart.length
        }
      );
    }
    
    // Converter para string JSON
    const cartJSON = JSON.stringify(validatedCart);
    
    // Salvar no localStorage
    localStorage.setItem(CART_STORAGE_KEY, cartJSON);
    
    // Verificar se foi salvo corretamente
    const storedJSON = localStorage.getItem(CART_STORAGE_KEY);
    if (storedJSON !== cartJSON) {
      console.error("Falha na verificação após salvar carrinho - os valores não correspondem");
      
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART, 
        LogLevel.ERROR, 
        `Falha na verificação após salvar carrinho em [${CART_STORAGE_KEY}] - os valores não correspondem`, 
        {}
      );
      
      return false;
    }
    
    // Log de sucesso
    console.log(`Carrinho salvo no localStorage com sucesso: ${validatedCart.length} itens`);
    
    // Log com nível de detalhe dependendo do número de itens
    const logLevel = validatedCart.length > 0 ? LogLevel.SUCCESS : LogLevel.WARNING;
    const messagePrefix = validatedCart.length > 0 ? "Carrinho salvo" : "Carrinho vazio salvo";
    
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART, 
      logLevel, 
      `${messagePrefix} em [${CART_STORAGE_KEY}]: ${validatedCart.length} itens`, 
      { 
        cartItemCount: validatedCart.length,
        isEmpty: validatedCart.length === 0,
        storageKey: CART_STORAGE_KEY,
        items: validatedCart.map(item => ({
          id: item.panel.id,
          nome: item.panel.buildings?.nome || 'Desconhecido',
          duration: item.duration
        }))
      }
    );
    
    return true;
    
  } catch (error) {
    // Erro geral
    console.error(`Erro ao salvar carrinho em [${CART_STORAGE_KEY}]:`, error);
    
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART, 
      LogLevel.ERROR, 
      `Erro ao salvar carrinho em [${CART_STORAGE_KEY}]`, 
      { error: String(error), storageKey: CART_STORAGE_KEY }
    );
    
    return false;
  }
};

/**
 * Verifica se o carrinho está vazio (não existe ou é array vazio)
 */
export const isCartEmpty = (): boolean => {
  try {
    const cartJSON = localStorage.getItem(CART_STORAGE_KEY);
    if (!cartJSON) return true;
    
    try {
      const cart = JSON.parse(cartJSON);
      return !Array.isArray(cart) || cart.length === 0;
    } catch (e) {
      return true;
    }
  } catch (e) {
    return true;
  }
};

/**
 * Limpa o carrinho do localStorage
 */
export const clearCartStorage = (): boolean => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART, 
      LogLevel.SUCCESS, 
      `Carrinho removido de [${CART_STORAGE_KEY}]`, 
      { storageKey: CART_STORAGE_KEY }
    );
    
    return true;
  } catch (e) {
    console.error(`Erro ao limpar carrinho de [${CART_STORAGE_KEY}]:`, e);
    
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART, 
      LogLevel.ERROR, 
      `Erro ao limpar carrinho de [${CART_STORAGE_KEY}]`, 
      { error: String(e), storageKey: CART_STORAGE_KEY }
    );
    
    return false;
  }
};


import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

/**
 * Salva o carrinho no localStorage com verificações adicionais de segurança
 */
export const saveCartToStorage = (cartItems: any[]): boolean => {
  try {
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
      { cartItemCount: cartItems.length }
    );
    
    return true;
  } catch (error) {
    // Log do erro
    console.error("Erro ao salvar carrinho no localStorage:", error);
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART,
      LogLevel.ERROR,
      `Erro ao salvar carrinho: ${error}`,
      { error: String(error) }
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
      return [];
    }
    
    const parsedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedCart)) {
      throw new Error("O carrinho carregado não é um array válido");
    }
    
    console.log("Carrinho carregado do localStorage:", parsedCart.length, "itens");
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART,
      LogLevel.SUCCESS,
      `Carrinho carregado com sucesso: ${parsedCart.length} itens`,
      { cartItemCount: parsedCart.length }
    );
    
    return parsedCart;
  } catch (error) {
    console.error("Erro ao carregar carrinho do localStorage:", error);
    logCheckoutEvent(
      CheckoutEvent.LOAD_CART,
      LogLevel.ERROR,
      `Erro ao carregar carrinho: ${error}`,
      { error: String(error) }
    );
    
    return [];
  }
};

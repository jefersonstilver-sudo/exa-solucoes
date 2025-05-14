
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface CartItem {
  panel: Panel;
  duration: number;
}

/**
 * Save cart to localStorage with error handling and logging
 */
export const saveCartToStorage = (items: CartItem[]): boolean => {
  try {
    // Create simplified cart items to avoid serialization issues
    const cartItemsSimplified = items.map(item => ({
      panel: {
        id: item.panel.id,
        nome: item.panel.buildings?.nome || 'Painel sem nome',
        buildings: item.panel.buildings ? {
          id: item.panel.buildings.id,
          nome: item.panel.buildings.nome,
          imageUrl: item.panel.buildings.imageUrl,
          endereco: item.panel.buildings.endereco,
          bairro: item.panel.buildings.bairro
        } : null,
        modo: item.panel.modo,
        resolucao: item.panel.resolucao
      },
      duration: item.duration
    }));
    
    // Save to localStorage
    localStorage.setItem('panelCart', JSON.stringify(cartItemsSimplified));
    
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART, 
      LogLevel.SUCCESS, 
      "Carrinho salvo no localStorage com sucesso", 
      { items: items.length }
    );
    
    return true;
  } catch (storageError) {
    console.error('Erro ao salvar carrinho:', storageError);
    
    logCheckoutEvent(
      CheckoutEvent.SAVE_CART, 
      LogLevel.ERROR, 
      "Erro ao salvar carrinho no localStorage", 
      { error: String(storageError) }
    );
    
    return false;
  }
};

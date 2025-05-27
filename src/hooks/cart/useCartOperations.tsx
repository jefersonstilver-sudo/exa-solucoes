
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { Check, Trash2 } from 'lucide-react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { getPanelPrice } from '@/utils/checkoutUtils';

interface UseCartOperationsProps {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setCartAnimation: React.Dispatch<React.SetStateAction<boolean>>;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useCartOperations = ({
  cartItems,
  setCartItems,
  setCartAnimation,
  setCartOpen
}: UseCartOperationsProps) => {
  const { toast } = useToast();

  const generateItemId = (panel: Panel): string => {
    return `cart_${panel.id}_${Date.now()}`;
  };

  const createCartItem = (panel: Panel, duration: number = 30): CartItem => {
    return {
      id: generateItemId(panel),
      panel,
      duration,
      addedAt: Date.now(),
      price: getPanelPrice(panel, duration)
    };
  };

  const handleAddToCart = (panel: Panel, duration: number = 30) => {
    setCartItems(prev => {
      // Check if panel is already in cart
      const existingIndex = prev.findIndex(item => item.panel.id === panel.id);
      
      if (existingIndex >= 0) {
        // Update the existing item
        return prev.map((item, index) => 
          index === existingIndex 
            ? {
                ...item,
                duration,
                price: getPanelPrice(panel, duration),
                addedAt: Date.now()
              }
            : item
        );
      } else {
        // Trigger cart icon animation only
        setCartAnimation(true);
        setTimeout(() => setCartAnimation(false), 800);
        
        // Add new panel to cart
        const newItem = createCartItem(panel, duration);
        return [...prev, newItem];
      }
    });
    
    // DO NOT automatically open the cart - only open on manual click
    
    // Log event
    logCheckoutEvent(
      CheckoutEvent.ADD_TO_CART,
      LogLevel.INFO,
      "Painel adicionado ao carrinho",
      { panelId: panel.id, duration }
    );
    
    toast({
      title: "✅ Painel adicionado",
      description: `${panel.buildings?.nome || 'Painel'} adicionado ao carrinho`,
      action: (
        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-3 w-3 text-green-600" />
        </div>
      )
    });
  };

  const handleRemoveFromCart = (panelId: string) => {
    // Get panel name before removing
    const panelToRemove = cartItems.find(item => item.panel.id === panelId);
    const panelName = panelToRemove?.panel.buildings?.nome || 'Painel';
    
    setCartItems(prev => prev.filter(item => item.panel.id !== panelId));
    
    // Log event
    logCheckoutEvent(
      CheckoutEvent.REMOVE_FROM_CART,
      LogLevel.INFO,
      "Painel removido do carrinho",
      { panelId }
    );
    
    toast({
      title: "🗑️ Painel removido",
      description: `${panelName} removido do carrinho`,
      action: (
        <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
          <Trash2 className="h-3 w-3 text-red-600" />
        </div>
      )
    });
  };

  const handleClearCart = () => {
    // Save the cart temporarily before clearing (in case the user wants to undo)
    try {
      const currentCart = JSON.stringify(cartItems);
      if (cartItems.length > 0) {
        sessionStorage.setItem('lastCart', currentCart);
      }
    } catch (e) {
      console.error('Falha ao salvar backup do carrinho', e);
    }

    // Clear the cart
    setCartItems([]);
    localStorage.removeItem('panelCart');

    // Log event
    logCheckoutEvent(
      CheckoutEvent.CLEAR_CART,
      LogLevel.INFO,
      "Carrinho limpo",
      { itemCount: cartItems.length }
    );

    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho",
      variant: "default"
    });
  };

  const handleChangeDuration = (panelId: string, duration: number) => {
    setCartItems(prev => {
      const updated = prev.map(item => 
        item.panel.id === panelId 
          ? {
              ...item,
              duration,
              price: getPanelPrice(item.panel, duration)
            }
          : item
      );
      
      // Show toast notification about duration change
      const panel = prev.find(item => item.panel.id === panelId);
      const months = duration / 30;
      const monthText = months === 1 ? 'mês' : 'meses';
      
      // Log event
      logCheckoutEvent(
        CheckoutEvent.UPDATE_CART,
        LogLevel.INFO,
        "Duração de painel atualizada",
        { panelId, newDuration: duration }
      );
      
      if (panel) {
        toast({
          title: "Duração atualizada",
          description: `${panel.panel.buildings?.nome || 'Painel'}: ${months} ${monthText}`,
        });
      }
      
      return updated;
    });
  };

  // Restore cart if needed (if it was cleared by mistake)
  const handleRestoreCart = () => {
    try {
      const lastCart = sessionStorage.getItem('lastCart');
      if (lastCart) {
        const parsedCart = JSON.parse(lastCart);
        setCartItems(parsedCart);
        sessionStorage.removeItem('lastCart'); // Clear the backup after restoring
        
        // Log event
        logCheckoutEvent(
          CheckoutEvent.RESTORE_CART,
          LogLevel.INFO,
          "Carrinho restaurado do backup",
          { itemCount: parsedCart.length }
        );
        
        toast({
          title: "Carrinho restaurado",
          description: "Os itens foram restaurados com sucesso",
        });
        
        return true;
      }
    } catch (e) {
      console.error('Falha ao restaurar o carrinho', e);
    }
    return false;
  };

  // Toggle cart open/close - only allow manual toggle
  const toggleCart = () => {
    setCartOpen(prev => !prev);
  };

  return {
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleRestoreCart,
    toggleCart
  };
};

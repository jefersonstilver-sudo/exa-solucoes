import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCartManager = () => {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  
  // Load cart from localStorage on component mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('panelCart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
          console.log("Carrinho carregado do localStorage:", parsedCart.length, "itens");
        }
      } catch (e) {
        console.error('Falha ao carregar o carrinho do localStorage', e);
      }
    };
    
    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      console.log("Carrinho salvo no localStorage:", cartItems.length, "itens");
    } catch (e) {
      console.error('Falha ao salvar o carrinho no localStorage', e);
    }
  }, [cartItems]);

  // Keep cart open when items are added
  useEffect(() => {
    if (cartItems.length > 0) {
      setCartOpen(true);
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }

    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [cartItems.length]);

  const handleAddToCart = (panel: Panel, duration: number = 30) => {
    setCartItems(prev => {
      // Check if panel is already in cart
      const exists = prev.some(item => item.panel.id === panel.id);
      if (exists) {
        return prev.map(item => 
          item.panel.id === panel.id 
            ? {...item, duration} 
            : item
        );
      } else {
        // Trigger cart icon animation
        setCartAnimation(true);
        setTimeout(() => setCartAnimation(false), 800);
        
        return [...prev, { panel, duration }];
      }
    });
    
    // Automatically open the cart when an item is added
    setCartOpen(true);
    
    toast({
      title: "Painel adicionado",
      description: `${panel.buildings?.nome} adicionado com sucesso`,
    });
  };

  const handleRemoveFromCart = (panelId: string) => {
    setCartItems(prev => prev.filter(item => item.panel.id !== panelId));
    
    toast({
      title: "Painel removido",
      description: "Item removido do carrinho com sucesso",
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

    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho",
    });
  };

  const handleChangeDuration = (panelId: string, duration: number) => {
    setCartItems(prev => prev.map(item => 
      item.panel.id === panelId 
        ? {...item, duration} 
        : item
    ));
  };

  // Restore cart if needed (if it was cleared by mistake)
  const handleRestoreCart = () => {
    try {
      const lastCart = sessionStorage.getItem('lastCart');
      if (lastCart) {
        const parsedCart = JSON.parse(lastCart);
        setCartItems(parsedCart);
        sessionStorage.removeItem('lastCart'); // Clear the backup after restoring
        
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

  // Toggle cart open/close
  const toggleCart = () => {
    setCartOpen(prev => !prev);
  };

  return {
    cartItems,
    cartOpen,
    setCartOpen,
    toggleCart,
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleRestoreCart,
    cartAnimation
  };
};

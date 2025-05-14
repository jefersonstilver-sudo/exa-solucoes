import { useState, useEffect, useCallback } from 'react';
import { Panel } from '@/types/panel';
import { useToast } from '@/hooks/use-toast';
import { Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCartManager = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
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
    if (cartItems.length > 0 && !isNavigating) {
      setCartOpen(true);
      document.body.classList.add('drawer-open');
    } else if (cartItems.length === 0) {
      document.body.classList.remove('drawer-open');
    }

    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [cartItems.length, isNavigating]);

  const handleAddToCart = (panel: Panel, duration: number = 30) => {
    setCartItems(prev => {
      // Check if panel is already in cart
      const exists = prev.some(item => item.panel.id === panel.id);
      if (exists) {
        // Update the duration if panel already exists
        return prev.map(item => 
          item.panel.id === panel.id 
            ? {...item, duration} 
            : item
        );
      } else {
        // Trigger cart icon animation
        setCartAnimation(true);
        setTimeout(() => setCartAnimation(false), 800);
        
        // Add new panel to cart
        return [...prev, { panel, duration }];
      }
    });
    
    // Automatically open the cart when an item is added
    setCartOpen(true);
    
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
          ? {...item, duration} 
          : item
      );
      
      // Show toast notification about duration change
      const panel = prev.find(item => item.panel.id === panelId);
      const months = duration / 30;
      const monthText = months === 1 ? 'mês' : 'meses';
      
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

  // Procedimento de checkout completamente revisado
  const handleProceedToCheckout = useCallback(() => {
    console.log("Iniciando processo de checkout (revisado)");
    
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione painéis ao seu carrinho para finalizar a compra",
        variant: "destructive"
      });
      return;
    }
    
    // Marca que estamos navegando para evitar problemas com o drawer
    setIsNavigating(true);
    
    // Fecha o drawer para evitar problemas visuais
    setCartOpen(false);
    
    // Navegação direta para checkout com delay suficiente para garantir que
    // o drawer seja fechado antes da navegação
    setTimeout(() => {
      console.log("Navegando para /checkout");
      navigate('/checkout');
    }, 200);
  }, [cartItems.length, navigate, toast]);

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
    cartAnimation,
    handleProceedToCheckout
  };
};

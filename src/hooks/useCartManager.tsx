
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
      if (cartItems.length > 0) {
        localStorage.setItem('panelCart', JSON.stringify(cartItems));
        console.log("Carrinho salvo no localStorage:", cartItems.length, "itens");
      }
    } catch (e) {
      console.error('Falha ao salvar o carrinho no localStorage', e);
    }
  }, [cartItems]);

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
        return [...prev, { panel, duration }];
      }
    });
    
    // Abra o carrinho automaticamente quando um item for adicionado
    setCartOpen(true);
    
    toast({
      title: "Painel adicionado ao carrinho",
      description: `${panel.buildings?.nome} adicionado com duração de ${duration} dias`,
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
    // Salvar o carrinho temporariamente antes de limpar (caso o usuário queira desfazer)
    try {
      const currentCart = JSON.stringify(cartItems);
      if (cartItems.length > 0) {
        sessionStorage.setItem('lastCart', currentCart);
      }
    } catch (e) {
      console.error('Falha ao salvar backup do carrinho', e);
    }

    // Limpar o carrinho
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

  // Restaurar carrinho se necessário (caso tenha sido limpo por engano)
  const handleRestoreCart = () => {
    try {
      const lastCart = sessionStorage.getItem('lastCart');
      if (lastCart) {
        const parsedCart = JSON.parse(lastCart);
        setCartItems(parsedCart);
        sessionStorage.removeItem('lastCart'); // Limpa o backup após restaurar
        
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
    handleRestoreCart
  };
};

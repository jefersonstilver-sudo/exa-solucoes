
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CartItem } from './useCartState';

interface UseCartCheckoutProps {
  cartItems: CartItem[];
  setIsNavigating: React.Dispatch<React.SetStateAction<boolean>>;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useCartCheckout = ({
  cartItems,
  setIsNavigating,
  setCartOpen
}: UseCartCheckoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Procedimento de checkout para redirecionar para seleção de plano
  const handleProceedToCheckout = useCallback(() => {
    console.log("Iniciando processo de checkout (corrigido)");
    
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione painéis ao seu carrinho para finalizar a compra",
        variant: "destructive"
      });
      return;
    }
    
    // IMPORTANTE: Armazenar o carrinho em localStorage antes de navegar
    try {
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      console.log("Carrinho salvo para checkout:", cartItems.length, "itens");
    } catch (e) {
      console.error('Falha ao salvar o carrinho para checkout', e);
    }
    
    // Marca que estamos navegando para evitar problemas com o drawer
    setIsNavigating(true);
    
    // Fecha o drawer antes da navegação
    setCartOpen(false);
    
    // Adicionando logs adicionais para diagnóstico
    console.log("Preparando navegação para seleção de plano, carrinho fechado, itens:", cartItems.length);
    
    // Navegação para seleção de plano com pequeno delay para garantir que o drawer seja fechado
    setTimeout(() => {
      console.log("Executando navegação para /selecionar-plano com", cartItems.length, "itens");
      navigate('/selecionar-plano');
    }, 300);
  }, [cartItems, navigate, toast, setIsNavigating, setCartOpen]);

  return {
    handleProceedToCheckout
  };
};

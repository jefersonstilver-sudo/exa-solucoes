
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
    console.log("Iniciando processo de checkout com", cartItems.length, "itens");
    
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
      toast({
        title: "Erro ao processar o carrinho",
        description: "Ocorreu um erro ao finalizar a compra. Tente novamente.",
        variant: "destructive"
      });
      return;
    }
    
    // Marca que estamos navegando para evitar problemas com o drawer
    setIsNavigating(true);
    
    // Fecha o drawer antes da navegação
    setCartOpen(false);
    
    console.log("Navegando para seleção de plano...");
    
    // Navegação direta para evitar problemas com o timer
    navigate('/selecionar-plano');
  }, [cartItems, navigate, toast, setIsNavigating, setCartOpen]);

  return {
    handleProceedToCheckout
  };
};

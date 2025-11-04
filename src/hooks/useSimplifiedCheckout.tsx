
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useCartManager } from '@/hooks/useCartManager';
import { toast } from 'sonner';

export const useSimplifiedCheckout = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading: isSessionLoading } = useUserSession();
  const { cartItems, handleClearCart } = useCartManager();
  const [isProcessing, setIsProcessing] = useState(false);

  // Função principal para processar checkout
  const proceedToCheckout = async () => {
    console.log('🛒 [SimplifiedCheckout] Iniciando processo de checkout:', {
      isLoggedIn,
      userId: user?.id,
      cartItems: cartItems.length,
      currentPath: window.location.pathname
    });

    // Validações básicas
    if (isProcessing) {
      console.log('🛒 [SimplifiedCheckout] Checkout já em processamento');
      return false;
    }

    if (!isLoggedIn || !user?.id) {
      console.log('🛒 [SimplifiedCheckout] Usuário não logado, redirecionando');
      toast.info("Faça login ou crie uma conta para continuar");
      navigate('/cadastro?redirect=/selecionar-plano');
      return false;
    }

    if (!cartItems || cartItems.length === 0) {
      console.log('🛒 [SimplifiedCheckout] Carrinho vazio');
      toast.error("Seu carrinho está vazio. Adicione painéis para continuar.");
      navigate('/paineis-digitais/loja');
      return false;
    }

    setIsProcessing(true);

    try {
      // Salvar carrinho no localStorage para garantir persistência
      localStorage.setItem('checkout_cart', JSON.stringify(cartItems));
      
      // Navegação linear: carrinho -> seleção de plano
      console.log('🛒 [SimplifiedCheckout] Navegando para seleção de plano');
      navigate('/selecionar-plano');
      
      // Feedback visual
      toast.success(`Prosseguindo com ${cartItems.length} painel(is)`, {
        duration: 2000
      });

      return true;
    } catch (error) {
      console.error('❌ [SimplifiedCheckout] Erro no checkout:', error);
      toast.error('Erro ao processar checkout. Tente novamente.');
      return false;
    } finally {
      // Reset processing after navigation
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    }
  };

  // Função para continuar checkout a partir de qualquer ponto
  const continueCheckout = (targetStep: 'plan' | 'coupon' | 'summary' | 'payment') => {
    console.log('🛒 [SimplifiedCheckout] Continuando checkout para:', targetStep);

    if (!isLoggedIn) {
      navigate('/cadastro?redirect=/selecionar-plano');
      return;
    }

    const routes = {
      plan: '/selecionar-plano',
      coupon: '/checkout/cupom', 
      summary: '/checkout/resumo',
      payment: '/checkout'
    };

    navigate(routes[targetStep]);
  };

  return {
    proceedToCheckout,
    continueCheckout,
    isProcessing,
    canProceed: isLoggedIn && cartItems.length > 0,
    cartCount: cartItems.length
  };
};

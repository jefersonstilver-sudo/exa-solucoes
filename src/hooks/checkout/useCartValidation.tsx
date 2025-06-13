
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCartValidation = (cartItems: CartItem[]) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // Verificar se está em uma rota de checkout
  const isCheckoutRoute = location.pathname.includes('/checkout') || 
                         location.pathname.includes('/plano') ||
                         location.pathname.includes('/resumo');
  
  // Verifica se o carrinho está vazio, mas não interfere no fluxo de checkout
  useEffect(() => {
    // Verificação inicial - apenas executa uma vez após o carregamento
    if (!initialCheckDone) {
      setInitialCheckDone(true);
      return;
    }
    
    // CORREÇÃO: Não validar durante fluxo de checkout para evitar redirecionamentos indevidos
    if (isCheckoutRoute) {
      console.log("useCartValidation: Ignorando validação durante checkout");
      return;
    }
    
    // Só valida depois que a verificação inicial foi concluída e fora do checkout
    console.log("useCartValidation: Verificando carrinho", cartItems.length);
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar a compra.",
        variant: "destructive"
      });
      // CORREÇÃO: Usar rota padronizada da loja
      navigate('/loja');
    }
  }, [cartItems, navigate, toast, initialCheckDone, isCheckoutRoute]);
};

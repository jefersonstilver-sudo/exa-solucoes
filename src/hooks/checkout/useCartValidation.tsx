
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { toast } from 'sonner';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCartValidation = (cartItems: CartItem[]) => {
  const { toast: shadcnToast } = useToast();
  const navigate = useNavigate();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  
  // CORREÇÃO: Validação muito menos agressiva
  useEffect(() => {
    // Verificação inicial - apenas executa uma vez após o carregamento
    if (!initialCheckDone) {
      // Aguardar um pouco para permitir que o carrinho carregue
      setTimeout(() => {
        setInitialCheckDone(true);
      }, 2000); // 2 segundos para carregar
      return;
    }
    
    // CORREÇÃO: Só valida depois que a verificação inicial foi concluída E se ainda não mostrou warning
    console.log("useCartValidation: Verificando carrinho", cartItems.length);
    if (cartItems.length === 0 && !hasShownWarning) {
      console.log("useCartValidation: Carrinho vazio detectado, mostrando aviso");
      
      // Usar sonner toast em vez de shadcn para consistência
      toast.error("Carrinho vazio detectado", {
        description: "Adicione itens ao carrinho antes de finalizar a compra.",
        duration: 5000,
        action: {
          label: "Ir para Loja",
          onClick: () => navigate('/paineis-digitais/loja')
        }
      });
      
      setHasShownWarning(true);
      
      // CORREÇÃO: Não redirecionar automaticamente - dar chance do usuário decidir
      // navigate('/paineis-digitais/loja');
    } else if (cartItems.length > 0 && hasShownWarning) {
      // Reset warning se o carrinho foi preenchido
      setHasShownWarning(false);
    }
  }, [cartItems, navigate, initialCheckDone, hasShownWarning]);

  return { initialCheckDone, hasShownWarning };
};

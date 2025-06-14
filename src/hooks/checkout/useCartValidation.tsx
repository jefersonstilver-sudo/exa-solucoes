
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCartValidation = (cartItems: CartItem[]) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // Verifica se o carrinho está vazio, mas apenas após a montagem inicial do componente
  useEffect(() => {
    // Verificação inicial - apenas executa uma vez após o carregamento
    if (!initialCheckDone) {
      setInitialCheckDone(true);
      return;
    }
    
    // Só valida depois que a verificação inicial foi concluída
    console.log("useCartValidation: Verificando carrinho", cartItems.length);
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar a compra.",
        variant: "destructive"
      });
      navigate('/paineis-digitais/loja');
    }
  }, [cartItems, navigate, toast, initialCheckDone]);
};

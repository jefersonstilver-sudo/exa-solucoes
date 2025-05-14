
import { Panel } from '@/types/panel';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface ValidationOptions {
  acceptTerms: boolean;
  unavailablePanels: string[];
  sessionUser: any;
  isSDKLoaded: boolean;
  cartItems: CartItem[];
}

export const usePaymentValidation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePaymentRequirements = ({
    acceptTerms,
    unavailablePanels,
    sessionUser,
    isSDKLoaded,
    cartItems
  }: ValidationOptions): boolean => {
    // Validar aceitação dos termos e condições
    if (!acceptTerms) {
      toast({
        variant: "destructive",
        title: "Termos e condições",
        description: "Você precisa aceitar os termos e condições para continuar.",
      });
      return false;
    }
    
    // Validar disponibilidade dos painéis selecionados
    if (unavailablePanels.length > 0) {
      toast({
        variant: "destructive",
        title: "Painéis indisponíveis",
        description: "Alguns painéis não estão disponíveis para o período selecionado.",
      });
      return false;
    }
    
    // Validar autenticação do usuário
    if (!sessionUser) {
      toast({
        variant: "destructive",
        title: "Acesso restrito",
        description: "Você precisa estar logado para finalizar a compra.",
      });
      navigate('/login?redirect=/checkout');
      return false;
    }
    
    // Validar carregamento do SDK de pagamento
    if (!isSDKLoaded) {
      toast({
        variant: "destructive",
        title: "Erro no checkout",
        description: "Aguarde o carregamento do sistema de pagamento ou recarregue a página.",
      });
      return false;
    }

    // Verificar se existem itens no carrinho
    if (cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrinho vazio",
        description: "Adicione painéis ao seu carrinho para finalizar a compra.",
      });
      navigate('/paineis-digitais/loja');
      return false;
    }

    return true;
  };

  return { validatePaymentRequirements };
};

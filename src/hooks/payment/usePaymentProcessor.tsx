
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { usePaymentValidation } from './usePaymentValidation';
import { usePaymentSimulator } from './usePaymentSimulator';
import { useOrderCreation } from './useOrderCreation';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { MP_PUBLIC_KEY } from '@/constants/checkoutConstants';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface PaymentOptions {
  totalPrice: number;
  selectedPlan: number;
  cartItems: CartItem[];
  startDate: Date;
  endDate: Date;
  couponId: string | null;
  acceptTerms: boolean;
  unavailablePanels: string[];
  sessionUser: any;
  handleClearCart: () => void;
}

export const usePaymentProcessor = () => {
  const { toast } = useToast();
  const { validatePaymentRequirements } = usePaymentValidation();
  const { isCreatingPayment, setIsCreatingPayment, simulateSuccessfulPayment } = usePaymentSimulator();
  const { createOrder } = useOrderCreation();
  
  // Inicializa MercadoPago
  const { isSDKLoaded } = useMercadoPago({
    publicKey: MP_PUBLIC_KEY
  });

  // Cria pagamento e gerencia o processo de checkout
  const createPayment = async ({
    totalPrice,
    selectedPlan,
    cartItems,
    startDate,
    endDate,
    couponId,
    acceptTerms,
    unavailablePanels,
    sessionUser,
    handleClearCart
  }: PaymentOptions) => {
    setIsCreatingPayment(true);
    
    try {
      // Valida todos os requisitos antes de prosseguir
      const isValid = validatePaymentRequirements({
        acceptTerms, 
        unavailablePanels, 
        sessionUser, 
        isSDKLoaded,
        cartItems
      });
      
      if (!isValid) {
        setIsCreatingPayment(false);
        return;
      }
      
      // Cria pedido no banco de dados
      const pedido = await createOrder({
        sessionUser,
        cartItems,
        selectedPlan,
        totalPrice,
        couponId,
        startDate,
        endDate
      });
      
      // Apenas para demonstração, simula pagamento bem-sucedido
      await simulateSuccessfulPayment(
        pedido.id, 
        cartItems, 
        sessionUser, 
        startDate, 
        endDate, 
        handleClearCart
      );
      
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error.message || "Houve um problema ao processar o pagamento.",
      });
      setIsCreatingPayment(false);
    }
  };

  return {
    isCreatingPayment,
    createPayment
  };
};

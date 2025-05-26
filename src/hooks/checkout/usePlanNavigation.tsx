
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { PlanKey } from '@/types/checkout';

export const usePlanNavigation = (
  selectedPlan: PlanKey | null,
  savePlanToStorage: (plan: PlanKey) => void
) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Função simplificada para ir direto para cupom
  const handleGoToCoupon = () => {
    console.log("PlanSelection: Ir para cupom - plano selecionado:", selectedPlan);
    
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Escolha um plano antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }

    // Salvar plano selecionado
    savePlanToStorage(selectedPlan);

    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT, 
      LogLevel.INFO, 
      "Navegando para cupom", 
      { selectedPlan, timestamp: Date.now() }
    );
    
    navigate('/checkout/cupom');
  };

  // Função simplificada para prosseguir (também vai para cupom)
  const handleProceed = () => {
    console.log("PlanSelection: Prosseguindo com plano selecionado:", selectedPlan);
    
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Escolha um plano antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }
    
    // Salvar plano selecionado
    savePlanToStorage(selectedPlan);
    
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT, 
      LogLevel.INFO, 
      "Navegando para etapa de cupom após seleção de plano", 
      { selectedPlan, timestamp: Date.now() }
    );
    
    navigate('/checkout/cupom');
  };

  return {
    handleGoToCoupon,
    handleProceed
  };
};

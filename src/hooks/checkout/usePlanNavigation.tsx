
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { PlanKey } from '@/types/checkout';
import { useCallback } from 'react';

export const usePlanNavigation = (
  selectedPlan: PlanKey | null,
  savePlanToStorage: (plan: PlanKey) => void
) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Função para ir direto para cupom com navegação forçada
  const handleGoToCoupon = useCallback(() => {
    console.log("🎯 CUPOM NAVIGATION: Botão 'Ir para Cupom' clicado");
    console.log("🎯 CUPOM NAVIGATION: Plano selecionado:", selectedPlan);
    
    if (!selectedPlan) {
      console.log("🎯 CUPOM NAVIGATION: Erro - Nenhum plano selecionado");
      toast({
        title: "Selecione um plano",
        description: "Escolha um plano antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }

    // Salvar plano selecionado
    savePlanToStorage(selectedPlan);
    console.log("🎯 CUPOM NAVIGATION: Plano salvo no storage:", selectedPlan);

    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT, 
      LogLevel.INFO, 
      "CUPOM BUTTON: Iniciando navegação para cupom", 
      { selectedPlan, timestamp: Date.now(), source: 'handleGoToCoupon' }
    );
    
    try {
      console.log("🎯 CUPOM NAVIGATION: Navegando para /checkout/cupom");
      // CORREÇÃO: Usar a rota correta que agora existe no main.tsx
      navigate('/checkout/cupom');
      console.log("🎯 CUPOM NAVIGATION: ✅ Navegação executada via React Router");
      
    } catch (error) {
      console.error("🎯 CUPOM NAVIGATION: Erro na navegação:", error);
      // Navegação de emergência como fallback
      window.location.href = '/checkout/cupom';
    }
  }, [selectedPlan, savePlanToStorage, navigate, toast]);

  // Função simplificada para prosseguir (também vai para cupom)
  const handleProceed = useCallback(() => {
    console.log("🎯 PROCEED NAVIGATION: Botão 'Prosseguir' clicado");
    handleGoToCoupon(); // Reutiliza a mesma lógica
  }, [handleGoToCoupon]);

  return {
    handleGoToCoupon,
    handleProceed
  };
};

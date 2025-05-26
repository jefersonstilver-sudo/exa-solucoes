
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
      console.log("🎯 CUPOM NAVIGATION: Tentando navegar via React Router...");
      navigate('/checkout/cupom');
      
      // Fallback: verificar se a navegação funcionou após 1 segundo
      setTimeout(() => {
        if (window.location.pathname !== '/checkout/cupom') {
          console.log("🎯 CUPOM NAVIGATION: React Router falhou, usando navegação forçada");
          window.location.href = '/checkout/cupom';
        } else {
          console.log("🎯 CUPOM NAVIGATION: ✅ Navegação bem-sucedida via React Router");
        }
      }, 1000);
      
    } catch (error) {
      console.error("🎯 CUPOM NAVIGATION: Erro na navegação:", error);
      // Navegação de emergência
      window.location.href = '/checkout/cupom';
    }
  }, [selectedPlan, savePlanToStorage, navigate, toast]);

  // Função simplificada para prosseguir (também vai para cupom)
  const handleProceed = useCallback(() => {
    console.log("🎯 PROCEED NAVIGATION: Botão 'Prosseguir' clicado");
    console.log("🎯 PROCEED NAVIGATION: Plano selecionado:", selectedPlan);
    
    if (!selectedPlan) {
      console.log("🎯 PROCEED NAVIGATION: Erro - Nenhum plano selecionado");
      toast({
        title: "Selecione um plano",
        description: "Escolha um plano antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }
    
    // Salvar plano selecionado
    savePlanToStorage(selectedPlan);
    console.log("🎯 PROCEED NAVIGATION: Plano salvo no storage:", selectedPlan);
    
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT, 
      LogLevel.INFO, 
      "PROCEED BUTTON: Navegando para etapa de cupom após seleção de plano", 
      { selectedPlan, timestamp: Date.now(), source: 'handleProceed' }
    );
    
    try {
      console.log("🎯 PROCEED NAVIGATION: Tentando navegar via React Router...");
      navigate('/checkout/cupom');
      
      // Fallback: verificar se a navegação funcionou após 1 segundo
      setTimeout(() => {
        if (window.location.pathname !== '/checkout/cupom') {
          console.log("🎯 PROCEED NAVIGATION: React Router falhou, usando navegação forçada");
          window.location.href = '/checkout/cupom';
        } else {
          console.log("🎯 PROCEED NAVIGATION: ✅ Navegação bem-sucedida via React Router");
        }
      }, 1000);
      
    } catch (error) {
      console.error("🎯 PROCEED NAVIGATION: Erro na navegação:", error);
      // Navegação de emergência
      window.location.href = '/checkout/cupom';
    }
  }, [selectedPlan, savePlanToStorage, navigate, toast]);

  return {
    handleGoToCoupon,
    handleProceed
  };
};

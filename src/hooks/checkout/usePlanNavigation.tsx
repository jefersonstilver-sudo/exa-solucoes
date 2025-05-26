
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

  // Função para navegação segura com múltiplos fallbacks
  const navigateSafely = useCallback((targetRoute: string, source: string) => {
    console.log(`🎯 SAFE NAVIGATION: Iniciando navegação de ${source} para ${targetRoute}`);
    console.log(`🎯 SAFE NAVIGATION: URL atual: ${window.location.href}`);
    console.log(`🎯 SAFE NAVIGATION: Pathname atual: ${window.location.pathname}`);
    
    // Log da tentativa de navegação
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT, 
      LogLevel.INFO, 
      `${source}: Tentando navegar para ${targetRoute}`, 
      { 
        currentPath: window.location.pathname,
        targetRoute,
        source,
        timestamp: Date.now() 
      }
    );
    
    try {
      console.log(`🎯 SAFE NAVIGATION: Método 1 - Tentando React Router...`);
      navigate(targetRoute);
      
      // Verificação após um tempo para garantir que funcionou
      setTimeout(() => {
        console.log(`🎯 SAFE NAVIGATION: Verificando navegação...`);
        console.log(`🎯 SAFE NAVIGATION: Pathname após navigate: ${window.location.pathname}`);
        
        if (window.location.pathname !== targetRoute) {
          console.log(`🎯 SAFE NAVIGATION: ⚠️ React Router falhou, usando fallback`);
          logCheckoutEvent(
            CheckoutEvent.NAVIGATION_EVENT, 
            LogLevel.WARNING, 
            `${source}: React Router falhou, usando window.location`, 
            { targetRoute, fallback: true }
          );
          
          // Fallback direto
          window.location.href = targetRoute;
        } else {
          console.log(`🎯 SAFE NAVIGATION: ✅ Navegação bem-sucedida via React Router`);
          logCheckoutEvent(
            CheckoutEvent.NAVIGATION_EVENT, 
            LogLevel.SUCCESS, 
            `${source}: Navegação concluída com sucesso`, 
            { targetRoute }
          );
        }
      }, 100);
      
    } catch (error) {
      console.error(`🎯 SAFE NAVIGATION: ❌ Erro no React Router:`, error);
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT, 
        LogLevel.ERROR, 
        `${source}: Erro na navegação, usando fallback de emergência`, 
        { error: String(error), targetRoute }
      );
      
      // Fallback de emergência
      window.location.href = targetRoute;
    }
  }, [navigate]);

  // Função para ir direto para cupom
  const handleGoToCoupon = useCallback(() => {
    console.log("🎯 CUPOM NAVIGATION: =====================================");
    console.log("🎯 CUPOM NAVIGATION: Botão 'Ir para Cupom' clicado");
    console.log("🎯 CUPOM NAVIGATION: selectedPlan:", selectedPlan);
    console.log("🎯 CUPOM NAVIGATION: savePlanToStorage disponível:", !!savePlanToStorage);
    
    if (!selectedPlan) {
      console.log("🎯 CUPOM NAVIGATION: ❌ Erro - Nenhum plano selecionado");
      toast({
        title: "Selecione um plano",
        description: "Escolha um plano antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }

    // Salvar plano selecionado
    console.log("🎯 CUPOM NAVIGATION: Salvando plano no storage...");
    savePlanToStorage(selectedPlan);
    console.log("🎯 CUPOM NAVIGATION: ✅ Plano salvo no storage:", selectedPlan);

    // Navegar para cupom
    navigateSafely('/checkout/cupom', 'CUPOM BUTTON');
    
  }, [selectedPlan, savePlanToStorage, navigateSafely, toast]);

  // Função para prosseguir (também vai para cupom)
  const handleProceed = useCallback(() => {
    console.log("🎯 PROCEED NAVIGATION: =====================================");
    console.log("🎯 PROCEED NAVIGATION: Botão 'Prosseguir' clicado");
    console.log("🎯 PROCEED NAVIGATION: selectedPlan:", selectedPlan);
    
    if (!selectedPlan) {
      console.log("🎯 PROCEED NAVIGATION: ❌ Erro - Nenhum plano selecionado");
      toast({
        title: "Selecione um plano",
        description: "Escolha um plano antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }
    
    // Salvar plano selecionado
    console.log("🎯 PROCEED NAVIGATION: Salvando plano no storage...");
    savePlanToStorage(selectedPlan);
    console.log("🎯 PROCEED NAVIGATION: ✅ Plano salvo no storage:", selectedPlan);
    
    // Navegar para cupom
    navigateSafely('/checkout/cupom', 'PROCEED BUTTON');
    
  }, [selectedPlan, savePlanToStorage, navigateSafely, toast]);

  return {
    handleGoToCoupon,
    handleProceed
  };
};

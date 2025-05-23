
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import PlanLoginNotification from '@/components/checkout/PlanLoginNotification';
import PlanSelectionContent from '@/components/checkout/PlanSelectionContent';
import PlanLoadingIndicator from '@/components/checkout/PlanLoadingIndicator';
import { useUserSession } from '@/hooks/useUserSession';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { usePlanAuthCheck } from '@/hooks/checkout/usePlanAuthCheck';
import { useCartVerification } from '@/hooks/checkout/useCartVerification';
import { usePlanSelection } from '@/hooks/checkout/usePlanSelection';
import { supabase } from '@/integrations/supabase/client';

const PlanSelection = () => {
  // Estados de autenticação - deixar o estado de sessão primeiro para garantir inicialização correta
  const { user, isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  
  // Custom hooks para gerenciar diferentes aspectos da página
  const { isAuthVerified, isPageLoading, setIsPageLoading, forceRerender, setForceRerender, checkAuthentication } = usePlanAuthCheck();
  const { hasCart, initialLoadDone } = useCartVerification(isAuthVerified);
  const { selectedPlan, setSelectedPlan, PLANS, cartItems, calculateEstimatedPrice, handleProceed } = usePlanSelection(hasCart);
  
  // Log de informação quando o componente é montado
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "PlanSelection: Componente montado",
      { isLoggedIn, userId: user?.id || 'não autenticado' }
    );
  }, [isLoggedIn, user]);

  // Verificação de autenticação e verificação do carrinho juntas
  useEffect(() => {
    // Só executar quando a autenticação estiver verificada
    if (!isAuthVerified) return;
    
    const verifyCartAndAuth = async () => {
      try {
        // Primeiro verificar autenticação
        const isAuthenticated = await checkAuthentication();
        
        console.log("PlanSelection: Verificação de autenticação concluída:", isAuthenticated);
        
        // Atualizar estado de carregamento após verificações
        setIsPageLoading(false);
      } catch (error) {
        console.error("Erro no processo de verificação:", error);
        setIsPageLoading(false);
      }
    };
    
    verifyCartAndAuth();
  }, [isAuthVerified, checkAuthentication, setIsPageLoading]);
  
  // Loading screen while checking session or cart
  if (isSessionLoading || isPageLoading) {
    return <PlanLoadingIndicator />;
  }
  
  // Exibir botão de login se não estiver logado, independentemente do carregamento do carrinho
  if (!isLoggedIn) {
    // Verificar uma última vez se realmente não há sessão
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Se houver sessão mas isLoggedIn for falso, forçar recarregamento
        console.log("Inconsistência detectada: sessão existe mas isLoggedIn é falso. Recarregando...");
        setForceRerender(prev => prev + 1);
      }
    });
    
    return (
      <Layout>
        <PlanLoginNotification />
      </Layout>
    );
  }
  
  return (
    <Layout>
      <PlanSelectionContent
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        plans={PLANS}
        panelCount={cartItems.length}
        onProceed={handleProceed}
        totalPrice={calculateEstimatedPrice()}
      />
    </Layout>
  );
};

export default PlanSelection;

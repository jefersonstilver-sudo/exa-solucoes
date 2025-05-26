
import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import PlanLoginNotification from '@/components/checkout/PlanLoginNotification';
import PlanSelectionContent from '@/components/checkout/PlanSelectionContent';
import PlanLoadingIndicator from '@/components/checkout/PlanLoadingIndicator';
import { useUserSession } from '@/hooks/useUserSession';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { usePlanSelection } from '@/hooks/checkout/usePlanSelection';
import { useCartVerification } from '@/hooks/checkout/useCartVerification';

const PlanSelection = () => {
  // Estados de autenticação - deixar o estado de sessão primeiro para garantir inicialização correta
  const { user, isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  
  // Para evitar re-renderizações desnecessárias
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [authVerified, setAuthVerified] = useState(false);
  
  // Estado do carrinho
  const { hasCart, initialLoadDone } = useCartVerification(authVerified);
  
  // Seleção de plano - somente inicializar quando o resto estiver carregado
  const { 
    selectedPlan, 
    setSelectedPlan, 
    PLANS, 
    cartItems, 
    calculateEstimatedPrice, 
    handleProceed,
    handleGoToCoupon
  } = usePlanSelection(hasCart);
  
  // Log de informação quando o componente é montado (apenas uma vez)
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "PlanSelection: Componente montado",
      { isLoggedIn, userId: user?.id || 'não autenticado' }
    );
    
    // Verificar e marcar autenticação como verificada quando o carregamento da sessão terminar
    if (!isSessionLoading) {
      console.log("Sessão inicializada, autenticação verificada:", isLoggedIn);
      setAuthVerified(true);
      
      // Se já estiver autenticado, podemos continuar com a próxima etapa
      if (isLoggedIn) {
        setIsPageLoading(false);
      } else {
        // Se não estiver autenticado, ainda não é necessário carregar outros dados
        setIsPageLoading(false);
      }
    }
  }, [isSessionLoading, isLoggedIn, user]);
  
  // Memoizar status de carregamento para evitar re-renderizações desnecessárias
  const isLoading = useMemo(() => {
    return isSessionLoading || isPageLoading;
  }, [isSessionLoading, isPageLoading]);
  
  // Loading screen while checking session or cart
  if (isLoading) {
    return <PlanLoadingIndicator />;
  }
  
  // Exibir botão de login se não estiver logado, independentemente do carregamento do carrinho
  if (!isLoggedIn) {
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
        onGoToCoupon={handleGoToCoupon}
        totalPrice={calculateEstimatedPrice()}
      />
    </Layout>
  );
};

export default PlanSelection;

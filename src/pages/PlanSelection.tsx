
import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import PlanLoginNotification from '@/components/checkout/PlanLoginNotification';
import PlanSelectionContent from '@/components/checkout/PlanSelectionContent';
import PlanLoadingIndicator from '@/components/checkout/PlanLoadingIndicator';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import { useUserSession } from '@/hooks/useUserSession';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { usePlanSelection } from '@/hooks/checkout/usePlanSelection';
import { useCartVerification } from '@/hooks/checkout/useCartVerification';
import { logPriceCalculation } from '@/utils/auditLogger';
import { useCartManager } from '@/hooks/useCartManager';

const PlanSelection = () => {
  const { user, isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [authVerified, setAuthVerified] = useState(false);
  
  // Usar useCartManager em vez de usePlanSelection
  const { 
    cartItems, 
    selectedPlan, 
    setSelectedPlan,
    initialLoadDone 
  } = useCartManager();
  
  const { hasCart } = useCartVerification(authVerified);
  
  const { 
    PLANS, 
    calculateEstimatedPrice,
    handleGoToCoupon,
    isLoading: isPlanLoading
  } = usePlanSelection(hasCart);
  
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "PlanSelection: Componente montado com CartManager",
      { isLoggedIn, userId: user?.id || 'não autenticado' }
    );
    
    if (!isSessionLoading) {
      setAuthVerified(true);
      setIsPageLoading(false);
    }
  }, [isSessionLoading, isLoggedIn, user]);

  // Log detalhado quando cartItems mudam
  useEffect(() => {
    if (cartItems.length > 0) {
      console.log("📊 [PlanSelection] Cart items atualizados:", {
        cartItemsLength: cartItems.length,
        selectedPlan,
        cartDetails: cartItems.map(item => ({
          panelId: item.panel.id,
          buildingName: item.panel.buildings?.nome,
          preco_base: item.panel.buildings?.preco_base,
          price: item.price
        }))
      });

      // Log para auditoria
      logPriceCalculation('PlanSelection', {
        cartItemsCount: cartItems.length,
        selectedPlan,
        cartItems: cartItems.map(item => ({
          panelId: item.panel.id,
          buildingName: item.panel.buildings?.nome,
          preco_base: item.panel.buildings?.preco_base,
          price: item.price
        }))
      });
    }
  }, [cartItems, selectedPlan]);
  
  const isLoading = useMemo(() => {
    return isSessionLoading || isPageLoading || !initialLoadDone;
  }, [isSessionLoading, isPageLoading, initialLoadDone]);
  
  if (isLoading) {
    return <PlanLoadingIndicator />;
  }
  
  if (!isLoggedIn) {
    return (
      <Layout>
        <PlanLoginNotification />
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
          {/* Unified Progress Header */}
          <div className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 mb-6 sm:mb-8">
            <UnifiedCheckoutProgress currentStep={0} />
          </div>

          {/* Main Content */}
          <PlanSelectionContent
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            plans={PLANS}
            panelCount={cartItems.length}
            totalPrice={calculateEstimatedPrice()}
            onContinue={handleGoToCoupon}
            cartItems={cartItems}
          />
        </div>
      </div>
    </Layout>
  );
};

export default PlanSelection;

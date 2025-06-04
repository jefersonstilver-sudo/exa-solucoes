
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

const PlanSelection = () => {
  const { user, isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [authVerified, setAuthVerified] = useState(false);
  
  const { hasCart, initialLoadDone } = useCartVerification(authVerified);
  
  const { 
    selectedPlan, 
    setSelectedPlan, 
    PLANS, 
    cartItems, 
    calculateEstimatedPrice,
    handleGoToCoupon
  } = usePlanSelection(hasCart);
  
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "PlanSelection: Componente montado",
      { isLoggedIn, userId: user?.id || 'não autenticado' }
    );
    
    if (!isSessionLoading) {
      setAuthVerified(true);
      setIsPageLoading(false);
    }
  }, [isSessionLoading, isLoggedIn, user]);
  
  const isLoading = useMemo(() => {
    return isSessionLoading || isPageLoading;
  }, [isSessionLoading, isPageLoading]);
  
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
          {/* Unified Progress Header - SEMPRE na mesma posição */}
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

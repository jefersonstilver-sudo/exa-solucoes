
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
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PlanSelection = () => {
  const { user, isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const navigate = useNavigate();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [authVerified, setAuthVerified] = useState(false);
  
  // CORREÇÃO: Validação menos restritiva
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
      "PlanSelection: Componente montado - SISTEMA CORRIGIDO",
      { 
        isLoggedIn, 
        userId: user?.id || 'não autenticado',
        cartItemsCount: cartItems?.length || 0,
        path: window.location.pathname
      }
    );
    
    if (!isSessionLoading) {
      setAuthVerified(true);
      setIsPageLoading(false);
    }
  }, [isSessionLoading, isLoggedIn, user]);

  // CORREÇÃO: Validação de carrinho mais flexível
  useEffect(() => {
    if (!isSessionLoading && isLoggedIn && initialLoadDone) {
      // Tentar recuperar carrinho do localStorage se estiver vazio
      if (!cartItems || cartItems.length === 0) {
        try {
          const savedCart = localStorage.getItem('checkout_cart');
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (parsedCart && parsedCart.length > 0) {
              console.log('🔄 [PlanSelection] Carrinho recuperado do localStorage:', parsedCart.length);
              toast.info(`Carrinho recuperado: ${parsedCart.length} item(s)`);
              return; // Não redirecionar se conseguiu recuperar
            }
          }
        } catch (error) {
          console.error('Erro ao recuperar carrinho:', error);
        }

        // CORREÇÃO: Aviso mais amigável sem redirecionamento forçado
        console.log('⚠️ [PlanSelection] Carrinho vazio detectado');
        toast.error("Seu carrinho está vazio. Você será redirecionado para adicionar painéis.", {
          duration: 5000,
          action: {
            label: "Ir para Loja",
            onClick: () => navigate('/paineis-digitais/loja')
          }
        });

        // Redirecionamento com delay para dar tempo ao usuário
        setTimeout(() => {
          navigate('/paineis-digitais/loja');
        }, 6000);
      }
    }
  }, [isSessionLoading, isLoggedIn, initialLoadDone, cartItems, navigate]);

  // Log detalhado quando cartItems mudam
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      console.log("📊 [PlanSelection] SISTEMA CORRIGIDO - Cart items atualizados:", {
        cartItemsLength: cartItems.length,
        selectedPlan,
        cartDetails: cartItems.map(item => ({
          panelId: item.panel?.id,
          buildingName: item.panel?.buildings?.nome,
          preco_base: item.panel?.buildings?.preco_base
          // REMOVIDO: price - será calculado dinamicamente
        }))
      });

      // Log para auditoria
      logPriceCalculation('PlanSelection', {
        cartItemsCount: cartItems.length,
        selectedPlan,
        cartItems: cartItems.map(item => ({
          panelId: item.panel?.id,
          buildingName: item.panel?.buildings?.nome,
          preco_base: item.panel?.buildings?.preco_base
          // REMOVIDO: price - será calculado dinamicamente
        }))
      });
    }
  }, [cartItems, selectedPlan]);
  
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
          {/* Unified Progress Header */}
          <div className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 mb-6 sm:mb-8">
            <UnifiedCheckoutProgress currentStep={0} />
          </div>

          {/* Main Content - SISTEMA CORRIGIDO */}
          <PlanSelectionContent
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            plans={PLANS}
            panelCount={cartItems?.length || 0}
            totalPrice={calculateEstimatedPrice()}
            onContinue={handleGoToCoupon}
            cartItems={cartItems || []}
          />
        </div>
      </div>
    </Layout>
  );
};

export default PlanSelection;


import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
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
import { planoEssencialSchema, planoExpansaoSchema, planoPremiumSchema, planoDominioSchema } from '@/components/seo/productSchemas';

const PlanSelection = () => {
  const { user, isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const navigate = useNavigate();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [authVerified, setAuthVerified] = useState(false);
  
  // 🚨 CRITICAL: Verificar se é admin (bloquear checkout para admins)
  const isAdminRole = user?.role && user.role !== 'client';
  
  console.log('🔐 [PlanSelection] Role verificado:', { 
    role: user?.role, 
    isAdminRole, 
    canCheckout: !isAdminRole 
  });
  
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
          preco_base: item.panel?.buildings?.preco_base,
          price: item.price
        }))
      });

      // Log para auditoria
      logPriceCalculation('PlanSelection', {
        cartItemsCount: cartItems.length,
        selectedPlan,
        cartItems: cartItems.map(item => ({
          panelId: item.panel?.id,
          buildingName: item.panel?.buildings?.nome,
          preco_base: item.panel?.buildings?.preco_base,
          price: item.price
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
  
  // 🚨 BLOQUEAR admins de acessar checkout
  if (isAdminRole) {
    return (
      <Layout>
        <SEO title="Acesso Restrito - EXA Mídia" description="Área restrita" />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🚫 Acesso Restrito
              </h2>
              <p className="text-gray-600 mb-4">
                Contas administrativas não podem realizar pedidos.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Tipo de conta:</strong> {user?.role || 'Administrativa'}
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Use uma conta de cliente para realizar pedidos.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Ir para Painel Administrativo
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <SEO
        title="Planos de Publicidade em Elevadores | A partir de R$297/mês - EXA Foz do Iguaçu"
        description="Escolha seu plano: 1, 3, 6 ou 12 prédios premium. Sem taxa de setup, cancele quando quiser. Alcance milhares de moradores classe A/B. Calcule seu ROI agora."
        keywords="preço publicidade elevador, planos anúncio prédio, quanto custa painel digital, valor publicidade indoor"
        structuredData={[planoEssencialSchema, planoExpansaoSchema, planoPremiumSchema, planoDominioSchema]}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-4">
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

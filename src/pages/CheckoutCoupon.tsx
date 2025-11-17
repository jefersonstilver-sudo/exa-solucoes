
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CouponStep from '@/components/checkout/CouponStep';
import CheckoutLayout from '@/components/checkout/CheckoutLayout';
import CheckoutNavigation from '@/components/checkout/CheckoutNavigation';
import { useCheckout } from '@/hooks/useCheckout';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/priceUtils';
import { toast } from 'sonner';

const CheckoutCoupon = () => {
  const navigate = useNavigate();
  const {
    couponCode,
    setCouponCode,
    validateCoupon,
    isValidatingCoupon,
    couponMessage,
    couponValid,
    removeCoupon,
    handleNextStep,
    handlePrevStep,
    isNextEnabled,
    isCreatingPayment,
    isNavigating,
    cartItems,
    selectedPlan,
    calculateTotalPrice,
    couponCategoria
  } = useCheckout();
  
  const { isSuperAdmin } = useAuth();
  
  // Calcular total em tempo real
  const currentTotal = calculateTotalPrice();
  
  // Detectar cupom cortesia
  const isCortesia = couponCategoria === 'cortesia' || couponCode?.toUpperCase().trim() === 'CORTESIA_ADMIN';
  
  // CRÍTICO: Verificar se dados do checkout estão disponíveis
  useEffect(() => {
    console.log("🛒 [CheckoutCoupon] Verificando dados:", {
      cartItemsCount: cartItems?.length || 0,
      selectedPlan,
      currentTotal,
      hasCartItems: !!cartItems && cartItems.length > 0,
      timestamp: new Date().toISOString()
    });

    // Se não há itens no carrinho, tentar recuperar
    if (!cartItems || cartItems.length === 0) {
      console.error("❌ [CheckoutCoupon] Carrinho vazio - redirecionando");
      toast.error("Seu carrinho está vazio. Adicione painéis antes de continuar.");
      setTimeout(() => navigate('/checkout'), 500);
      return;
    }

    // Se não há plano selecionado, tentar recuperar do localStorage
    if (!selectedPlan) {
      const savedPlan = localStorage.getItem('selectedPlan');
      console.warn("⚠️ [CheckoutCoupon] Plano não selecionado. Tentando recuperar:", savedPlan);
      
      if (!savedPlan) {
        toast.error("Selecione um plano antes de continuar.");
        setTimeout(() => navigate('/checkout/plano'), 500);
      }
    }

    // Verificar se o cálculo está funcionando
    if (cartItems.length > 0 && selectedPlan && currentTotal === 0) {
      console.error("❌ [CheckoutCoupon] Total é R$ 0,00 com dados válidos:", {
        cartItems: cartItems.map(item => ({
          id: item.panel.id,
          preco_base: item.panel.buildings?.preco_base
        })),
        selectedPlan
      });
    }
  }, [cartItems, selectedPlan, currentTotal, navigate]);
  
  // Função wrapper para validateCoupon
  const handleValidateCoupon = () => {
    if (couponCode && selectedPlan) {
      console.log('[CheckoutCoupon] Iniciando validação de cupom:', { 
        couponCode, 
        selectedPlan, 
        currentTotal,
        cartItemsCount: cartItems.length,
        isSuperAdmin
      });
      validateCoupon(couponCode, selectedPlan);
    } else {
      console.warn('[CheckoutCoupon] Dados insuficientes para validação:', { couponCode, selectedPlan });
    }
  };

  return (
    <CheckoutLayout currentStep={1} maxWidth="4xl">
      <div className="space-y-6 pb-20">
        {/* Main Content */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg border p-4 sm:p-6">
          <CouponStep
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            validateCoupon={handleValidateCoupon}
            isValidatingCoupon={isValidatingCoupon}
            couponMessage={couponMessage}
            couponValid={couponValid}
            removeCoupon={removeCoupon}
          />
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg border p-3 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">Resumo do Pedido</h3>
          
          {/* Badge Cortesia - Design Corporativo */}
          {isCortesia && couponValid && (
            <div className="mb-4 bg-slate-50 border border-slate-300 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-slate-700 rounded">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm sm:text-base">Pedido Cortesia</p>
                  <p className="text-xs sm:text-sm text-slate-600">Isento de cobrança</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Total do pedido:</span>
              <span className="font-medium text-base sm:text-lg">
                {isCortesia && couponValid ? 'R$ 0,00' : formatCurrency(currentTotal)}
              </span>
            </div>
            
            {couponValid && !isCortesia && (
              <div className="flex justify-between text-green-600">
                <span className="text-xs sm:text-sm">Desconto aplicado:</span>
                <span className="font-medium text-sm sm:text-base">Aplicado com sucesso!</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <CheckoutNavigation
          onBack={handlePrevStep}
          onNext={handleNextStep}
          isBackToStore={false}
          isNextEnabled={isNextEnabled}
          isCreatingPayment={isCreatingPayment}
          isNavigating={isNavigating}
          isPaymentStep={false}
          totalPrice={currentTotal}
        />
      </div>
    </CheckoutLayout>
  );
};

export default CheckoutCoupon;

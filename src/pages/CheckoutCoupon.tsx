
import React, { useEffect } from 'react';
import CouponStep from '@/components/checkout/CouponStep';
import CheckoutLayout from '@/components/checkout/CheckoutLayout';
import CheckoutNavigation from '@/components/checkout/CheckoutNavigation';
import { useCheckout } from '@/hooks/useCheckout';
import { useAuth } from '@/hooks/useAuth'; // Adicionar import
import { formatCurrency } from '@/utils/priceUtils';
import { toast } from 'sonner'; // Adicionar import

const CheckoutCoupon = () => {
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
  
  const { isSuperAdmin } = useAuth(); // Adicionar verificação de super admin
  
  // Calcular total em tempo real
  const currentTotal = calculateTotalPrice();
  
  // Detectar cupom cortesia
  const isCortesia = couponCategoria === 'cortesia' || couponCode?.toUpperCase().trim() === 'CORTESIA_ADMIN';
  
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
  
  // Validação de estado crítico
  useEffect(() => {
    if (cartItems.length === 0) {
      console.warn("⚠️ Carrinho vazio na página de cupons");
    }
  }, [cartItems.length]);

  return (
    <CheckoutLayout currentStep={1} maxWidth="4xl">
      {/* Main Content */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg border p-3 sm:p-6 mb-3 sm:mb-6">
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
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg border p-3 sm:p-6 mb-3 sm:mb-6">
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
    </CheckoutLayout>
  );
};

export default CheckoutCoupon;

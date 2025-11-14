
import React, { useEffect } from 'react';
import CouponStep from '@/components/checkout/CouponStep';
import CheckoutLayout from '@/components/checkout/CheckoutLayout';
import CheckoutNavigation from '@/components/checkout/CheckoutNavigation';
import { useCheckout } from '@/hooks/useCheckout';
import { formatCurrency } from '@/utils/priceUtils';

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
        cartItemsCount: cartItems.length 
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
        
        {/* Badge Cortesia */}
        {isCortesia && couponValid && (
          <div className="mb-4 bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-400 rounded-lg p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-pink-500 rounded-full">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-pink-700 text-sm sm:text-lg">🎁 Pedido Cortesia</p>
                <p className="text-xs sm:text-sm text-pink-600">Gratuito - Sem cobrança</p>
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

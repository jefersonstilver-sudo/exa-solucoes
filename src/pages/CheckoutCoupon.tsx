
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
    calculateTotalPrice
  } = useCheckout();
  
  // Calcular total em tempo real
  const currentTotal = calculateTotalPrice();
  
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
      <div className="bg-white rounded-xl shadow-lg border p-6 sm:p-8 mb-6 sm:mb-8">
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
      <div className="bg-white rounded-xl shadow-lg border p-6 sm:p-8 mb-6 sm:mb-8">
        <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total do pedido:</span>
            <span className="font-medium text-lg">
              {formatCurrency(currentTotal)}
            </span>
          </div>
          
          {couponValid && (
            <div className="flex justify-between text-green-600">
              <span>Desconto aplicado:</span>
              <span className="font-medium">Aplicado com sucesso!</span>
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

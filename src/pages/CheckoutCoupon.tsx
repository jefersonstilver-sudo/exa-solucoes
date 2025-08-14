
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import CouponStep from '@/components/checkout/CouponStep';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          {/* Progress Header */}
          <div className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 mb-6 sm:mb-8">
            <UnifiedCheckoutProgress currentStep={1} />
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg border p-6 sm:p-8 mb-6 sm:mb-8">
            <CouponStep
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              validateCoupon={handleValidateCoupon}
              isValidatingCoupon={isValidatingCoupon}
              couponMessage={couponMessage}
              couponValid={couponValid}
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
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutCoupon;

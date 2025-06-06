

import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import CouponStep from '@/components/checkout/CouponStep';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import CheckoutNavigation from '@/components/checkout/CheckoutNavigation';
import { useCheckout } from '@/hooks/useCheckout';
import { formatCurrency } from '@/utils/priceUtils';
import { logPriceCalculation } from '@/utils/auditLogger';

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
    calculateTotalPrice // CORREÇÃO: usar função que sempre recalcula
  } = useCheckout();
  
  // CORREÇÃO: Calcular total em tempo real sempre que cartItems ou selectedPlan mudam
  const currentTotal = calculateTotalPrice();
  
  // Função wrapper para validateCoupon sem parâmetros
  const handleValidateCoupon = () => {
    if (couponCode && selectedPlan) {
      validateCoupon(couponCode, selectedPlan);
    }
  };
  
  // Log detalhado para debug da página de cupons
  useEffect(() => {
    console.log("🏷️ [CheckoutCoupon] ESTADO DA PÁGINA:", {
      cartItemsCount: cartItems.length,
      selectedPlan,
      currentTotal,
      couponValid,
      couponCode,
      timestamp: new Date().toISOString(),
      cartDetails: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        preco_base: item.panel.buildings?.preco_base
      }))
    });

    // Log para auditoria
    if (cartItems.length > 0) {
      logPriceCalculation('CheckoutCoupon', {
        cartItemsCount: cartItems.length,
        selectedPlan,
        currentTotal,
        couponValid,
        couponCode,
        cartItems: cartItems.map(item => ({
          panelId: item.panel.id,
          buildingName: item.panel.buildings?.nome,
          preco_base: item.panel.buildings?.preco_base
        }))
      });
    }
  }, [cartItems, selectedPlan, currentTotal, couponValid, couponCode]);

  // Validação de estado crítico
  useEffect(() => {
    if (cartItems.length === 0) {
      console.warn("⚠️ [CheckoutCoupon] CARRINHO VAZIO na página de cupons!");
    }
    
    if (currentTotal === 0 && cartItems.length > 0) {
      console.error("❌ [CheckoutCoupon] TOTAL ZERO com carrinho populado!", {
        cartItemsCount: cartItems.length,
        selectedPlan,
        cartItems: cartItems.map(item => ({
          panelId: item.panel.id,
          preco_base: item.panel.buildings?.preco_base
        }))
      });
    }
  }, [cartItems.length, currentTotal, selectedPlan]);

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

          {/* Summary Card - USANDO VALOR CALCULADO EM TEMPO REAL */}
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
              
              {/* Debug info para desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                  <div>Cart Items: {cartItems.length}</div>
                  <div>Selected Plan: {selectedPlan}</div>
                  <div>Current Total: {formatCurrency(currentTotal)}</div>
                  <div>Coupon Valid: {couponValid ? 'Sim' : 'Não'}</div>
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


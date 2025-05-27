
import React from 'react';
import { useCheckout } from '@/hooks/useCheckout';
import Layout from '@/components/layout/Layout';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import StepRenderer from '@/components/checkout/StepRenderer';
import CheckoutContainer from '@/components/checkout/CheckoutContainer';
import PaymentGateway from '@/components/checkout/payment/PaymentGateway';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

const Checkout = () => {
  const {
    step,
    STEPS,
    selectedPlan,
    setSelectedPlan,
    couponCode,
    setCouponCode,
    couponDiscount,
    couponMessage,
    couponValid,
    isValidatingCoupon,
    acceptTerms,
    setAcceptTerms,
    isCreatingPayment,
    isNavigating,
    unavailablePanels,
    cartItems,
    validateCoupon,
    handleNextStep,
    handlePrevStep,
    isNextEnabled,
    PLANS,
    calculateTotalPrice,
    paymentMethod,
    setPaymentMethod,
    orderId
  } = useCheckout();

  const totalPrice = calculateTotalPrice();

  // MEGA CHECKOUT: Log quando componente é montado
  React.useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `MEGA CHECKOUT: Página principal carregada, step: ${step}`,
      { step, totalPrice, cartItemsCount: cartItems.length }
    );
  }, [step, totalPrice, cartItems.length]);

  // MEGA CRÍTICO: Se estivermos no step 2 E na rota /checkout, mostrar PaymentGateway
  const isPaymentSelectionStep = step === 2 && window.location.pathname === '/checkout';

  if (isPaymentSelectionStep) {
    console.log("[Checkout] MEGA CHECKOUT: Renderizando PaymentGateway");
    
    // Renderizar PaymentGateway diretamente quando estivermos na seleção de método de pagamento
    return (
      <Layout>
        <CheckoutContainer step={step} title="Seleção de Pagamento" requireAuth={true}>
          <PaymentGateway
            orderId={orderId || 'temp-order'}
            totalAmount={totalPrice}
            onRefreshStatus={() => Promise.resolve()}
          />
        </CheckoutContainer>
      </Layout>
    );
  }

  // Renderização normal para outros steps
  return (
    <Layout>
      <CheckoutContainer step={step} title="Checkout" requireAuth={true}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Timeline Progress */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border p-6 mb-8"
            >
              <CheckoutProgress currentStep={step} />
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border p-6 sm:p-8"
            >
              <StepRenderer
                step={step}
                cartItems={cartItems}
                unavailablePanels={unavailablePanels}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                PLANS={PLANS}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                validateCoupon={validateCoupon}
                isValidatingCoupon={isValidatingCoupon}
                couponMessage={couponMessage}
                couponValid={couponValid}
                acceptTerms={acceptTerms}
                setAcceptTerms={setAcceptTerms}
                totalPrice={totalPrice}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />
            </motion.div>

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-between items-center mt-8"
            >
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={step === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>

              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  Total: R$ {totalPrice.toFixed(2)}
                </p>
                {couponValid && couponDiscount > 0 && (
                  <p className="text-sm text-green-600">
                    Desconto aplicado: {couponDiscount}%
                  </p>
                )}
              </div>

              <Button
                onClick={() => handleNextStep(paymentMethod)}
                disabled={!isNextEnabled || isCreatingPayment || isNavigating}
                className="flex items-center space-x-2 bg-[#3C1361] hover:bg-[#3C1361]/90"
              >
                <span>
                  {step === STEPS.PAYMENT ? 'Escolher Pagamento' : 
                   step === STEPS.UPLOAD ? 'Concluir' : 'Continuar'}
                </span>
                {(isCreatingPayment || isNavigating) ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </CheckoutContainer>
    </Layout>
  );
};

export default Checkout;

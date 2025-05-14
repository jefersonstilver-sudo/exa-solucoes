
import React from 'react';
import { motion } from 'framer-motion';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import StepRenderer from '@/components/checkout/StepRenderer';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import CheckoutNavigation from '@/components/checkout/CheckoutNavigation';
import { useCheckout } from '@/hooks/useCheckout';

const CheckoutContainer: React.FC = () => {
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
    startDate,
    endDate,
    isCreatingPayment,
    unavailablePanels,
    cartItems,
    validateCoupon,
    handleNextStep,
    handlePrevStep,
    isNextEnabled,
    PLANS
  } = useCheckout();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-5xl"
    >
      <CheckoutHeader />
      
      <div className="mb-10">
        <CheckoutProgress currentStep={step} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
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
          />
        </div>
        
        {/* Checkout summary */}
        <div className="md:col-span-1">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <CheckoutSummary 
              cartItems={cartItems}
              selectedPlan={selectedPlan}
              plans={PLANS}
              couponDiscount={couponValid ? couponDiscount : 0}
              startDate={startDate}
              endDate={endDate}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <CheckoutNavigation
        onBack={step === STEPS.REVIEW ? () => window.location.href = '/paineis-digitais/loja' : handlePrevStep}
        onNext={handleNextStep}
        isBackToStore={step === STEPS.REVIEW}
        isNextEnabled={isNextEnabled()}
        isCreatingPayment={isCreatingPayment}
        isPaymentStep={step === STEPS.PAYMENT}
      />
    </motion.div>
  );
};

export default CheckoutContainer;

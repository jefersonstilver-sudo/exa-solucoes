
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useCheckout, STEPS } from '@/hooks/useCheckout';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import ReviewStep from '@/components/checkout/ReviewStep';
import PlanSelector from '@/components/checkout/PlanSelector';
import CouponStep from '@/components/checkout/CouponStep';
import PaymentStep from '@/components/checkout/PaymentStep';
import CheckoutNavigation from '@/components/checkout/CheckoutNavigation';

export default function Checkout() {
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
  
  // Determine current step content
  const renderStepContent = () => {
    switch (step) {
      case STEPS.REVIEW:
        return (
          <ReviewStep 
            cartItems={cartItems} 
            unavailablePanels={unavailablePanels} 
          />
        );
        
      case STEPS.PLAN:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Escolha seu plano</h2>
            <PlanSelector 
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              plans={PLANS}
              panelCount={cartItems.length}
            />
          </div>
        );
        
      case STEPS.COUPON:
        return (
          <CouponStep
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            validateCoupon={validateCoupon}
            isValidatingCoupon={isValidatingCoupon}
            couponMessage={couponMessage}
            couponValid={couponValid}
          />
        );
        
      case STEPS.PAYMENT:
        return (
          <PaymentStep 
            acceptTerms={acceptTerms} 
            setAcceptTerms={setAcceptTerms} 
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-4xl"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indexa-purple">Checkout</h1>
          <p className="text-muted-foreground mt-2">Complete sua compra em poucos passos</p>
        </div>
        
        <CheckoutProgress currentStep={step} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {renderStepContent()}
          </div>
          
          {/* Checkout summary */}
          <div className="md:col-span-1">
            <CheckoutSummary 
              cartItems={cartItems}
              selectedPlan={selectedPlan}
              plans={PLANS}
              couponDiscount={couponValid ? couponDiscount : 0}
              startDate={startDate}
              endDate={endDate}
            />
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
    </Layout>
  );
}

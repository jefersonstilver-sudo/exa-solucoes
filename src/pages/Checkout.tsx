
import React, { useEffect } from 'react';
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
import { useUserSession } from '@/hooks/useUserSession';
import { useNavigate } from 'react-router-dom';
import { ClientOnly } from '@/components/ui/client-only';

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
  
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) {
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, isSessionLoading, navigate]);
  
  // Animation variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };
  
  // Determine current step content
  const renderStepContent = () => {
    switch (step) {
      case STEPS.REVIEW:
        return (
          <motion.div
            key="review"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.4 }}
          >
            <ReviewStep 
              cartItems={cartItems} 
              unavailablePanels={unavailablePanels} 
            />
          </motion.div>
        );
        
      case STEPS.PLAN:
        return (
          <motion.div
            key="plan"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.4 }}
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-xl font-semibold flex items-center">
                  <span className="mr-2 text-2xl">⏱️</span>
                  Escolha seu plano
                </h2>
                <p className="text-sm text-muted-foreground">
                  Selecione o período de veiculação da sua campanha
                </p>
              </motion.div>
              <PlanSelector 
                selectedPlan={selectedPlan}
                onSelectPlan={setSelectedPlan}
                plans={PLANS}
                panelCount={cartItems.length}
              />
            </div>
          </motion.div>
        );
        
      case STEPS.COUPON:
        return (
          <motion.div
            key="coupon"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.4 }}
          >
            <CouponStep
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              validateCoupon={validateCoupon}
              isValidatingCoupon={isValidatingCoupon}
              couponMessage={couponMessage}
              couponValid={couponValid}
            />
          </motion.div>
        );
        
      case STEPS.PAYMENT:
        return (
          <motion.div
            key="payment"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.4 }}
          >
            <PaymentStep 
              acceptTerms={acceptTerms} 
              setAcceptTerms={setAcceptTerms} 
            />
          </motion.div>
        );
        
      default:
        return null;
    }
  };
  
  if (isSessionLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <ClientOnly>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-8 max-w-5xl"
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-10 text-center"
          >
            <h1 className="text-3xl font-bold text-[#1E1B4B]">
              🎬 Sua campanha está prestes a estrear
            </h1>
            <p className="text-muted-foreground mt-2">
              O próximo anúncio de sucesso começa agora. Confirme sua veiculação abaixo.
            </p>
          </motion.div>
          
          <div className="mb-10">
            <CheckoutProgress currentStep={step} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              {renderStepContent()}
              
              {/* Trust indicators */}
              <motion.div 
                className="mt-8 p-4 border border-[#1E1B4B]/10 rounded-2xl bg-opacity-50 bg-indigo-50 flex items-center justify-center space-x-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span role="img" aria-label="secure" className="text-lg">🔒</span>
                  <span className="font-medium">Compra 100% Segura com Mercado Pago</span>
                </div>
                <div className="h-4 border-r border-gray-300 hidden sm:block"></div>
                <div className="text-sm text-gray-600 hidden sm:block">
                  <span>Mais de 1.200 anunciantes atendidos</span>
                </div>
              </motion.div>
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
      </ClientOnly>
    </Layout>
  );
}

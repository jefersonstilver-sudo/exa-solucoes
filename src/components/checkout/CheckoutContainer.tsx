
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import StepRenderer from '@/components/checkout/StepRenderer';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import CheckoutNavigation from '@/components/checkout/CheckoutNavigation';
import { useCheckout } from '@/hooks/useCheckout';
import { useToast } from '@/hooks/use-toast';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

const CheckoutContainer: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  
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
    isNavigating,
    unavailablePanels,
    cartItems,
    validateCoupon,
    handleNextStep,
    handlePrevStep,
    isNextEnabled,
    PLANS,
    calculateTotalPrice
  } = useCheckout();

  // Verify that we have a plan selected from the plan selection page
  useEffect(() => {
    if (selectedPlan === null || !selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "É necessário selecionar um plano antes de prosseguir com o checkout.",
        variant: "destructive"
      });
      navigate('/selecionar-plano');
    }
  }, [selectedPlan, navigate, toast]);

  // Log payment method changes
  useEffect(() => {
    if (paymentMethod) {
      console.log(`[CheckoutContainer] Método de pagamento definido: ${paymentMethod}, step: ${step}`);
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        `Método de pagamento definido: ${paymentMethod}`,
        { paymentMethod, step }
      );
    }
  }, [paymentMethod, step]);

  const totalPrice = calculateTotalPrice();

  // Handle next step with explicit payment method
  const handleNextWithPaymentMethod = () => {
    // Critical debugging - log detailed information
    console.log(`[CheckoutContainer] Próximo passo com método ${paymentMethod}, step atual: ${step}, isNextEnabled: ${isNextEnabled}`);
    
    // Always pass payment method when in payment step
    if (step === STEPS.PAYMENT) {
      // Extra verification logging
      console.log(`[CheckoutContainer] No passo de PAGAMENTO. Passando método ${paymentMethod} para handleNextStep`);
      
      if (!acceptTerms) {
        console.log('[CheckoutContainer] Termos não aceitos, impedindo navegação');
        toast({
          title: "Atenção",
          description: "Você precisa aceitar os termos para continuar.",
          variant: "destructive"
        });
        return;
      }
      
      // Always log before calling important functions
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        `Chamando handleNextStep com método ${paymentMethod}`,
        { step, paymentMethod, acceptTerms }
      );
      
      return handleNextStep(paymentMethod);
    }
    
    return handleNextStep();
  };

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
        {/* Conteúdo principal */}
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
            totalPrice={totalPrice}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
        </div>
        
        {/* Resumo do checkout */}
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
              couponValid={couponValid}
              startDate={startDate}
              endDate={endDate}
              paymentMethod={paymentMethod}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Botões de navegação */}
      <CheckoutNavigation
        onBack={step === STEPS.PLAN ? () => window.location.href = '/paineis-digitais/loja' : handlePrevStep}
        onNext={handleNextWithPaymentMethod}
        isBackToStore={step === STEPS.PLAN}
        isNextEnabled={isNextEnabled}
        isCreatingPayment={isCreatingPayment}
        isNavigating={isNavigating}
        isPaymentStep={step === STEPS.PAYMENT}
        totalPrice={totalPrice}
        paymentMethod={paymentMethod}
      />
    </motion.div>
  );
};

export default CheckoutContainer;

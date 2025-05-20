
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import CheckoutNavigation from '@/components/checkout/CheckoutNavigation';
import CheckoutDebugger from '@/components/checkout/CheckoutDebugger';
import StepRenderer from '@/components/checkout/StepRenderer';
import { useCheckout, STEPS, PLANS } from '@/hooks/useCheckout';
import { useCoupon } from '@/hooks/useCoupon';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { calculateTotalPrice } from '@/services/pricingService';
import { isCartEmpty } from '@/services/cartStorageService';

const CheckoutContainer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get('pedido');
  const { toast } = useToast();
  const { cartItems, unavailablePanels } = useCart();
  
  // Destructure the hook properties correctly - use step instead of currentStep
  // and make sure we're using the correct setter function name from the hook
  const {
    step,
    setStep,  // This was missing/incorrect before
    selectedPlan,
    setSelectedPlan,
    acceptTerms,
    setAcceptTerms,
    paymentMethod,
    setPaymentMethod
  } = useCheckout();
  
  const {
    couponCode,
    setCouponCode,
    validateCoupon,
    isValidatingCoupon,
    couponMessage,
    couponValid,
    couponDiscount
  } = useCoupon();
  
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Calculate total price
  const totalPrice = calculateTotalPrice(cartItems, selectedPlan, couponValid, couponDiscount);
  
  // Get selected plan price
  const getSelectedPlanPrice = () => {
    if (!selectedPlan) return 0;
    return PLANS[selectedPlan].pricePerMonth; // Changed from price to pricePerMonth to match PLANS structure
  };
  
  // Navigation handlers
  const handleNextStep = useCallback(() => {
    setIsNavigating(true);
    
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      `handleNextStep - Current step: ${step}`,
      { currentStep: step, timestamp: Date.now() }
    );
    
    // Validate cart before proceeding
    if (isCartEmpty()) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de prosseguir.",
        variant: "destructive"
      });
      setIsNavigating(false);
      return;
    }
    
    // Validate terms acceptance on payment step
    if (step === STEPS.PAYMENT && !acceptTerms) {
      toast({
        title: "Termos não aceitos",
        description: "Você precisa aceitar os termos para continuar.",
        variant: "destructive"
      });
      setIsNavigating(false);
      return;
    }
    
    // Proceed to the next step
    if (step < STEPS.PAYMENT) {
      setStep(step + 1);
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        `Moving to next step: ${step + 1}`,
        { nextStep: step + 1, timestamp: Date.now() }
      );
    } else {
      // Payment processing logic here
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT, // Changed from PAYMENT_INITIATED which doesn't exist
        LogLevel.INFO,
        "Payment processing initiated",
        { timestamp: Date.now() }
      );
      
      setIsCreatingPayment(true);
      
      // Simulate payment processing
      setTimeout(() => {
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_SUCCESS,
          LogLevel.SUCCESS,
          "Payment processed successfully",
          { timestamp: Date.now() }
        );
        
        setIsCreatingPayment(false);
        toast({
          title: "Pagamento realizado",
          description: "Seu pedido foi processado com sucesso!",
        });
        
        // Redirect to confirmation page
        navigate('/pedido-confirmado');
      }, 2000);
    }
    
    setIsNavigating(false);
  }, [step, setStep, acceptTerms, navigate, toast]);
  
  const handleBackStep = () => {
    setIsNavigating(true);
    
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      `handleBackStep - Current step: ${step}`,
      { currentStep: step, timestamp: Date.now() }
    );
    
    if (step > STEPS.REVIEW) {
      setStep(step - 1);
      
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        `Moving back to step: ${step - 1}`,
        { previousStep: step - 1, timestamp: Date.now() }
      );
    } else {
      // If on the first step, navigate back to the store
      navigate('/paineis-digitais/loja');
      
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        "Navigating back to store",
        { timestamp: Date.now() }
      );
    }
    
    setIsNavigating(false);
  };
  
  // Enable next step only if terms are accepted on payment step
  const isNextStepEnabled = !(step === STEPS.PAYMENT && !acceptTerms);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CheckoutHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
              <CheckoutProgress currentStep={step} />
              
              <div className="mt-8">
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
                  orderId={pedidoId}
                />
              </div>
              
              <CheckoutNavigation
                onBack={handleBackStep}
                onNext={handleNextStep}
                isBackToStore={step === STEPS.REVIEW}
                isNextEnabled={isNextStepEnabled}
                isCreatingPayment={isCreatingPayment}
                isPaymentStep={step === STEPS.PAYMENT}
                totalPrice={totalPrice}
                isNavigating={isNavigating}
                paymentMethod={paymentMethod}
                orderId={pedidoId}
              />
            </div>
            
            <CheckoutDebugger />
          </div>
          
          <div className="lg:col-span-1">
            <CheckoutSummary 
              cartItems={cartItems}
              selectedPlan={selectedPlan}
              couponValid={couponValid}
              couponDiscount={couponDiscount}
              totalPrice={totalPrice}
              planData={PLANS[selectedPlan]}
              isNavigating={isNavigating}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutContainer;

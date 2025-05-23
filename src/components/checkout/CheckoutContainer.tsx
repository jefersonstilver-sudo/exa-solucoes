
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CheckoutHeader from '@/components/checkout/CheckoutHeader';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import StepRenderer from '@/components/checkout/StepRenderer';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import CheckoutNavigation from '@/components/checkout/CheckoutNavigation';
import ClientInfoDialog from '@/components/checkout/payment/ClientInfoDialog';
import { useCheckout } from '@/hooks/useCheckout';
import { useToast } from '@/hooks/use-toast';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

const CheckoutContainer: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const { user, isLoggedIn } = useUserSession();
  
  // Add state for client info dialog
  const [isClientInfoOpen, setIsClientInfoOpen] = useState(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);
  
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

  // Verificar a autenticação periodicamente para evitar perda de sessão
  const verifyAuth = useCallback(async () => {
    setIsVerifyingAuth(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[CheckoutContainer] Erro ao verificar sessão:", error);
        
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.ERROR,
          "Error checking session in checkout container",
          { error: String(error), timestamp: new Date().toISOString() }
        );
        
        toast({
          title: "Erro de autenticação",
          description: "Ocorreu um problema ao verificar sua sessão. Por favor, faça login novamente.",
          variant: "destructive"
        });
        navigate('/login?redirect=/checkout');
        return false;
      }
      
      if (!data.session?.user) {
        console.warn("[CheckoutContainer] Usuário não autenticado na verificação");
        
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.WARNING,
          "User not authenticated in checkout container verification",
          { timestamp: new Date().toISOString() }
        );
        
        toast({
          title: "Login necessário",
          description: "Sua sessão expirou. Por favor, faça login novamente para continuar com a compra.",
          variant: "destructive"
        });
        navigate('/login?redirect=/checkout');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("[CheckoutContainer] Erro ao verificar autenticação:", err);
      return false;
    } finally {
      setIsVerifyingAuth(false);
    }
  }, [navigate, toast]);

  // Verificação inicial e periódica de autenticação
  useEffect(() => {
    verifyAuth();
    
    // Verificar a cada 30 segundos
    const authCheckInterval = setInterval(() => {
      verifyAuth();
    }, 30000);
    
    return () => {
      clearInterval(authCheckInterval);
    };
  }, [verifyAuth]);

  // Listener de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        console.log("[CheckoutContainer] Evento de logout detectado");
        
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.WARNING,
          "Logout event detected in checkout container",
          { event, timestamp: new Date().toISOString() }
        );
        
        toast({
          title: "Sessão encerrada",
          description: "Sua sessão foi encerrada. Por favor, faça login novamente para continuar.",
          variant: "destructive"
        });
        navigate('/login?redirect=/checkout');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const totalPrice = calculateTotalPrice();

  // Handle next step with explicit payment method
  const handleNextWithPaymentMethod = async () => {
    // Verificar autenticação antes de prosseguir
    const isAuthenticated = await verifyAuth();
    
    if (!isAuthenticated) {
      return;
    }
    
    // ENHANCED DEBUG: Log all important state before proceeding
    console.log(`[CheckoutContainer] PAYMENT DEBUG: Iniciando pagamento`, {
      step,
      paymentMethod,
      acceptTerms,
      isNextEnabled,
      isCreatingPayment,
      isNavigating,
      totalPrice,
      isAuthVerified: isAuthenticated
    });
    
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
  
  // Handle test payment button click
  const handleTestPayment = async () => {
    // Verificar autenticação antes de prosseguir
    const isAuthenticated = await verifyAuth();
    
    if (!isAuthenticated) {
      return;
    }
    
    if (!acceptTerms) {
      toast({
        title: "Atenção",
        description: "Você precisa aceitar os termos para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Botão de teste de pagamento clicado`,
      { userId: user?.id, userEmail: user?.email, totalPrice, cartItems }
    );
    
    setIsClientInfoOpen(true);
  };
  
  // Tela de carregamento durante verificações
  if (isVerifyingAuth) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="h-10 w-10 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Verificando sua sessão...</span>
      </div>
    );
  }
  
  // Verificação de autenticação
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Login necessário</h2>
          <p className="text-yellow-700 mb-4">
            Para prosseguir com sua compra, é necessário fazer login ou criar uma conta.
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={() => navigate('/login?redirect=/checkout')}
              className="px-4 py-2 bg-[#3C1361] text-white rounded-md hover:bg-[#3C1361]/90"
            >
              Fazer login
            </button>
            <button 
              onClick={() => navigate('/cadastro?redirect=/checkout')}
              className="px-4 py-2 border border-[#3C1361] text-[#3C1361] rounded-md hover:bg-[#3C1361]/10"
            >
              Criar conta
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        onTestPayment={step === STEPS.PAYMENT ? handleTestPayment : undefined}
      />
      
      {/* Client Info Dialog */}
      <ClientInfoDialog
        isOpen={isClientInfoOpen}
        onClose={() => setIsClientInfoOpen(false)}
        clientId={user?.id}
        clientEmail={user?.email}
        totalPrice={totalPrice}
        panels={cartItems}
      />
    </motion.div>
  );
};

export default CheckoutContainer;

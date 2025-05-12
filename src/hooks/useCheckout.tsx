
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCartManager } from '@/hooks/useCartManager';
import { useCouponValidator } from '@/hooks/useCouponValidator';
import { usePanelAvailability } from '@/hooks/usePanelAvailability';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { calculateTotalPrice } from '@/utils/checkoutUtils';
import { CHECKOUT_STEPS, PLANS } from '@/constants/checkoutConstants';

export const STEPS = CHECKOUT_STEPS; // Re-export for backward compatibility
export { PLANS }; // Re-export for backward compatibility

export const useCheckout = () => {
  const [step, setStep] = useState(STEPS.REVIEW);
  const [selectedPlan, setSelectedPlan] = useState<1 | 3 | 6 | 12>(1);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default to 30 days
    return date;
  });
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cartItems, handleClearCart } = useCartManager();
  
  // Use the modularized hooks
  const {
    couponCode, setCouponCode,
    couponDiscount, couponId,
    isValidatingCoupon, couponMessage,
    couponValid, validateCoupon
  } = useCouponValidator();
  
  const {
    isCheckingAvailability,
    unavailablePanels,
    checkPanelAvailability
  } = usePanelAvailability();
  
  const {
    isCreatingPayment,
    createPayment
  } = usePaymentProcessor();

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        toast({
          title: "Acesso restrito",
          description: "Você precisa estar logado para finalizar a compra.",
          variant: "destructive"
        });
        navigate('/login?redirect=/checkout');
      } else {
        setSessionUser(data.session.user);
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setSessionUser(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        setSessionUser(null);
        navigate('/login?redirect=/checkout');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  // Update end date when plan changes
  useEffect(() => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + PLANS[selectedPlan].months);
    setEndDate(date);
  }, [selectedPlan, startDate]);
  
  // Check if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar a compra.",
        variant: "destructive"
      });
      navigate('/paineis-digitais/loja');
    }
  }, [cartItems, navigate]);
  
  // Check panel availability when step changes to plan selection
  useEffect(() => {
    if (step === STEPS.PLAN) {
      checkPanelAvailability(cartItems, startDate, endDate);
    }
  }, [step, startDate, endDate]);

  // Handle validateCoupon to adapt to the new structure
  const handleValidateCoupon = () => {
    validateCoupon(selectedPlan);
  };

  // Handle payment creation
  const handleCreatePayment = () => {
    const totalPrice = calculateTotalPrice(selectedPlan, cartItems.length, couponDiscount, couponValid);
    
    createPayment({
      totalPrice,
      selectedPlan,
      cartItems,
      startDate,
      endDate,
      couponId,
      acceptTerms,
      unavailablePanels,
      sessionUser,
      handleClearCart
    });
  };

  // Next step handler
  const handleNextStep = () => {
    if (step === STEPS.PAYMENT) {
      handleCreatePayment();
      return;
    }
    setStep(prev => prev + 1);
  };
  
  // Previous step handler
  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };
  
  // Determine whether the next button should be enabled
  const isNextEnabled = () => {
    if (step === STEPS.REVIEW && unavailablePanels.length > 0) return false;
    if (step === STEPS.PAYMENT && !acceptTerms) return false;
    return true;
  };

  return {
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
    validateCoupon: handleValidateCoupon,
    handleNextStep,
    handlePrevStep,
    isNextEnabled,
    PLANS,
    calculateTotalPrice: () => calculateTotalPrice(selectedPlan, cartItems.length, couponDiscount, couponValid),
    orderId
  };
};

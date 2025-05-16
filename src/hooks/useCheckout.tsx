
import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { PlanKey } from '@/types/checkout';
import { useUserSession } from '@/hooks/useUserSession';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';
import { useCartState } from '@/hooks/cart/useCartState';
import { useOrderCreation } from '@/hooks/payment/useOrderCreation';
import { usePaymentProcessor } from '@/hooks/payment/usePaymentProcessor';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const STEPS = {
  PLAN: 0,
  REVIEW: 1,
  COUPON: 2,
  PAYMENT: 3,
  UPLOAD: 4, // CORREÇÃO: Adicionando um passo explícito de upload
};

// Plans configuration - revise if needed
const PLANS = {
  1: {
    id: 1, name: 'Plano Básico', discount: 0,
    subtitle: 'Escolha ideal para testar campanhas',
    price: '250,00/mês', totalMonths: 1
  },
  3: {
    id: 3, name: 'Plano Popular', discount: 5,
    subtitle: 'Ideal para maior fixação da marca',
    price: '237,50/mês', totalMonths: 3
  },
  6: {
    id: 6, name: 'Plano Profissional', discount: 10,
    subtitle: 'Ótimo para campanhas sazonais',
    price: '225,00/mês', totalMonths: 6
  },
  12: {
    id: 12, name: 'Plano Empresarial', discount: 15,
    subtitle: 'Melhor custo-benefício anual',
    price: '212,50/mês', totalMonths: 12
  }
};

// Interface for cart items
interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCheckout = () => {
  // Session user check
  const { sessionUser } = useUserSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Order creation hooks
  const { createOrder } = useOrderCreation();
  
  // Cart state
  const { cart: cartItems, clearCart: handleClearCart } = useCartState();
  
  // Checkout progress state
  const [step, setStep] = useState(STEPS.PLAN);
  const [isProcessing, setIsProcessing] = useState(false);
  const [unavailablePanels, setUnavailablePanels] = useState<string[]>([]);
  
  // Payment and total price
  const { isCreatingPayment, createPayment, paymentMethod, setPaymentMethod } = usePaymentProcessor();
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Plan configuration
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(3);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => addDays(new Date(), 90)); // Default 3 months
  
  // Coupon handling
  const [couponId, setCouponId] = useState<string | null>(null);
  const [couponValid, setCouponValid] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  // Terms acceptance
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // IMPORTANTE: Verifica se a rota atual é /pedido-confirmado
  // Se sim, vai automaticamente para a etapa de upload
  useEffect(() => {
    if (window.location.pathname === "/pedido-confirmado") {
      setStep(STEPS.UPLOAD);
    }
  }, []);

  // Calculate the total price based on cart items, plan, and coupon
  useEffect(() => {
    if (cartItems.length > 0 && selectedPlan) {
      // Base price calculation (example: R$250 per panel per month)
      const basePrice = 250; // R$ 250,00 por painel por mês
      
      // Get plan discount percentage
      const planDiscount = PLANS[selectedPlan]?.discount || 0;
      
      // Calculate subtotal
      const subtotal = cartItems.length * basePrice * selectedPlan;
      
      // Apply plan discount
      const afterPlanDiscount = subtotal * (1 - planDiscount / 100);
      
      // Apply coupon discount if valid
      const finalPrice = couponValid && couponDiscount > 0 
        ? afterPlanDiscount * (1 - couponDiscount / 100)
        : afterPlanDiscount;
      
      setTotalPrice(finalPrice);
    } else {
      setTotalPrice(0);
    }
  }, [cartItems, selectedPlan, couponValid, couponDiscount]);
  
  // Update end date when plan changes
  useEffect(() => {
    if (selectedPlan) {
      const months = Number(selectedPlan);
      const days = months * 30; // Approximate days in a month
      setEndDate(addDays(startDate, days));
    }
  }, [selectedPlan, startDate]);

  // Validate coupon function
  const validateCoupon = async () => {
    if (!couponCode || couponCode.trim() === '') {
      setCouponMessage('Por favor, digite um código de cupom');
      setCouponValid(false);
      return;
    }
    
    setIsValidatingCoupon(true);
    
    try {
      // Call the Supabase function to validate the coupon
      const { data, error } = await supabase.rpc('validate_cupom', {
        p_codigo: couponCode,
        p_meses: selectedPlan
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.valid) {
          setCouponId(result.id);
          setCouponDiscount(result.desconto_percentual);
          setCouponValid(true);
          setCouponMessage(result.message);
          toast({
            title: "Cupom válido!",
            description: `Desconto de ${result.desconto_percentual}% aplicado.`,
          });
        } else {
          setCouponId(null);
          setCouponDiscount(0);
          setCouponValid(false);
          setCouponMessage(result.message);
          toast({
            variant: "destructive",
            title: "Cupom inválido",
            description: result.message,
          });
        }
      } else {
        setCouponId(null);
        setCouponDiscount(0);
        setCouponValid(false);
        setCouponMessage('Erro ao validar cupom');
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível validar o cupom. Tente novamente.",
        });
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponId(null);
      setCouponDiscount(0);
      setCouponValid(false);
      setCouponMessage('Erro ao validar cupom');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Houve um problema ao validar o cupom.",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  return {
    step,
    setStep,
    cartItems,
    PLANS,
    selectedPlan,
    setSelectedPlan,
    unavailablePanels,
    couponCode,
    setCouponCode,
    validateCoupon,
    isValidatingCoupon,
    couponMessage,
    couponValid,
    couponDiscount,
    acceptTerms,
    setAcceptTerms,
    totalPrice,
    isCreatingPayment,
    isProcessing,
    startDate,
    endDate,
    sessionUser,
    createPayment,
    couponId,
    handleClearCart,
    paymentMethod,
    setPaymentMethod,
  };
};

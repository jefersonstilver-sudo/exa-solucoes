import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createPaymentPreference } from '@/services/mercadoPago';
import { calculatePriceWithDiscount, ensureSpreadable } from '@/utils/priceUtils';
import { useCartManager } from '@/hooks/useCartManager';

// Checkout steps
export const STEPS = {
  REVIEW: 0,
  PLAN: 1,
  COUPON: 2,
  PAYMENT: 3
};

// Plan configuration
export const PLANS = {
  1: { months: 1, pricePerMonth: 250, discount: 0, extras: [] },
  3: { months: 3, pricePerMonth: 220, discount: 12, extras: ['🎥 1 vídeo por mês produzido pela Indexa'] },
  6: { months: 6, pricePerMonth: 200, discount: 20, extras: ['🎥 1 vídeo por mês produzido pela Indexa'] },
  12: { months: 12, pricePerMonth: 180, discount: 28, extras: ['🎥 1 vídeo por mês produzido pela Indexa', '🎬 Vídeo institucional', '🎞️ Bônus de exibição ininterrupta de 30s'] }
};

export const useCheckout = () => {
  const [step, setStep] = useState(STEPS.REVIEW);
  const [selectedPlan, setSelectedPlan] = useState<1 | 3 | 6 | 12>(1);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponValid, setCouponValid] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default to 30 days
    return date;
  });
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [unavailablePanels, setUnavailablePanels] = useState<string[]>([]);
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cartItems, handleClearCart } = useCartManager();

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        toast({
          variant: "destructive",
          title: "Acesso restrito",
          description: "Você precisa estar logado para finalizar a compra.",
        });
        navigate('/login', { state: { returnTo: '/checkout' } });
      } else {
        setSessionUser(data.session.user);
      }
    };
    
    checkAuth();
  }, [navigate, toast]);
  
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
      });
      navigate('/paineis-digitais/loja');
    }
  }, [cartItems, navigate, toast]);
  
  // Check panel availability when step changes to plan selection
  useEffect(() => {
    if (step === STEPS.PLAN) {
      checkPanelAvailability();
    }
  }, [step, startDate, endDate]);
  
  // Function to validate coupon
  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsValidatingCoupon(true);
    setCouponMessage('');
    setCouponValid(false);
    setCouponDiscount(0);
    setCouponId(null);
    
    try {
      const { data, error } = await supabase.rpc('validate_cupom', {
        p_codigo: couponCode,
        p_meses: selectedPlan
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.valid) {
          setCouponDiscount(result.desconto_percentual);
          setCouponId(result.id);
          setCouponValid(true);
          setCouponMessage(result.message);
          
          toast({
            title: "Cupom aplicado",
            description: result.message,
          });
        } else {
          setCouponMessage(result.message);
          toast({
            variant: "destructive",
            title: "Cupom inválido",
            description: result.message,
          });
        }
      }
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      setCouponMessage('Erro ao validar cupom');
      toast({
        variant: "destructive",
        title: "Erro ao validar cupom",
        description: error.message,
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };
  
  // Function to check panel availability
  const checkPanelAvailability = async () => {
    if (cartItems.length === 0) return;
    
    setIsCheckingAvailability(true);
    setUnavailablePanels([]);
    
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const unavailable: string[] = [];
      
      // Check availability for each panel
      for (const item of cartItems) {
        const { data, error } = await supabase.rpc('check_panel_availability', {
          p_panel_id: item.panel.id,
          p_start_date: startDateStr,
          p_end_date: endDateStr
        });
        
        if (error) throw error;
        
        if (data === false) {
          unavailable.push(item.panel.id);
        }
      }
      
      setUnavailablePanels(unavailable);
      
      if (unavailable.length > 0) {
        toast({
          variant: "destructive",
          title: "Painéis indisponíveis",
          description: `${unavailable.length} painéis não estão disponíveis para o período selecionado.`,
        });
      }
    } catch (error: any) {
      console.error('Error checking panel availability:', error);
      toast({
        variant: "destructive",
        title: "Erro ao verificar disponibilidade",
        description: error.message,
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    const basePricePerMonth = PLANS[selectedPlan].pricePerMonth;
    const totalMonths = PLANS[selectedPlan].months;
    const panelCount = cartItems.length;
    
    // Base price calculation
    let totalPrice = basePricePerMonth * totalMonths * panelCount;
    
    // Apply coupon discount if valid
    if (couponValid && couponDiscount > 0) {
      totalPrice = calculatePriceWithDiscount(totalPrice, couponDiscount);
    }
    
    return totalPrice;
  };
  
  // Function to create payment
  const createPayment = async () => {
    if (!acceptTerms) {
      toast({
        variant: "destructive",
        title: "Termos e condições",
        description: "Você precisa aceitar os termos e condições para continuar.",
      });
      return;
    }
    
    if (unavailablePanels.length > 0) {
      toast({
        variant: "destructive",
        title: "Painéis indisponíveis",
        description: "Alguns painéis não estão disponíveis para o período selecionado.",
      });
      return;
    }
    
    if (!sessionUser) {
      toast({
        variant: "destructive",
        title: "Acesso restrito",
        description: "Você precisa estar logado para finalizar a compra.",
      });
      navigate('/login', { state: { returnTo: '/checkout' } });
      return;
    }
    
    setIsCreatingPayment(true);
    
    try {
      // Calculate total price
      const totalPrice = calculateTotalPrice();
      
      // Create pedido in database
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert([
          {
            client_id: sessionUser.id,
            lista_paineis: cartItems.map(item => item.panel.id),
            duracao: selectedPlan * 30, // Convert months to days
            plano_meses: selectedPlan,
            valor_total: totalPrice,
            cupom_id: couponId,
            data_inicio: startDate.toISOString().split('T')[0],
            data_fim: endDate.toISOString().split('T')[0],
            termos_aceitos: true,
            status: 'pendente',
            log_pagamento: {
              plan_details: PLANS[selectedPlan],
              coupon_applied: couponCode,
              coupon_discount: couponDiscount,
              panels_count: cartItems.length
            }
          }
        ])
        .select()
        .single();
      
      if (pedidoError) throw pedidoError;
      
      // If coupon was applied, record its usage
      if (couponId) {
        await supabase
          .from('cupom_usos')
          .insert([
            {
              cupom_id: couponId,
              user_id: sessionUser.id,
              pedido_id: pedido.id
            }
          ]);
      }
      
      // Create Mercado Pago preference
      const items = [{
        title: `Plano ${selectedPlan} ${selectedPlan === 1 ? 'mês' : 'meses'} - ${cartItems.length} painéis`,
        quantity: 1,
        unit_price: totalPrice,
        currency_id: 'BRL'
      }];
      
      const backUrls = {
        success: `${window.location.origin}/pedido-confirmado?id=${pedido.id}`,
        failure: `${window.location.origin}/checkout/falha?id=${pedido.id}`,
        pending: `${window.location.origin}/checkout/pendente?id=${pedido.id}`
      };
      
      // In a real environment, this would call the Mercado Pago API
      // For now, we'll simulate this process
      try {
        const preference = await createPaymentPreference(items, backUrls, {
          external_reference: pedido.id,
          client_id: sessionUser.id
        });
        
        // Update pedido with payment information
        await supabase
          .from('pedidos')
          .update({
            log_pagamento: {
              ...ensureSpreadable(pedido.log_pagamento),
              payment_preference_id: preference.preferenceId
            }
          })
          .eq('id', pedido.id);
        
        // Redirect to Mercado Pago checkout
        // For demo purposes, we'll simulate a successful payment
        setTimeout(() => {
          // Simulate successful payment
          handlePaymentSuccess(pedido.id);
        }, 2000);
        
      } catch (mpError: any) {
        console.error('Error creating payment preference:', mpError);
        throw new Error('Erro ao criar preferência de pagamento: ' + mpError.message);
      }
      
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error.message,
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };
  
  // Function to handle payment success (simulated for demo)
  const handlePaymentSuccess = async (pedidoId: string) => {
    try {
      // Update pedido status
      await supabase
        .from('pedidos')
        .update({
          status: 'pago'
        })
        .eq('id', pedidoId);
      
      // Create campaigns for each panel
      // For each panel in the order, create a campaign
      for (const item of cartItems) {
        await supabase
          .from('campanhas')
          .insert([
            {
              client_id: sessionUser.id,
              painel_id: item.panel.id,
              // In a real implementation, we would use the user's active video
              // For demo purposes, we'll set a placeholder
              video_id: '00000000-0000-0000-0000-000000000000', // This would be replaced with a real video ID
              data_inicio: startDate.toISOString().split('T')[0],
              data_fim: endDate.toISOString().split('T')[0],
              status: 'pendente',
              obs: `Criado automaticamente do pedido ${pedidoId}`
            }
          ]);
      }
      
      // Clear cart
      handleClearCart();
      
      // Show success message
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Seu pedido foi confirmado e suas campanhas foram criadas.",
      });
      
      // Redirect to confirmation page
      navigate(`/pedido-confirmado?id=${pedidoId}`);
      
    } catch (error: any) {
      console.error('Error handling payment success:', error);
    }
  };

  // Next step handler
  const handleNextStep = () => {
    if (step === STEPS.PAYMENT) {
      createPayment();
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
    validateCoupon,
    handleNextStep,
    handlePrevStep,
    isNextEnabled,
    PLANS,
    calculateTotalPrice
  };
};

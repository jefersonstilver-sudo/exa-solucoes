
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCart } from './useUnifiedCart';
import { useUserSession } from './useUserSession';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export const useCheckout = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserSession();
  const unifiedCart = useUnifiedCart(); 
  
  // Estados específicos do checkout
  const [selectedPlan, setSelectedPlan] = useState<number>(1);
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponValid, setCouponValid] = useState<boolean>(false);
  const [couponMessage, setCouponMessage] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0); // ADICIONADO
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // Carregar plano salvo
  useEffect(() => {
    const savedPlan = localStorage.getItem('selectedPlan');
    if (savedPlan) {
      const planNumber = parseInt(savedPlan);
      if ([1, 3, 6, 12].includes(planNumber)) {
        setSelectedPlan(planNumber);
      }
    }
  }, []);

  // Salvar plano quando mudar
  useEffect(() => {
    localStorage.setItem('selectedPlan', selectedPlan.toString());
  }, [selectedPlan]);

  // Calcular preço total
  const calculateTotalPrice = useCallback(() => {
    const basePrice = unifiedCart.totalPrice;
    const planMultiplier = selectedPlan;
    
    let total = basePrice * planMultiplier;
    
    // Aplicar desconto de cupom se válido
    if (couponValid && couponDiscount > 0) {
      total = total * (1 - couponDiscount / 100); // CORRIGIDO
    }
    
    console.log("💰 [useCheckout] Calculando preço total:", {
      basePrice,
      planMultiplier,
      couponValid,
      couponDiscount,
      total,
      cartItemCount: unifiedCart.cartItems.length
    });
    
    return total;
  }, [unifiedCart.totalPrice, selectedPlan, couponValid, couponDiscount, unifiedCart.cartItems.length]);

  // Validar cupom
  const validateCoupon = useCallback(async (code: string, plan: number) => {
    setIsValidatingCoupon(true);
    setCouponMessage('');
    
    try {
      console.log("🏷️ [useCheckout] Validando cupom:", { code, plan });
      
      // Simular validação (implementar integração real)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (code.toLowerCase() === 'desconto10') {
        setCouponValid(true);
        setCouponDiscount(10); // ADICIONADO
        setCouponMessage('Cupom aplicado! 10% de desconto');
        toast.success('Cupom aplicado com sucesso!');
        
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.SUCCESS,
          'Cupom válido aplicado',
          { code, plan }
        );
      } else {
        setCouponValid(false);
        setCouponDiscount(0); // ADICIONADO 
        setCouponMessage('Cupom inválido ou expirado');
        toast.error('Cupom inválido');
        
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.WARNING,
          'Cupom inválido tentado',
          { code, plan }
        );
      }
    } catch (error) {
      setCouponValid(false);
      setCouponDiscount(0); // ADICIONADO
      setCouponMessage('Erro ao validar cupom');
      toast.error('Erro ao validar cupom');
      
      console.error("❌ [useCheckout] Erro ao validar cupom:", error);
    } finally {
      setIsValidatingCoupon(false);
    }
  }, []);

  // Navegação entre etapas
  const handleNextStep = useCallback(() => {
    setIsNavigating(true);
    
    // Verificar se há itens no carrinho
    if (unifiedCart.cartItems.length === 0) {
      toast.error('Adicione painéis ao carrinho antes de continuar');
      setIsNavigating(false);
      return;
    }
    
    // Verificar autenticação
    if (!isLoggedIn) {
      toast.error('Faça login para continuar');
      navigate('/login?redirect=/checkout/resumo');
      setIsNavigating(false);
      return;
    }
    
    console.log("➡️ [useCheckout] Próxima etapa");
    navigate('/checkout');
    setIsNavigating(false);
  }, [unifiedCart.cartItems.length, isLoggedIn, navigate]);

  const handlePrevStep = useCallback(() => {
    setIsNavigating(true);
    console.log("⬅️ [useCheckout] Etapa anterior");
    navigate('/checkout/cupom');
    setIsNavigating(false);
  }, [navigate]);

  // Estado habilitado para próxima etapa
  const isNextEnabled = unifiedCart.cartItems.length > 0 && isLoggedIn && !isNavigating;

  return {
    // Estados do carrinho (unificado)
    cartItems: unifiedCart.cartItems,
    isLoadingCart: unifiedCart.isLoading,
    totalCartPrice: unifiedCart.totalPrice,
    
    // Estados do checkout
    selectedPlan,
    setSelectedPlan,
    couponCode,
    setCouponCode,
    couponValid,
    couponDiscount, // ADICIONADO
    couponMessage,
    isValidatingCoupon,
    isCreatingPayment,
    isNavigating,
    
    // Funções
    calculateTotalPrice,
    validateCoupon,
    handleNextStep,
    handlePrevStep,
    
    // Estados derivados
    isNextEnabled,
    
    // Métodos do carrinho
    addToCart: unifiedCart.addToCart,
    removeFromCart: unifiedCart.removeFromCart,
    clearCart: unifiedCart.clearCart,
    updateDuration: unifiedCart.updateDuration,
    isItemInCart: unifiedCart.isItemInCart
  };
};

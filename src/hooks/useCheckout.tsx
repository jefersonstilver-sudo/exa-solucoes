
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartManager } from './useCartManager';
import { useUserSession } from './useUserSession';
import { useCouponValidator } from './useCouponValidator';
import { calculateTotalPrice } from '@/utils/checkoutUtils';
import { toast } from 'sonner';

export const useCheckout = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserSession();
  const { cartItems, selectedPlan, setSelectedPlan } = useCartManager();
  const { 
    couponCode, 
    setCouponCode, 
    couponValid, 
    couponMessage, 
    isValidating: isValidatingCoupon,
    validationResult,
    validateCoupon: validateCouponOriginal,
    removeCoupon
  } = useCouponValidator();
  
  // Estados específicos do checkout
  const [isCreatingPayment, setIsCreatingPayment] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  console.log('[useCheckout] Estado atual:', {
    cartItemsCount: cartItems?.length || 0,
    selectedPlan,
    couponValid,
    validationResult,
    couponDiscount: validationResult?.discountPercent || 0
  });

  // Carregar plano salvo
  useEffect(() => {
    const savedPlan = localStorage.getItem('selectedPlan');
    if (savedPlan) {
      const planNumber = parseInt(savedPlan);
      if ([1, 3, 6, 12].includes(planNumber)) {
        setSelectedPlan(planNumber as 1 | 3 | 6 | 12);
      }
    }
  }, [setSelectedPlan]);

  // Salvar plano quando mudar
  useEffect(() => {
    if (selectedPlan) {
      localStorage.setItem('selectedPlan', selectedPlan.toString());
    }
  }, [selectedPlan]);

  // Calcular preço total usando função centralizada
  const calculateTotalPriceWrapper = useCallback(() => {
    if (!selectedPlan || !cartItems || cartItems.length === 0) {
      return 0;
    }
    
    const couponDiscountPercent = couponValid && validationResult ? validationResult.discountPercent : 0;
    const result = calculateTotalPrice(selectedPlan, cartItems, couponDiscountPercent, couponValid);
    
    console.log('[useCheckout] Preço calculado:', {
      selectedPlan,
      cartItemsCount: cartItems.length,
      couponDiscountPercent,
      couponValid,
      result
    });
    
    return result;
  }, [selectedPlan, cartItems, couponValid, validationResult]);

  // Wrapper para validação de cupom - Agora usa valor do pedido em vez de meses
  const validateCoupon = useCallback(async (code: string, planMonths: number) => {
    // Calcular valor atual do pedido para validação
    const currentOrderValue = calculateTotalPriceWrapper();
    console.log('[useCheckout] Validando cupom com valor:', { code, planMonths, currentOrderValue });
    return await validateCouponOriginal(code, currentOrderValue);
  }, [validateCouponOriginal, calculateTotalPriceWrapper]);

  // Navegação entre etapas - CORRIGIDO: redirecionar para /checkout/resumo
  const handleNextStep = useCallback(() => {
    setIsNavigating(true);
    
    // Verificar se há itens no carrinho
    if (cartItems.length === 0) {
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
    
    navigate('/checkout/resumo');
    setIsNavigating(false);
  }, [cartItems.length, isLoggedIn, navigate]);

  const handlePrevStep = useCallback(() => {
    setIsNavigating(true);
    navigate('/selecionar-plano');
    setIsNavigating(false);
  }, [navigate]);

  // Estado habilitado para próxima etapa
  const isNextEnabled = cartItems.length > 0 && isLoggedIn && !isNavigating;

  return {
    // Estados do carrinho
    cartItems,
    selectedPlan,
    setSelectedPlan,
    
    // Estados do cupom - CORRIGIDO
    couponCode,
    setCouponCode,
    couponValid,
    couponMessage,
    isValidatingCoupon,
    validationResult,
    couponId: validationResult?.couponId, // EXPORTAR couponId
    couponDiscount: validationResult?.discountPercent || 0, // GARANTIR que sempre retorna número
    
    // Estados do checkout
    isCreatingPayment,
    isNavigating,
    
    // Funções
    calculateTotalPrice: calculateTotalPriceWrapper,
    validateCoupon,
    removeCoupon,
    handleNextStep,
    handlePrevStep,
    
    // Estados derivados
    isNextEnabled
  };
};

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CheckoutLayout from '@/components/checkout/CheckoutLayout';
import OrderSummaryCard from '@/components/checkout/summary/OrderSummaryCard';
import PaymentMethodSelector from '@/components/checkout/summary/PaymentMethodSelector';
import PricingBreakdown from '@/components/checkout/summary/PricingBreakdown';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { usePaymentFlow } from '@/hooks/payment/usePaymentFlow';
import { toast } from 'sonner';
import { MINIMUM_ORDER_VALUE } from '@/utils/priceCalculator';
import Layout from '@/components/layout/Layout';
const CheckoutSummary = () => {
  const navigate = useNavigate();
  const {
    isLoggedIn,
    user,
    isLoading
  } = useUserSession();
  const [hasValidatedCart, setHasValidatedCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');

  const {
    cartItems,
    selectedPlan,
    calculateTotalPrice,
    couponValid,
    couponId,
    couponDiscount
  } = useCheckout();
  
  const { isCreatingPayment, processPayment } = usePaymentFlow();
  console.log('[CheckoutSummary] Estado atual:', {
    isLoggedIn,
    userId: user?.id,
    cartItemsCount: cartItems?.length || 0,
    selectedPlan,
    couponValid,
    couponDiscount,
    paymentMethod,
    isCreatingPayment
  });

  // Verificação de autenticação melhorada
  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn || !user?.id) {
      console.log('[CheckoutSummary] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout/resumo');
    }
  }, [isLoggedIn, user?.id, isLoading, navigate]);

  // Validação do carrinho menos agressiva
  useEffect(() => {
    if (isLoading || !isLoggedIn || hasValidatedCart) return;
    const validateCartTimer = setTimeout(() => {
      console.log('[CheckoutSummary] Validando carrinho:', {
        cartItemsLength: cartItems?.length || 0,
        selectedPlan,
        timestamp: new Date().toISOString()
      });
      if (!cartItems || cartItems.length === 0) {
        console.log('[CheckoutSummary] Carrinho vazio detectado');
        toast.error("Seu carrinho está vazio. Adicione painéis para continuar.", {
          duration: 5000,
          action: {
            label: "Ir para Loja",
            onClick: () => navigate('/paineis-digitais/loja')
          }
        });
      }
      setHasValidatedCart(true);
    }, 1500);
    return () => clearTimeout(validateCartTimer);
  }, [isLoggedIn, cartItems, navigate, isLoading, hasValidatedCart, selectedPlan]);

  // Calcular preços usando função centralizada
  const baseTotal = calculateTotalPrice();
  console.log('[CheckoutSummary] Preços calculados:', {
    baseTotal,
    couponValid,
    couponDiscount,
    paymentMethod,
    MINIMUM_ORDER_VALUE
  });
  
  // Aplicar cupom se válido
  const totalAfterCoupon = couponValid && couponDiscount > 0 
    ? baseTotal - (baseTotal * couponDiscount / 100)
    : baseTotal;
  
  // CRÍTICO: Garantir valor mínimo de R$ 0,05 - SEMPRE gera PIX
  const finalTotal = Math.max(totalAfterCoupon, MINIMUM_ORDER_VALUE);

  // TODOS os pedidos geram PIX, mesmo com cupom 100%
  const isPedidoComValorMinimo = finalTotal === MINIMUM_ORDER_VALUE && totalAfterCoupon < MINIMUM_ORDER_VALUE;
  
  console.log('[CheckoutSummary] TOTAL FINAL COM MÍNIMO:', {
    baseTotal,
    totalAfterCoupon,
    finalTotal,
    MINIMUM_ORDER_VALUE,
    isPedidoComValorMinimo,
    appliedMinimum: totalAfterCoupon < MINIMUM_ORDER_VALUE,
    todosGeramPix: true
  });
  const handleBack = () => {
    navigate('/checkout/cupom');
  };

  // Handler unificado para pagamento via Stripe
  const handlePayment = async () => {
    if (!isLoggedIn || !user?.id) {
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout/resumo');
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }
    if (finalTotal < MINIMUM_ORDER_VALUE) {
      toast.error(`O valor mínimo do pedido é R$ ${MINIMUM_ORDER_VALUE.toFixed(2)}`);
      return;
    }

    console.log('[CheckoutSummary] Iniciando processamento Stripe:', paymentMethod);

    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (selectedPlan || 1));

      await processPayment({
        sessionUser: user,
        cartItems,
        selectedPlan: selectedPlan || 1,
        totalPrice: finalTotal,
        couponId: couponValid ? couponId : null,
        paymentMethod,
        startDate,
        endDate,
        acceptTerms: true,
        unavailablePanels: [],
        handleClearCart: () => {
          localStorage.removeItem('checkout_cart');
          localStorage.removeItem('checkout_plan');
          localStorage.removeItem('checkout_coupon');
        }
      });
    } catch (error: any) {
      console.error('[CheckoutSummary] Erro no pagamento:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    }
  };
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-4 py-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="h-8 w-8 border-4 border-[#3C1361] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando resumo do pedido...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <CheckoutLayout currentStep={2} maxWidth="6xl">
      {/* Main Content Grid - Mobile Ultra Compacto */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-2 sm:gap-6 mt-2 sm:mt-0">
        {/* Left Column - Order Details */}
        <div>
          <OrderSummaryCard cartItems={cartItems} selectedPlan={selectedPlan} />
        </div>

        {/* Right Column - Payment (Sticky) */}
        <div className="lg:sticky lg:top-32 space-y-2 sm:space-y-4 h-fit">
          {/* Payment Method Selector - SEMPRE ATIVO */}
          <PaymentMethodSelector 
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            totalAmount={finalTotal}
          />

          {/* Pricing Breakdown */}
          <PricingBreakdown 
            cartItems={cartItems} 
            selectedPlan={selectedPlan} 
            couponValid={couponValid} 
            couponDiscount={couponDiscount} 
            paymentMethod={paymentMethod} 
          />

          {/* Payment Buttons - SEMPRE ATIVO */}
          <div className="space-y-1.5 sm:space-y-3">
            <Button 
              onClick={handlePayment} 
              disabled={isCreatingPayment || !isLoggedIn || (cartItems?.length || 0) === 0 || finalTotal < MINIMUM_ORDER_VALUE}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {isCreatingPayment ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  {paymentMethod === 'pix' ? 'Pagar com PIX' : 'Pagar com Cartão'}
                </>
              )}
            </Button>

            {/* Back Link */}
            <button 
              onClick={handleBack}
              className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors"
            >
              <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Voltar</span>
            </button>
          </div>
        </div>
      </div>
    </CheckoutLayout>
  );
};
export default CheckoutSummary;
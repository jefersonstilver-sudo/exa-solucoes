import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CheckoutLayout from '@/components/checkout/CheckoutLayout';
import OrderSummaryCard from '@/components/checkout/summary/OrderSummaryCard';
import PaymentMethodSelector from '@/components/checkout/summary/PaymentMethodSelector';
import PricingBreakdown from '@/components/checkout/summary/PricingBreakdown';
import PixPaymentButton from '@/components/checkout/summary/PixPaymentButton';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';
import CreditCardPaymentButton from '@/components/checkout/summary/CreditCardPaymentButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Shield, Lock, Smartphone } from 'lucide-react';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { useSimplifiedPixCheckout } from '@/hooks/useSimplifiedPixCheckout';
import { useCardCheckout } from '@/hooks/useCardCheckout';
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

  // Estados para o popup PIX
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [pixDialogData, setPixDialogData] = useState<any>(null);
  const [currentPedidoId, setCurrentPedidoId] = useState<string | null>(null);
  const {
    cartItems,
    selectedPlan,
    calculateTotalPrice,
    couponValid,
    couponId,
    couponDiscount
  } = useCheckout();
  const {
    processPixPayment,
    isProcessing: isPixProcessingHook
  } = useSimplifiedPixCheckout();
  
  const [isPixProcessing, setIsPixProcessing] = useState(false);
  const {
    processCardPayment,
    isProcessing: isCardProcessing
  } = useCardCheckout();
  console.log('[CheckoutSummary] Estado atual:', {
    isLoggedIn,
    userId: user?.id,
    cartItemsCount: cartItems?.length || 0,
    selectedPlan,
    couponValid,
    couponDiscount,
    paymentMethod,
    showPixDialog,
    hasPixData: !!pixDialogData,
    currentPedidoId,
    isPixProcessing,
    isCardProcessing
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
  const handlePixPayment = async () => {
    console.log('[CheckoutSummary] INICIANDO PAGAMENTO PIX:', {
      finalTotal,
      cartItemsCount: cartItems?.length || 0,
      selectedPlan,
      timestamp: new Date().toISOString()
    });
    
    setIsPixProcessing(true);
    
    try {
      // Adicionar delay de 500ms para garantir processamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await processPixPayment(couponValid ? couponId : undefined, couponDiscount || 0);
      
      console.log('[CheckoutSummary] RESULTADO DO PAGAMENTO PIX:', {
        success: result.success,
        hasPixData: !!result.pixData,
        error: result.error,
        pixData: result.pixData
      });
      
      if (result.success && result.pixData) {
        // Adicionar delay adicional antes de abrir o popup
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('[CheckoutSummary] ABRINDO POPUP PIX com dados:', result.pixData);
        setPixDialogData(result.pixData);
        setCurrentPedidoId(result.pixData.pedido_id || null);
        setShowPixDialog(true);
        toast.success("QR Code PIX gerado com sucesso!");
      } else {
        console.error('[CheckoutSummary] ERRO - Sem dados PIX:', result);
        toast.error(result.error || "Erro ao gerar QR Code PIX");
      }
    } catch (error: any) {
      console.error('[CheckoutSummary] ERRO CAPTURADO no pagamento PIX:', error);
      toast.error(`Erro no pagamento: ${error.message}`);
    } finally {
      setIsPixProcessing(false);
    }
  };
  const handleCardPayment = async () => {
    console.log('💳 [CheckoutSummary] INICIANDO PAGAMENTO CARTÃO:', {
      finalTotal,
      cartItemsCount: cartItems?.length || 0,
      selectedPlan,
      timestamp: new Date().toISOString()
    });
    try {
      const result = await processCardPayment(couponDiscount || 0);
      console.log('💳 [CheckoutSummary] RESULTADO DO PAGAMENTO CARTÃO:', result);
      if (result.redirected) {
        toast.success("Redirecionando para checkout...");
      }
    } catch (error: any) {
      console.error('💳 [CheckoutSummary] ERRO no pagamento cartão:', error);
      toast.error(`Erro no pagamento: ${error.message}`);
    }
  };
  const handleClosePixDialog = () => {
    console.log('[CheckoutSummary] FECHANDO POPUP PIX');
    setShowPixDialog(false);
    setPixDialogData(null);
    setCurrentPedidoId(null);
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
            {paymentMethod === 'pix' ? (
              <PixPaymentButton 
                totalAmount={finalTotal} 
                onPaymentInitiate={handlePixPayment} 
                disabled={!cartItems || cartItems.length === 0 || isPixProcessing} 
              />
            ) : (
              <CreditCardPaymentButton 
                totalAmount={finalTotal} 
                onPaymentInitiate={handleCardPayment} 
                disabled={!cartItems || cartItems.length === 0 || isCardProcessing} 
              />
            )}

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

      {/* PIX QR Code Dialog */}
      <PixQrCodeDialog
        isOpen={showPixDialog}
        onClose={handleClosePixDialog}
        qrCodeBase64={pixDialogData?.qrCodeBase64 || pixDialogData?.pix_base64}
        qrCodeText={pixDialogData?.qrCodeText || pixDialogData?.pix_url}
        paymentLink={pixDialogData?.paymentLink}
        pix_url={pixDialogData?.pix_url}
        pix_base64={pixDialogData?.pix_base64}
        userId={user?.id}
        pedidoId={currentPedidoId || undefined}
      />
    </CheckoutLayout>
  );
};
export default CheckoutSummary;
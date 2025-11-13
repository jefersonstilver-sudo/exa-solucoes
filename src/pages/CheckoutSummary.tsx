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
    isProcessing: isPixProcessing
  } = useSimplifiedPixCheckout();
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
    try {
      const result = await processPixPayment(couponValid ? couponId : undefined, couponDiscount || 0);
      console.log('[CheckoutSummary] RESULTADO DO PAGAMENTO PIX:', {
        success: result.success,
        hasPixData: !!result.pixData,
        error: result.error,
        pixData: result.pixData
      });
      if (result.success && result.pixData) {
        console.log('[CheckoutSummary] ABRINDO POPUP PIX com dados:', result.pixData);
        setPixDialogData(result.pixData);
        setCurrentPedidoId(result.pixData.pedido_id || null);
        setShowPixDialog(true);
        toast.success("QR Code PIX gerado com sucesso!");
      } else {
        console.error('[CheckoutSummary] ERRO - Sem dados PIX:', result);
        // FORÇAR ABERTURA DO POPUP MESMO SEM DADOS VÁLIDOS (para debugging)
        setPixDialogData({
          qrCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          qrCodeText: '00020126330014BR.GOV.BCB.PIX0111123456789015204000053039865802BR5913TESTE EMPRESA6008BRASILIA62070503***6304TEST',
          pix_url: '00020126330014BR.GOV.BCB.PIX0111123456789015204000053039865802BR5913TESTE EMPRESA6008BRASILIA62070503***6304TEST'
        });
        setCurrentPedidoId('test-pedido-id');
        setShowPixDialog(true);
        toast.error("Erro ao gerar QR Code PIX, usando dados de teste");
      }
    } catch (error: any) {
      console.error('[CheckoutSummary] ERRO CAPTURADO no pagamento PIX:', error);
      toast.error(`Erro no pagamento: ${error.message}`);

      // FORÇAR ABERTURA DO POPUP MESMO COM ERRO (para debugging)
      setPixDialogData({
        qrCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        qrCodeText: '00020126330014BR.GOV.BCB.PIX0111123456789015204000053039865802BR5913TESTE EMPRESA6008BRASILIA62070503***6304TEST',
        pix_url: '00020126330014BR.GOV.BCB.PIX0111123456789015204000053039865802BR5913TESTE EMPRESA6008BRASILIA62070503***6304TEST'
      });
      setCurrentPedidoId('test-pedido-id');
      setShowPixDialog(true);
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
      {/* Main Content Grid - Mobile Otimizado */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3 sm:gap-6">
        {/* Left Column - Order Details */}
        <div>
          <OrderSummaryCard cartItems={cartItems} selectedPlan={selectedPlan} />
        </div>

        {/* Right Column - Payment (Sticky) */}
        <div className="lg:sticky lg:top-32 space-y-3 sm:space-y-4 h-fit">
          {/* Payment Method Selector */}
          {isPedidoComValorMinimo ? (
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
              <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-3">Forma de Pagamento</h3>
              <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-800 text-xs sm:text-sm">Cupom 100% - Valor Mínimo</p>
                  <p className="text-[10px] sm:text-xs text-green-600">PIX de R$ 0,05 (ativação)</p>
                </div>
                <p className="font-bold text-green-700 text-sm sm:text-base">R$ 0,05</p>
              </div>
            </div>
          ) : (
            <PaymentMethodSelector 
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              totalAmount={baseTotal}
            />
          )}

          {/* Pricing Breakdown */}
          <PricingBreakdown 
            cartItems={cartItems} 
            selectedPlan={selectedPlan} 
            couponValid={couponValid} 
            couponDiscount={couponDiscount} 
            paymentMethod={paymentMethod} 
          />

          {/* Payment Buttons */}
          <div className="space-y-2 sm:space-y-3">
            {isPedidoComValorMinimo ? (
              <button 
                onClick={handlePixPayment} 
                disabled={!cartItems || cartItems.length === 0 || isPixProcessing} 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPixProcessing ? (
                  <>
                    <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Gerar QR Code</span>
                  </>
                )}
              </button>
            ) : (
              paymentMethod === 'pix' ? (
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
              )
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
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import OrderSummaryCard from '@/components/checkout/summary/OrderSummaryCard';
import PaymentMethodSelector from '@/components/checkout/summary/PaymentMethodSelector';
import PricingBreakdown from '@/components/checkout/summary/PricingBreakdown';
import PixPaymentButton from '@/components/checkout/summary/PixPaymentButton';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';
import CreditCardPaymentButton from '@/components/checkout/summary/CreditCardPaymentButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Shield, Lock } from 'lucide-react';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { useSimplifiedPixCheckout } from '@/hooks/useSimplifiedPixCheckout';
import { useCardCheckout } from '@/hooks/useCardCheckout';
import { toast } from 'sonner';
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
    paymentMethod
  });
  const pixDiscount = 5; // 5% desconto PIX
  const pixTotal = Math.max(0, baseTotal * (1 - pixDiscount / 100));
  const cardTotal = Math.max(0, baseTotal); // Cartão sem desconto

  // Detectar se é pedido gratuito (cupom 100%)
  const isFreeOrder = pixTotal <= 0;
  const handleBack = () => {
    navigate('/checkout/cupom');
  };
  const handlePixPayment = async () => {
    console.log('[CheckoutSummary] INICIANDO PAGAMENTO PIX:', {
      pixTotal,
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
      cardTotal,
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
    return <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 py-8 flex items-center justify-center">
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="text-center">
            <div className="h-8 w-8 border-4 border-[#3C1361] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando resumo do pedido...</p>
          </motion.div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-24">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
          {/* Progress Header */}
          <motion.div initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="bg-white rounded-2xl shadow-lg border p-4 sm:p-6 mb-6 sm:mb-8">
            <UnifiedCheckoutProgress currentStep={2} />
          </motion.div>

          {/* Page Title */}
          <motion.div initial={{
          opacity: 0,
          y: -10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.1
        }} className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#3C1361] to-purple-600 bg-clip-text text-transparent mb-2">
              Resumo do Pedido
            </h1>
            <p className="text-gray-600 text-lg">
              Confira todos os detalhes antes de finalizar sua campanha
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.2
            }}>
                <OrderSummaryCard cartItems={cartItems} selectedPlan={selectedPlan} />
              </motion.div>
            </div>

            {/* Right Column - Payment */}
            <div className="space-y-6">
              <motion.div initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.3
            }}>
                {/* Payment Methods Comparison */}
                <div className="bg-white rounded-2xl shadow-lg border p-6">
                  <h3 className="text-xl font-bold text-[#3C1361] mb-4">Formas de Pagamento</h3>
                  <div className="space-y-4">
                    {isFreeOrder ? <div className="flex items-center space-x-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium text-green-800">Pedido Gratuito - Cupom 100%</p>
                          <p className="text-sm text-green-600">Acesso liberado imediatamente</p>
                        </div>
                        <p className="font-bold text-green-700">R$ 0,00</p>
                      </div> : <>
                        <div className="flex items-center space-x-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-green-800">PIX - 5% de desconto</p>
                            <p className="text-sm text-green-600">Pagamento instantâneo aprovado</p>
                          </div>
                          <p className="font-bold text-green-700">R$ {pixTotal.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-blue-800">Cartão de Crédito</p>
                            <p className="text-sm text-blue-600">Parcelamento em até 12x</p>
                          </div>
                          <p className="font-bold text-blue-700">R$ {cardTotal.toFixed(2)}</p>
                        </div>
                      </>}
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.4
            }}>
                <PricingBreakdown cartItems={cartItems} selectedPlan={selectedPlan} couponValid={couponValid} couponDiscount={couponDiscount} pixDiscount={pixDiscount} paymentMethod={paymentMethod} />
              </motion.div>
            </div>
          </div>

          {/* Payment Actions */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5
        }} className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8">
            <div className="flex flex-col space-y-6">
              {/* Security Notice */}
              

              {/* Payment Buttons */}
              <div className="space-y-4">
                {isFreeOrder ? (/* Botão para Pedido Gratuito */
              <motion.button whileHover={{
                scale: 1.02
              }} whileTap={{
                scale: 0.98
              }} onClick={handlePixPayment} disabled={!cartItems || cartItems.length === 0 || isPixProcessing} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold">Finalizar Pedido Gratuito</div>
                        <div className="text-sm opacity-90">Cupom de 100% aplicado - R$ 0,00</div>
                      </div>
                    </div>
                  </motion.button>) : <>
                    {/* PIX Payment Button */}
                    <PixPaymentButton totalAmount={pixTotal} onPaymentInitiate={handlePixPayment} disabled={!cartItems || cartItems.length === 0 || isPixProcessing} />

                    {/* Credit Card Payment Button */}
                    <CreditCardPaymentButton totalAmount={cardTotal} onPaymentInitiate={handleCardPayment} disabled={!cartItems || cartItems.length === 0 || isCardProcessing} />
                  </>}
              </div>

              {/* Back Button */}
              <Button variant="outline" onClick={handleBack} className="flex items-center justify-center space-x-2 w-full sm:w-auto mx-auto border-2 hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar para Cupons</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* PIX QR Code Dialog - SEMPRE RENDERIZADO COM DADOS COMPLETOS */}
      <PixQrCodeDialog isOpen={showPixDialog} onClose={handleClosePixDialog} qrCodeBase64={pixDialogData?.qrCodeBase64 || pixDialogData?.pix_base64} qrCodeText={pixDialogData?.qrCodeText || pixDialogData?.pix_url} paymentLink={pixDialogData?.paymentLink} pix_url={pixDialogData?.pix_url} pix_base64={pixDialogData?.pix_base64} userId={user?.id} pedidoId={currentPedidoId || undefined} />
    </Layout>;
};
export default CheckoutSummary;
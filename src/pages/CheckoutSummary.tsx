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
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Shield, Lock } from 'lucide-react';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { useSimplifiedPixCheckout } from '@/hooks/useSimplifiedPixCheckout';
import { toast } from 'sonner';

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  const [hasValidatedCart, setHasValidatedCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  
  // Estados para o popup PIX
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [pixDialogData, setPixDialogData] = useState<any>(null);
  
  const {
    cartItems,
    selectedPlan,
    calculateTotalPrice,
    couponValid,
    couponDiscount
  } = useCheckout();

  const { processPixPayment, isProcessing } = useSimplifiedPixCheckout();

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
    isProcessing
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
  const pixTotal = paymentMethod === 'pix' ? baseTotal * (1 - pixDiscount / 100) : baseTotal;
  const finalTotal = paymentMethod === 'pix' ? pixTotal : baseTotal;

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
      const result = await processPixPayment(
        couponValid ? undefined : undefined, 
        couponDiscount || 0
      );

      console.log('[CheckoutSummary] RESULTADO DO PAGAMENTO PIX:', {
        success: result.success,
        hasPixData: !!result.pixData,
        error: result.error,
        pixData: result.pixData
      });

      if (result.success && result.pixData) {
        console.log('[CheckoutSummary] ABRINDO POPUP PIX com dados:', result.pixData);
        setPixDialogData(result.pixData);
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
      setShowPixDialog(true);
    }
  };

  const handleClosePixDialog = () => {
    console.log('[CheckoutSummary] FECHANDO POPUP PIX');
    setShowPixDialog(false);
    setPixDialogData(null);
  };

  const handleCreditCardPayment = () => {
    console.log('[CheckoutSummary] Cartão de crédito temporariamente desabilitado');
    toast.info("Cartão de crédito temporariamente indisponível. Use PIX.");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 py-8 flex items-center justify-center">
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-24">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
          {/* Progress Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <UnifiedCheckoutProgress currentStep={2} />
          </motion.div>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
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
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <OrderSummaryCard
                  cartItems={cartItems}
                  selectedPlan={selectedPlan}
                />
              </motion.div>
            </div>

            {/* Right Column - Payment */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* FORÇAR APENAS PIX - DESABILITAR CARTÃO */}
                <div className="bg-white rounded-2xl shadow-lg border p-6">
                  <h3 className="text-xl font-bold text-[#3C1361] mb-4">Forma de Pagamento</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium text-green-800">PIX - 5% de desconto</p>
                        <p className="text-sm text-green-600">Pagamento instantâneo aprovado</p>
                      </div>
                      <p className="font-bold text-green-700">R$ {finalTotal.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-100 border border-gray-200 rounded-lg opacity-50">
                      <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-500">Cartão de Crédito</p>
                        <p className="text-sm text-gray-400">Temporariamente indisponível</p>
                      </div>
                      <p className="font-medium text-gray-400">R$ {baseTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <PricingBreakdown
                  cartItems={cartItems}
                  selectedPlan={selectedPlan}
                  couponValid={couponValid}
                  couponDiscount={couponDiscount}
                  pixDiscount={pixDiscount}
                  paymentMethod={paymentMethod}
                />
              </motion.div>
            </div>
          </div>

          {/* Payment Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8"
          >
            <div className="flex flex-col space-y-6">
              {/* Security Notice */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <div className="font-medium mb-1">Pagamento 100% Seguro</div>
                    <p className="text-blue-700">
                      Todos os dados são criptografados e processados com segurança máxima. 
                      Webhook configurado: <code className="text-xs bg-blue-100 px-1 rounded">
                        https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19
                      </code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Button - APENAS PIX */}
              <PixPaymentButton
                totalAmount={finalTotal}
                onPaymentInitiate={handlePixPayment}
                disabled={!cartItems || cartItems.length === 0 || isProcessing}
              />

              {/* Back Button */}
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto mx-auto border-2 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar para Cupons</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* PIX QR Code Dialog - SEMPRE RENDERIZADO */}
      <PixQrCodeDialog
        isOpen={showPixDialog}
        onClose={handleClosePixDialog}
        qrCodeBase64={pixDialogData?.qrCodeBase64 || pixDialogData?.pix_base64}
        qrCodeText={pixDialogData?.qrCodeText || pixDialogData?.pix_url}
        paymentLink={pixDialogData?.paymentLink}
        pix_url={pixDialogData?.pix_url}
        pix_base64={pixDialogData?.pix_base64}
      />
    </Layout>
  );
};

export default CheckoutSummary;

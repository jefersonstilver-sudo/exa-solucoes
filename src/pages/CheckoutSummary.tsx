import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CheckoutLayout from '@/components/checkout/CheckoutLayout';
import OrderSummaryCard from '@/components/checkout/summary/OrderSummaryCard';
import PaymentMethodSelector, { PaymentMethodType } from '@/components/checkout/summary/PaymentMethodSelector';
import PricingBreakdown from '@/components/checkout/summary/PricingBreakdown';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useUserSession } from '@/hooks/useUserSession';
import { useAuth } from '@/hooks/useAuth';
import { useCheckout } from '@/hooks/useCheckout';
import { usePaymentFlow } from '@/hooks/payment/usePaymentFlow';
import { toast } from 'sonner';
import { getMinimumOrderValue } from '@/utils/priceCalculator';
import Layout from '@/components/layout/Layout';
import { useCartValidation } from '@/hooks/useCartValidation';
import { getValidPanels } from '@/utils/cleanupInvalidData';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';
import CreditCardCheckoutModal from '@/components/checkout/payment/CreditCardCheckoutModal';
import ContractDataCollectionModal from '@/components/checkout/contract/ContractDataCollectionModal';
import { supabase } from '@/integrations/supabase/client';
import { useCheckoutPro } from '@/hooks/payment/useCheckoutPro';
import AdminCheckoutBlocker from '@/components/checkout/AdminCheckoutBlocker';

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const {
    isLoggedIn,
    user,
    isLoading
  } = useUserSession();
  
  const { isSuperAdmin } = useAuth();
  
  const [hasValidatedCart, setHasValidatedCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pix_avista');
  
  // Estados para o popup PIX
  const [isPixDialogOpen, setIsPixDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; qrCodeText: string; pedidoId: string } | null>(null);
  
  // Estados para o modal de cartão
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  
  // Estados para o modal de contrato pós-pagamento
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [pendingContractOrderId, setPendingContractOrderId] = useState<string | null>(null);
  
  // Hook para checkout direto com Mercado Pago
  const { createCheckoutProSession, isProcessing: isProcessingCheckout } = useCheckoutPro();

  const {
    cartItems,
    selectedPlan,
    calculateTotalPrice,
    couponValid,
    couponId,
    couponDiscount,
    couponCode,
    couponCategoria
  } = useCheckout();
  
  const { isCreatingPayment, processPayment } = usePaymentFlow();
  const { validateCartPanels } = useCartValidation();
  
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

  // Verificação de autenticação
  useEffect(() => {
    if (isLoading) return;
    
    // Verificar autenticação
    if (!isLoggedIn || !user?.id) {
      console.log('[CheckoutSummary] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout/resumo');
    }
  }, [isLoggedIn, user?.id, isLoading, navigate]);

  // 🆕 FASE 2: Validação do carrinho com verificação de prédios
  useEffect(() => {
    if (isLoading || !isLoggedIn || hasValidatedCart) return;
    
    // Limpar bloqueio de pagamento duplicado quando entra na página
    try {
      localStorage.removeItem('last_payment_submission');
      console.log('[CheckoutSummary] Bloqueio de pagamento limpo');
    } catch (e) {
      console.error('[CheckoutSummary] Erro ao limpar bloqueio:', e);
    }
    
    const validateCartTimer = setTimeout(async () => {
      console.log('[CheckoutSummary] Validando carrinho:', {
        cartItemsLength: cartItems?.length || 0,
        selectedPlan,
        timestamp: new Date().toISOString()
      });
      
      if (!cartItems || cartItems.length === 0) {
        console.log('[CheckoutSummary] Carrinho vazio detectado');
        toast.error("Seu carrinho está vazio. Adicione prédios para continuar.", {
          duration: 5000,
          action: {
            label: "Ir para Loja",
            onClick: () => navigate('/paineis-digitais/loja')
          }
        });
      } else {
        // Validar se os prédios existem no banco
        const buildingIds = cartItems.map(item => item.panel?.buildings?.id).filter(Boolean) as string[];
        if (buildingIds.length > 0) {
          await validateCartPanels(buildingIds);
        }
      }
      
      setHasValidatedCart(true);
    }, 1500);
    return () => clearTimeout(validateCartTimer);
  }, [isLoggedIn, cartItems, navigate, isLoading, hasValidatedCart, selectedPlan, validateCartPanels]);

  // Calcular preços usando função centralizada
  const baseTotal = calculateTotalPrice();
  
  // Map legacy payment methods for minimum value calculation
  const legacyPaymentMethod = paymentMethod === 'credit_card' ? 'credit_card' : 'pix';
  const minimumValue = getMinimumOrderValue(legacyPaymentMethod);
  
  // 🎯 DETECTAR CUPOM 573040 (teste)
  const isCupom573040 = couponCode === '573040';
  
  // 🎁 DETECTAR CUPOM CORTESIA - Usar categoria do cupom
  const isCortesia = couponCategoria === 'cortesia' || (couponCode?.toUpperCase().trim() === 'CORTESIA_ADMIN' && baseTotal === 0);
  
  // 💰 Calcular valor com desconto PIX à vista (5%)
  const pixAvistaDiscount = 0.05;
  const totalAfterCoupon = baseTotal;
  
  // Aplicar desconto PIX à vista se selecionado
  const totalWithPixDiscount = paymentMethod === 'pix_avista' 
    ? totalAfterCoupon * (1 - pixAvistaDiscount) 
    : totalAfterCoupon;
  
  // CRÍTICO: Garantir valor mínimo correto por método
  const finalTotal = isCupom573040 ? 0.05 : Math.max(totalWithPixDiscount, minimumValue);

  // Verificar se foi aplicado o mínimo
  const isPedidoComValorMinimo = finalTotal === minimumValue && totalWithPixDiscount < minimumValue;
  
  // Verificar se é método fidelidade (redireciona para outra página)
  const isFidelidade = paymentMethod === 'pix_fidelidade' || paymentMethod === 'boleto_fidelidade';
  
  console.log('[CheckoutSummary] Preços calculados:', {
    baseTotal,
    totalAfterCoupon,
    totalWithPixDiscount,
    finalTotal,
    paymentMethod,
    isFidelidade,
    minimumValue,
    couponCode: couponCode || 'SEM CÓDIGO',
    isCortesia
  });
  const handleBack = () => {
    navigate('/checkout/cupom');
  };

  // Handler unificado para pagamento
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
    
    // 🔄 FIDELIDADE: Redirecionar para página de dados do contrato
    if (isFidelidade) {
      localStorage.setItem('checkout_payment_method', paymentMethod);
      navigate('/checkout/fidelidade');
      return;
    }
    
    // 🎯 EXCEÇÃO: Cupom 573040 permite valor mínimo de R$ 0,05
    if (!isCupom573040 && finalTotal < minimumValue) {
      toast.error(`O valor mínimo do pedido é R$ ${minimumValue.toFixed(2)}`);
      return;
    }

    // 💳 Abrir modal para cartão de crédito
    if (paymentMethod === 'credit_card') {
      console.log('[CheckoutSummary] Abrindo modal de cartão');
      setIsCardModalOpen(true);
      return;
    }

    // 🎯 PIX à Vista: Continua com o fluxo normal (gera QR code)
    console.log('[CheckoutSummary] Processando pagamento PIX à Vista');

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
        couponCode: couponValid ? couponCode : null,  // Pass couponCode for server-side price validation
        paymentMethod: 'pix', // Legacy format for processPayment
        startDate,
        endDate,
        acceptTerms: true,
        unavailablePanels: [],
        handleClearCart: () => {
          localStorage.removeItem('checkout_cart');
          localStorage.removeItem('checkout_plan');
          localStorage.removeItem('checkout_coupon');
        },
        onPixGenerated: (pixResponse) => {
          console.log('[CheckoutSummary] QR Code PIX gerado:', pixResponse);
          setPixData(pixResponse);
          setIsPixDialogOpen(true);
        }
      });
    } catch (error: any) {
      console.error('[CheckoutSummary] Erro no pagamento:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    }
  };
  
  // 💳 Handler para checkout direto com cartão (via modal)
  const handleCardCheckout = async () => {
    if (!isLoggedIn || !user?.id) {
      toast.error("Você precisa estar logado");
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (selectedPlan || 1));

    console.log('[CheckoutSummary] Iniciando checkout direto com cartão');

    await createCheckoutProSession({
      sessionUser: user,
      cartItems,
      selectedPlan: selectedPlan || 1,
      totalPrice: finalTotal,
      couponId: couponValid ? couponId : null,
      couponCode: couponValid ? couponCode : null,  // Pass couponCode for server-side price validation
      startDate,
      endDate
    });

    // Limpar carrinho após iniciar checkout
    localStorage.removeItem('checkout_cart');
    localStorage.removeItem('checkout_plan');
    localStorage.removeItem('checkout_coupon');
    
    // Fechar modal
    setIsCardModalOpen(false);
  };
  
  // 🎁 HANDLER PARA FINALIZAR PEDIDO CORTESIA
  const handleFinalizarCortesia = async () => {
    if (!isLoggedIn || !user?.id) {
      toast.error("Você precisa estar logado");
      return;
    }
    
    if (!cartItems || cartItems.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }

    console.log('🎁 [CORTESIA] Iniciando criação de pedido cortesia');

    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (selectedPlan || 1));

      const { data, error } = await supabase.functions.invoke('create-cortesia-order', {
        body: {
          cartItems,
          selectedPlan: selectedPlan || 1,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          couponId: couponValid ? couponId : null
        }
      });

      if (error) throw error;

      console.log('✅ [CORTESIA] Pedido criado:', data);

      // Limpar carrinho
      localStorage.removeItem('checkout_cart');
      localStorage.removeItem('checkout_plan');
      localStorage.removeItem('checkout_coupon');

      toast.success('🎁 Pedido cortesia criado com sucesso!');
      
      // Redirect com parâmetro para mostrar modal de sucesso
      navigate(`/anunciante/pedidos?cortesia_success=${data.pedidoId}`);
    } catch (error: any) {
      console.error('❌ [CORTESIA] Erro:', error);
      toast.error(error.message || 'Erro ao criar pedido cortesia');
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
            <div className="h-8 w-8 border-4 border-[#9C1E1E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando resumo do pedido...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <AdminCheckoutBlocker>
    <CheckoutLayout currentStep={2} maxWidth="6xl">
      {/* Main Content Grid - Mobile Otimizado */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
        {/* Left Column - Order Details + Resumo Financeiro */}
        <div className="space-y-3 sm:space-y-4">
          <OrderSummaryCard cartItems={cartItems} selectedPlan={selectedPlan} />
          
          {/* Pricing Breakdown - Movido para cá */}
          <PricingBreakdown 
            cartItems={cartItems} 
            selectedPlan={selectedPlan} 
            couponValid={couponValid} 
            couponDiscount={couponDiscount} 
            paymentMethod={paymentMethod}
            couponCode={couponCode}
            couponCategoria={couponCategoria}
            finalTotal={finalTotal}
          />
        </div>

        {/* Right Column - Payment (Sticky) */}
        <div className="lg:sticky lg:top-32 space-y-3 sm:space-y-4 h-fit">
          {/* Payment Method Selector - OCULTAR SE CORTESIA */}
          {!isCortesia && (
            <PaymentMethodSelector 
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              totalAmount={baseTotal}
              selectedPlan={selectedPlan || 1}
              couponCode={couponCode}
            />
          )}
          
          {/* Mensagem Cortesia - Design Corporativo */}
          {isCortesia && (
            <div className="p-4 sm:p-6 bg-slate-50 border border-slate-300 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 rounded">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800">Pedido Cortesia</h3>
                  <p className="text-xs sm:text-sm text-slate-600">Isento de cobrança</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Buttons - CORTESIA OU NORMAL */}
          <div className="space-y-1.5 sm:space-y-3">
            {isCortesia ? (
              <Button 
                onClick={handleFinalizarCortesia} 
                disabled={!isLoggedIn || (cartItems?.length || 0) === 0}
                className="w-full h-14 text-lg font-semibold bg-[#9C1E1E] hover:bg-[#7A1818] disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                Finalizar Pedido Cortesia
              </Button>
            ) : (
              <Button 
                onClick={handlePayment} 
                disabled={isCreatingPayment || !isLoggedIn || (cartItems?.length || 0) === 0 || (!isCupom573040 && finalTotal < minimumValue)}
                className="w-full h-14 text-lg font-semibold bg-[#9C1E1E] hover:bg-[#7A1818] disabled:opacity-50"
                size="lg"
              >
                {isCreatingPayment ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    {isFidelidade 
                      ? 'Continuar para Contrato' 
                      : paymentMethod === 'pix_avista' 
                        ? 'Pagar com PIX' 
                        : 'Pagar com Cartão'}
                  </>
                )}
              </Button>
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
      
      {/* Popup PIX - abre quando QR code é gerado */}
      <PixQrCodeDialog
        isOpen={isPixDialogOpen}
        onClose={() => setIsPixDialogOpen(false)}
        qrCodeBase64={pixData?.qrCodeBase64}
        qrCodeText={pixData?.qrCodeText}
        userId={user?.id}
        pedidoId={pixData?.pedidoId}
      />
      
      {/* Modal de Cartão - checkout direto com Mercado Pago */}
      <CreditCardCheckoutModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        totalAmount={finalTotal}
        itemCount={cartItems?.length || 0}
        onProceedToCheckout={handleCardCheckout}
      />
      
      {/* Modal de Coleta de Dados do Contrato - pós pagamento */}
      <ContractDataCollectionModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        pedidoId={pendingContractOrderId || ''}
        userEmail={user?.email || ''}
        userName={user?.nome || ''}
        onSuccess={() => {
          setIsContractModalOpen(false);
          setPendingContractOrderId(null);
          navigate(`/anunciante/pedidos?contract_sent=${pendingContractOrderId}`);
        }}
      />
    </CheckoutLayout>
    </AdminCheckoutBlocker>
  );
};
export default CheckoutSummary;
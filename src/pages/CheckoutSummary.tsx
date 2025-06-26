
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import OrderSummaryCard from '@/components/checkout/summary/OrderSummaryCard';
import PaymentMethodSelector from '@/components/checkout/summary/PaymentMethodSelector';
import PricingBreakdown from '@/components/checkout/summary/PricingBreakdown';
import PixPaymentButton from '@/components/checkout/summary/PixPaymentButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { useSimplifiedPixCheckout } from '@/hooks/useSimplifiedPixCheckout';
import { toast } from 'sonner';

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  const [hasValidatedCart, setHasValidatedCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  
  const {
    cartItems,
    selectedPlan,
    calculateTotalPrice,
    couponValid,
    couponDiscount
  } = useCheckout();

  const { processPixPayment, isProcessing } = useSimplifiedPixCheckout();

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

  // Calcular preços
  const baseTotal = calculateTotalPrice();
  const pixDiscount = 5; // 5% desconto PIX
  const pixTotal = paymentMethod === 'pix' ? baseTotal * (1 - pixDiscount / 100) : baseTotal;
  const finalTotal = paymentMethod === 'pix' ? pixTotal : baseTotal;

  const handleBack = () => {
    navigate('/checkout/cupom');
  };

  const handlePixPayment = async () => {
    console.log('[CheckoutSummary] Iniciando pagamento PIX:', {
      finalTotal,
      cartItemsCount: cartItems?.length || 0,
      selectedPlan,
      webhookUrl: 'https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19'
    });

    const success = await processPixPayment(
      couponValid ? undefined : undefined, 
      couponDiscount || 0
    );

    if (success) {
      toast.success("Redirecionando para pagamento PIX...");
    }
  };

  const handleCreditCardPayment = () => {
    console.log('[CheckoutSummary] Iniciando pagamento com cartão');
    toast.info("Redirecionando para pagamento com cartão...");
    // Implementar integração com gateway de cartão
    navigate('/checkout/payment?method=credit_card');
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
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onMethodChange={setPaymentMethod}
                  totalAmount={baseTotal}
                  pixDiscount={pixDiscount}
                />
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
              {/* Payment Button */}
              {paymentMethod === 'pix' ? (
                <PixPaymentButton
                  totalAmount={finalTotal}
                  onPaymentInitiate={handlePixPayment}
                  disabled={!cartItems || cartItems.length === 0 || isProcessing}
                />
              ) : (
                <Button
                  onClick={handleCreditCardPayment}
                  disabled={!cartItems || cartItems.length === 0}
                  className="w-full h-16 text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-6 w-6" />
                    <div className="flex flex-col items-start">
                      <span>Pagar com Cartão</span>
                      <span className="text-sm font-normal opacity-90">
                        R$ {finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Button>
              )}

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
    </Layout>
  );
};

export default CheckoutSummary;

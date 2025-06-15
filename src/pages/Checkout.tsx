
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import PaymentStep from '@/components/checkout/PaymentStep';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { useUnifiedCheckout } from '@/hooks/useUnifiedCheckout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Checkout = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  const [paymentMethod, setPaymentMethod] = useState('pix');
  
  const {
    cartItems,
    calculateTotalPrice,
    acceptTerms,
    setAcceptTerms,
    selectedPlan,
    couponValid,
    couponDiscount,
    startDate,
    endDate,
    PLANS
  } = useCheckout();

  const {
    currentTransactionId,
    sessionPrice,
    processPixPayment,
    isProcessing,
    currentStep
  } = useUnifiedCheckout();

  // Verificação de autenticação
  useEffect(() => {
    if (isLoading) return;
    
    if (!isLoggedIn || !user?.id) {
      console.log('[Checkout] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, user?.id, isLoading, navigate]);

  // Verificar se o checkout foi inicializado
  useEffect(() => {
    if (isLoading || !isLoggedIn) return;

    if (!currentTransactionId) {
      console.log('[Checkout] No transaction found, redirecting to summary');
      toast.error("Sessão de checkout não encontrada. Redirecionando...");
      navigate('/checkout/resumo');
    }
  }, [currentTransactionId, isLoading, isLoggedIn, navigate]);

  const totalPrice = sessionPrice || calculateTotalPrice();

  const handleBack = () => {
    navigate('/checkout/resumo');
  };

  const handlePaymentSubmit = async () => {
    if (!acceptTerms) {
      toast.error("Você deve aceitar os termos para continuar");
      return;
    }

    if (!currentTransactionId) {
      toast.error("Sessão de checkout não encontrada");
      navigate('/checkout/resumo');
      return;
    }

    console.log('[Checkout] Processing payment:', {
      paymentMethod,
      totalPrice,
      transactionId: currentTransactionId
    });

    if (paymentMethod === 'pix') {
      try {
        // Buscar o pedido criado para obter o ID
        const pedidoId = currentTransactionId; // O sistema unificado usa o mesmo ID
        const success = await processPixPayment(pedidoId);
        
        if (!success) {
          toast.error("Erro ao processar pagamento PIX");
        }
        // Se sucesso, a navegação é feita automaticamente pelo hook
      } catch (error) {
        console.error('[Checkout] Error processing PIX payment:', error);
        toast.error("Erro ao processar pagamento PIX");
      }
    } else {
      toast.error("Método de pagamento não suportado ainda");
    }
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
            <p className="text-gray-600">Carregando checkout...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
          {/* Progress Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <UnifiedCheckoutProgress currentStep={3} />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Payment Method Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-white rounded-xl shadow-lg border p-4 sm:p-6 lg:p-8"
            >
              <PaymentStep
                acceptTerms={acceptTerms}
                setAcceptTerms={setAcceptTerms}
                totalPrice={totalPrice}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />

              {/* Payment Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex items-center space-x-2"
                    disabled={isProcessing}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar</span>
                  </Button>

                  <Button
                    onClick={handlePaymentSubmit}
                    disabled={!acceptTerms || isProcessing}
                    className="flex items-center space-x-2 bg-[#3C1361] hover:bg-[#3C1361]/90 px-8"
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <span>Gerar PIX</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-1"
            >
              <CheckoutSummary
                cartItems={cartItems}
                selectedPlan={selectedPlan || 1}
                plans={PLANS}
                couponDiscount={couponDiscount}
                couponValid={couponValid}
                startDate={startDate}
                endDate={endDate}
                paymentMethod={paymentMethod}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;

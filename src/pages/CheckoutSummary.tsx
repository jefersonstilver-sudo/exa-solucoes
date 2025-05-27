
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import ReviewStep from '@/components/checkout/ReviewStep';
import { useCheckout } from '@/hooks/useCheckout';
import { useUserSession } from '@/hooks/useUserSession';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading, user } = useUserSession();
  
  const {
    handleNextStep,
    handlePrevStep,
    calculateTotalPrice,
    couponValid,
    couponDiscount,
    isNavigating,
    cartItems
  } = useCheckout();

  // Validação de autenticação crítica
  useEffect(() => {
    console.log('[CheckoutSummary] Validação de auth:', { isLoggedIn, isLoading, hasUser: !!user });
    
    if (!isLoading && !isLoggedIn) {
      logCheckoutEvent(
        CheckoutEvent.AUTH_EVENT,
        LogLevel.WARNING,
        'Usuário não autenticado tentando acessar resumo do checkout',
        { timestamp: new Date().toISOString() }
      );
      
      toast.error("Você precisa estar logado para finalizar a compra");
      navigate('/login?redirect=/checkout/resumo');
    }
  }, [isLoggedIn, isLoading, navigate, user]);

  // Validação do carrinho
  useEffect(() => {
    if (!isLoading && isLoggedIn && cartItems.length === 0) {
      toast.error("Seu carrinho está vazio");
      navigate('/paineis-digitais/loja');
    }
  }, [isLoading, isLoggedIn, cartItems.length, navigate]);

  const totalPrice = calculateTotalPrice();

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  // Redirect if not authenticated (handled by useEffect above)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Timeline Progress */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6 mb-8"
          >
            <CheckoutProgress currentStep={2} />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border p-6 sm:p-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-xl font-semibold flex items-center">
                  <span className="mr-2 text-2xl">📋</span>
                  Revisão do Pedido
                </h2>
                <p className="text-sm text-muted-foreground">
                  Confirme os detalhes da sua campanha antes de prosseguir
                </p>
              </motion.div>
              <ReviewStep />
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-between items-center mt-8"
          >
            <Button
              variant="outline"
              onClick={handlePrevStep}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Total: R$ {totalPrice.toFixed(2)}
              </p>
              {couponValid && couponDiscount > 0 && (
                <p className="text-sm text-green-600">
                  Desconto aplicado: {couponDiscount}%
                </p>
              )}
            </div>

            <Button
              onClick={() => handleNextStep()}
              disabled={isNavigating || !user}
              className="flex items-center space-x-2 bg-[#3C1361] hover:bg-[#3C1361]/90"
            >
              <span>Ir para Pagamento</span>
              {isNavigating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutSummary;

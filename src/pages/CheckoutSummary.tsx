
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import PaymentProgressHeader from '@/components/checkout/payment/PaymentProgressHeader';
import ReviewStep from '@/components/checkout/ReviewStep';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  
  const {
    cartItems,
    calculateTotalPrice,
    couponValid,
    couponDiscount
  } = useCheckout();

  // Verificação de autenticação otimizada
  useEffect(() => {
    if (isLoading) return;
    
    if (!isLoggedIn || !user?.id) {
      console.log('[CheckoutSummary] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout/resumo');
    }
  }, [isLoggedIn, user?.id, isLoading, navigate]);

  // Validação do carrinho
  useEffect(() => {
    if (isLoading) return;
    
    if (isLoggedIn && cartItems.length === 0) {
      console.log('[CheckoutSummary] Cart is empty, redirecting to store');
      toast.error("Seu carrinho está vazio");
      navigate('/paineis-digitais/loja');
    }
  }, [isLoggedIn, cartItems.length, navigate, isLoading]);

  const totalPrice = calculateTotalPrice();

  const handleBack = () => {
    navigate('/checkout/cupom');
  };

  const handleNext = () => {
    // Navegação direta e simples para a página de pagamento
    navigate('/checkout');
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="h-8 w-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando autenticação...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Progress Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <PaymentProgressHeader currentStep={1} />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border p-6 sm:p-8"
          >
            <ReviewStep />
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4"
          >
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>

            <div className="text-center order-first sm:order-none">
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
              onClick={handleNext}
              disabled={!isLoggedIn || cartItems.length === 0}
              className="flex items-center space-x-2 bg-[#1E1B4B] hover:bg-[#1E1B4B]/90 w-full sm:w-auto"
            >
              <span>Ir para Pagamento</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutSummary;


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

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  
  const {
    handleNextStep,
    handlePrevStep,
    calculateTotalPrice,
    couponValid,
    couponDiscount,
    isNavigating,
    cartItems
  } = useCheckout();

  // CRITICAL: Verificação de autenticação simplificada e otimizada
  useEffect(() => {
    // Aguardar carregamento completo do estado de auth
    if (isLoading) return;
    
    if (!isLoggedIn || !user?.id) {
      console.log('[CheckoutSummary] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout/resumo');
    }
  }, [isLoggedIn, user?.id, isLoading, navigate]);

  // CRITICAL: Validação do carrinho - debounced
  useEffect(() => {
    if (isLoading) return;
    
    if (isLoggedIn && cartItems.length === 0) {
      console.log('[CheckoutSummary] Cart is empty, redirecting to store');
      toast.error("Seu carrinho está vazio");
      navigate('/paineis-digitais/loja');
    }
  }, [isLoggedIn, cartItems.length, navigate, isLoading]);

  const totalPrice = calculateTotalPrice();

  // FIXED: Loading state otimizado
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

  // REMOVED: Múltiplos estados de loading que causavam piscadas

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gray-50 py-8"
      >
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
              onClick={() => handleNextStep('pix')}
              disabled={isNavigating || !isLoggedIn || cartItems.length === 0}
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
      </motion.div>
    </Layout>
  );
};

export default CheckoutSummary;

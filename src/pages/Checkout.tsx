
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import { useUserSession } from '@/hooks/useUserSession';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { usePaymentDebug } from '@/hooks/usePaymentDebug';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import PixPaymentButton from '@/components/checkout/navigation/PixPaymentButton';

const Checkout = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading: userLoading } = useUserSession();
  const { cartItems, totalPrice, isLoading: cartLoading } = useUnifiedCart();
  const { debugInfo, refreshDebugInfo } = usePaymentDebug(user);

  // Verificação de autenticação
  useEffect(() => {
    if (userLoading) return;
    
    if (!isLoggedIn || !user?.id) {
      console.log('[Checkout] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout');
      return;
    }
  }, [isLoggedIn, user?.id, userLoading, navigate]);

  // Verificar carrinho vazio
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0) {
      console.warn("⚠️ [Checkout] Carrinho vazio, redirecionando para loja");
      toast.warning("Seu carrinho está vazio. Adicione painéis para continuar.");
      navigate('/loja');
    }
  }, [cartItems.length, cartLoading, navigate]);

  const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1');

  const handleBack = () => {
    navigate('/checkout/resumo');
  };

  const handlePixPaymentComplete = () => {
    console.log("✅ [Checkout] PIX payment completado");
  };

  // Loading state
  if (userLoading || cartLoading) {
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
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          {/* Progress Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <UnifiedCheckoutProgress currentStep={2} />
          </motion.div>

          {/* Debug Panel (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-900 text-white rounded-xl p-4 mb-6 text-xs"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Debug Panel</h3>
                <Button onClick={refreshDebugInfo} size="sm" variant="outline">
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-yellow-400">Carrinho:</p>
                  <p>Items: {debugInfo.cartStatus.itemCount}</p>
                  <p>Source: {debugInfo.cartStatus.usedKey}</p>
                  <p>Total: R$ {debugInfo.cartStatus.totalPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-green-400">Usuário:</p>
                  <p>Auth: {debugInfo.userStatus.isAuthenticated ? 'Sim' : 'Não'}</p>
                  <p>ID: {debugInfo.userStatus.userId?.substring(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-blue-400">Sistema:</p>
                  <p>Plano: {debugInfo.systemStatus.selectedPlan} mês(es)</p>
                  <p>Time: {new Date(debugInfo.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 lg:p-8"
          >
            <div className="space-y-8">
              <div className="border-b pb-6">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
                  <span className="mr-3 text-3xl">💳</span>
                  Finalizar Pagamento
                </h2>
                <p className="text-lg text-gray-600">Escolha sua forma de pagamento</p>
              </div>

              {/* Resumo da compra */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Resumo da sua campanha</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Painéis selecionados:</span>
                    <span className="font-semibold">{cartItems.length} painel(s)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Período:</span>
                    <span className="font-semibold">{selectedPlan} mês(es)</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-700 font-medium">Total:</span>
                      <span className="text-2xl font-bold text-[#3C1361]">
                        R$ {totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métodos de Pagamento */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Métodos de Pagamento</h3>
                
                {/* PIX - Método Principal */}
                <div className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                        <svg viewBox="0 0 512 512" className="h-8 w-8 text-green-600" fill="currentColor">
                          <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">PIX</h4>
                        <p className="text-gray-600">Pagamento instantâneo</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-green-600 font-semibold">✅ Aprovação imediata</span>
                          <span className="text-green-600 font-semibold">• 5% de desconto</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        R$ {(totalPrice * 0.95).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        R$ {totalPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-600 font-medium">Economia de 5%</div>
                    </div>
                  </div>
                  
                  {/* Botão PIX */}
                  <div className="w-full">
                    <PixPaymentButton
                      onClick={handlePixPaymentComplete}
                      isDisabled={cartItems.length === 0}
                      isLoading={false}
                      totalPrice={totalPrice}
                    />
                  </div>
                </div>

                {/* Cartão de Crédito - Em Breve */}
                <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-700">Cartão de Crédito</h4>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-orange-600 font-semibold">Em breve</span>
                        </div>
                        <p className="text-gray-500 text-sm">Parcelamento em até 12x</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-400">
                        R$ {totalPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">Em 12x sem juros</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações de Segurança */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="text-center space-y-3">
                  <div className="flex justify-center items-center space-x-6 text-sm text-blue-700">
                    <div className="flex items-center space-x-2">
                      <span>🔒</span>
                      <span>Pagamento 100% seguro</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>⚡</span>
                      <span>Aprovação instantânea</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>📱</span>
                      <span>QR Code via popup</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 gap-4"
          >
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center space-x-2 w-full sm:w-auto order-2 sm:order-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Resumo</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;

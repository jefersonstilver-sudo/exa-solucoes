
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import PixPaymentButton from '@/components/checkout/navigation/PixPaymentButton';

const Checkout = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  const { cartItems, selectedPlan, calculateTotalPrice } = useCheckout();

  // Verificação de autenticação
  useEffect(() => {
    if (isLoading) return;
    
    if (!isLoggedIn || !user?.id) {
      console.log('[Checkout] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout');
      return;
    }
  }, [isLoggedIn, user?.id, isLoading, navigate]);

  const totalPrice = calculateTotalPrice();

  const handleBack = () => {
    navigate('/checkout/resumo');
  };

  // SISTEMA RESTAURADO: Função para ser chamada após o popup PIX
  const handlePixPaymentComplete = () => {
    console.log("🎯 [Checkout] PIX payment popup fechado - sistema restaurado");
    // O PixPaymentButton já redireciona para /anunciante/pedidos
    // Esta função é chamada quando o popup é fechado
  };

  // Loading state
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
            <p className="text-gray-600">Verificando autenticação...</p>
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

          {/* Payment Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 lg:p-8"
          >
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="mr-3 text-2xl">💳</span>
                  Finalizar Pagamento
                </h2>
                <p className="text-gray-600 mt-2">Pague com PIX e receba 5% de desconto</p>
              </div>

              {/* Resumo rápido */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total a pagar:</span>
                  <span className="text-2xl font-bold text-[#3C1361]">
                    R$ {totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {cartItems.length} painel(s) × {selectedPlan} mês(es)
                </div>
              </div>

              {/* Método PIX - SISTEMA RESTAURADO */}
              <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 512 512" className="h-6 w-6 text-green-600" fill="currentColor">
                        <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Pagamento PIX</h3>
                      <p className="text-sm text-gray-600">Pagamento instantâneo com desconto</p>
                      <p className="text-xs text-green-600 font-medium">✅ Aprovação imediata</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      R$ {(totalPrice * 0.95).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 line-through">
                      R$ {totalPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-600">Economia de 5%</div>
                  </div>
                </div>
                
                {/* SISTEMA RESTAURADO: Usar PixPaymentButton que abre popup */}
                <div className="w-full">
                  <PixPaymentButton
                    onClick={handlePixPaymentComplete}
                    isDisabled={false}
                    isLoading={false}
                    totalPrice={totalPrice}
                  />
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="text-center text-sm text-gray-500 space-y-2">
                <p>🔒 Pagamento 100% seguro</p>
                <p>⚡ Aprovação instantânea via PIX</p>
                <p>📱 QR Code será exibido em popup após clicar em "Pagar com PIX"</p>
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


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
import { supabase } from '@/integrations/supabase/client';

const Checkout = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  const { cartItems, selectedPlan, calculateTotalPrice } = useCheckout();
  const [isProcessing, setIsProcessing] = useState(false);

  // Verificação de autenticação
  useEffect(() => {
    if (isLoading) return;
    
    if (!isLoggedIn || !user?.id) {
      console.log('[Checkout] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout');
      return;
    }

    // Validar carrinho
    if (!cartItems || cartItems.length === 0) {
      toast.error("Carrinho vazio. Adicione painéis para continuar.");
      navigate('/paineis-digitais/loja');
      return;
    }

    if (!selectedPlan) {
      toast.error("Selecione um plano para continuar.");
      navigate('/plano');
      return;
    }
  }, [isLoggedIn, user?.id, isLoading, cartItems, selectedPlan, navigate]);

  const totalPrice = calculateTotalPrice();

  const handleBack = () => {
    navigate('/checkout/resumo');
  };

  const handleProcessPixPayment = async () => {
    if (!user?.id || !cartItems || cartItems.length === 0 || !selectedPlan) {
      toast.error("Dados incompletos para processar pagamento");
      return;
    }

    setIsProcessing(true);

    try {
      console.log("🔄 [Checkout] Criando pedido para PIX...");

      // Preparar dados do pedido
      const painelIds = cartItems.map(item => item.panel.id);
      const predioIds = cartItems.map(item => item.panel.buildings?.id).filter(Boolean);
      
      const dataInicio = new Date().toISOString().split('T')[0];
      const dataFim = new Date(Date.now() + selectedPlan * 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      // Criar pedido
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .insert({
          client_id: user.id,
          lista_paineis: painelIds,
          lista_predios: predioIds,
          plano_meses: selectedPlan,
          valor_total: totalPrice,
          status: 'pendente',
          data_inicio: dataInicio,
          data_fim: dataFim,
          termos_aceitos: true,
          log_pagamento: {
            payment_method: 'pix',
            created_via: 'checkout_page',
            created_at: new Date().toISOString(),
            cart_items_count: cartItems.length
          }
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log("✅ [Checkout] Pedido criado:", pedido.id);

      // Navegar para página PIX com o ID do pedido
      navigate(`/pix-payment?pedido=${pedido.id}`);

    } catch (error: any) {
      console.error("❌ [Checkout] Erro ao processar pagamento:", error);
      toast.error(`Erro ao processar pagamento: ${error.message}`);
    } finally {
      setIsProcessing(false);
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
                  Escolha seu Método de Pagamento
                </h2>
                <p className="text-gray-600 mt-2">Selecione como deseja pagar sua campanha</p>
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

              {/* Método PIX */}
              <div className="border border-gray-200 rounded-lg p-6 hover:border-[#3C1361] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 512 512" className="h-6 w-6 text-green-600" fill="currentColor">
                        <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">PIX</h3>
                      <p className="text-sm text-gray-600">Pagamento instantâneo via PIX</p>
                      <p className="text-xs text-green-600 font-medium">Desconto de 5%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      R$ {(totalPrice * 0.95).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 line-through">
                      R$ {totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleProcessPixPayment}
                  disabled={isProcessing}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagar com PIX
                    </>
                  )}
                </Button>
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
              <span>Voltar</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;

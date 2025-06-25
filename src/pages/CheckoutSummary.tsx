
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import ReviewStep from '@/components/checkout/ReviewStep';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    cartItems,
    selectedPlan,
    calculateTotalPrice,
    couponValid,
    couponDiscount
  } = useCheckout();

  // Verificação de autenticação
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
    if (isLoading || !isLoggedIn) return;
    
    const validateTimer = setTimeout(() => {
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
    }, 1500);

    return () => clearTimeout(validateTimer);
  }, [isLoggedIn, cartItems, navigate, isLoading]);

  const totalPrice = calculateTotalPrice();

  const handleBack = () => {
    navigate('/checkout/cupom');
  };

  // CORREÇÃO CRÍTICA: Criar pedido ANTES de ir para PIX
  const handleNext = async () => {
    console.log('[CheckoutSummary] NAVEGAÇÃO CORRIGIDA - Criando pedido primeiro');

    if (!cartItems || cartItems.length === 0) {
      toast.error("Carrinho vazio. Adicione painéis para continuar.");
      navigate('/paineis-digitais/loja');
      return;
    }

    if (totalPrice <= 0) {
      toast.error("Erro no cálculo do preço. Tente novamente.");
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log("🔄 [CheckoutSummary] Criando pedido primeiro...", {
        cartItemsCount: cartItems.length,
        totalPrice,
        selectedPlan,
        userId: user.id
      });

      // Preparar dados do pedido
      const painelIds = cartItems.map(item => item.panel.id);
      const predioIds = cartItems.map(item => item.panel.buildings?.id).filter(Boolean);

      // Calcular datas
      const dataInicio = new Date().toISOString().split('T')[0];
      const dataFim = new Date(Date.now() + (selectedPlan || 1) * 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      // Criar pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          client_id: user.id,
          lista_paineis: painelIds,
          lista_predios: predioIds,
          plano_meses: selectedPlan || 1,
          valor_total: totalPrice,
          status: 'pendente',
          data_inicio: dataInicio,
          data_fim: dataFim,
          termos_aceitos: true,
          log_pagamento: {
            created_via: 'checkout_summary',
            cart_items_count: cartItems.length,
            selected_plan: selectedPlan,
            total_price: totalPrice,
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (pedidoError) {
        throw pedidoError;
      }

      console.log("✅ [CheckoutSummary] Pedido criado:", pedido.id);

      // Agora navegar para o PIX com o ID do pedido
      navigate(`/pix-payment?pedido=${pedido.id}`);
      
      toast.success("Pedido criado! Redirecionando para pagamento PIX...", { duration: 2000 });

    } catch (error: any) {
      console.error("❌ [CheckoutSummary] Erro ao criar pedido:", error);
      toast.error(`Erro ao criar pedido: ${error.message}`);
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

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border p-4 sm:p-6 lg:p-8"
          >
            <ReviewStep />
          </motion.div>

          {/* Navigation - CORRIGIDA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 gap-4"
          >
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isProcessing}
              className="flex items-center space-x-2 w-full sm:w-auto order-2 sm:order-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isLoggedIn || !cartItems || cartItems.length === 0 || totalPrice <= 0 || isProcessing}
              className="flex items-center space-x-2 bg-[#3C1361] hover:bg-[#3C1361]/90 w-full sm:w-auto order-3"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Criando Pedido...</span>
                </>
              ) : (
                <>
                  <span>Ir para Pagamento PIX</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutSummary;

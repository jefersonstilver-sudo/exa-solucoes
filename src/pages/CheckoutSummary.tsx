import React, { useEffect } from 'react';
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

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  
  const {
    cartItems,
    calculateTotalPrice,
    couponValid,
    couponDiscount,
    handleClearCart
  } = useCheckout();

  // NOVO: Log do estado detalhado ao renderizar
  useEffect(() => {
    console.log('[CheckoutSummary] Estado atual:', {
      cartItemsCount: cartItems?.length,
      cartItems,
      localStorageCart: localStorage.getItem('simple_cart'),
      url: window.location.href
    });
  }, [cartItems]);

  // CORREÇÃO: Verificação de autenticação melhorada
  useEffect(() => {
    if (isLoading) return;
    
    if (!isLoggedIn || !user?.id) {
      console.log('[CheckoutSummary] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout/resumo');
    }
  }, [isLoggedIn, user?.id, isLoading, navigate]);

  // CORREÇÃO: Validação do carrinho mais robusta - SEM timeout agressivo
  useEffect(() => {
    if (isLoading || !isLoggedIn) return;
    
    console.log('[CheckoutSummary] VALIDAÇÃO DO CARRINHO CORRIGIDA:', {
      cartItemsLength: cartItems?.length || 0,
      cartItems: cartItems?.map(item => ({
        panelId: item.panel?.id,
        buildingName: item.panel?.buildings?.nome
      })) || [],
      timestamp: new Date().toISOString()
    });
    
    // CORREÇÃO: Validação mais suave sem timeout agressivo
    if (cartItems && cartItems.length === 0) {
      console.log('[CheckoutSummary] Cart is empty, showing warning');
      toast.error("Seu carrinho está vazio. Adicione painéis para continuar.");
      // Não redirecionar automaticamente - dar tempo para o carrinho carregar
    }
  }, [isLoggedIn, cartItems, navigate, isLoading]);

  const totalPrice = calculateTotalPrice();

  const handleBack = () => {
    navigate('/checkout/cupom');
  };

  const handleNext = () => {
    // NOVO: Checagem robusta do carrinho real
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      toast.error("Carrinho vazio ou estado inconsistente. Tente recarregar a página ou adicionar novamente.");
      // Limpeza opcional, para corrigir problemas de estado
      handleClearCart?.();
      return;
    }

    if (totalPrice <= 0) {
      toast.error("Erro no cálculo do preço. Tente novamente.");
      return;
    }

    // Navegação direta para o checkout unificado
    console.log('[CheckoutSummary] Indo para /checkout', { cartItemsCount: cartItems.length });
    navigate('/checkout');
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

          {/* CORREÇÃO: Navigation sem duplicação de preço */}
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

            <Button
              onClick={handleNext}
              disabled={!isLoggedIn || !cartItems || cartItems.length === 0 || totalPrice <= 0}
              className="flex items-center space-x-2 bg-[#3C1361] hover:bg-[#3C1361]/90 w-full sm:w-auto order-3"
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


import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import UnifiedCheckoutProgress from '@/components/checkout/UnifiedCheckoutProgress';
import ReviewStep from '@/components/checkout/ReviewStep';
import { useUserSession } from '@/hooks/useUserSession';
import { useUnifiedCheckout } from '@/hooks/useUnifiedCheckout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  
  const {
    cartItems,
    selectedPlan,
    sessionPrice,
    currentTransactionId,
    currentStep,
    isInitialized,
    isProcessing,
    processPixPayment
  } = useUnifiedCheckout();

  // Verificação de autenticação
  useEffect(() => {
    if (isLoading) return;
    
    if (!isLoggedIn || !user?.id) {
      console.log('[CheckoutSummary] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout/resumo');
    }
  }, [isLoggedIn, user?.id, isLoading, navigate]);

  // Validação suave do carrinho sem redirecionamento agressivo
  useEffect(() => {
    if (isLoading || !isLoggedIn) return;
    
    console.log('[CheckoutSummary] VALIDAÇÃO SUAVE DO CARRINHO:', {
      cartItemsLength: cartItems?.length || 0,
      selectedPlan,
      isInitialized,
      currentTransactionId,
      currentStep,
      timestamp: new Date().toISOString()
    });
    
    // Warning suave sem redirecionamento automático
    if (cartItems && cartItems.length === 0) {
      console.warn('[CheckoutSummary] Carrinho vazio detectado');
      toast.error("Seu carrinho está vazio. Adicione painéis para continuar.");
    }

    if (!selectedPlan) {
      console.warn('[CheckoutSummary] Plano não selecionado');
      toast.error("Selecione um plano para continuar.");
    }
  }, [isLoggedIn, cartItems, selectedPlan, isInitialized, currentTransactionId, currentStep, isLoading]);

  const handleBack = () => {
    navigate('/checkout/cupom');
  };

  const handleNext = async () => {
    console.log('[CheckoutSummary] INICIANDO PROCESSO DE PAGAMENTO PIX:', {
      cartItemsCount: cartItems?.length || 0,
      selectedPlan,
      currentTransactionId,
      sessionPrice,
      isInitialized,
      currentStep,
      isProcessing
    });

    // Validações básicas necessárias
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

    // Se não temos transactionId ou sessionPrice, inicializar primeiro
    if (!currentTransactionId || !sessionPrice) {
      console.log('[CheckoutSummary] ⚠️ FALTAM DADOS - REDIRECIONANDO PARA CHECKOUT PRINCIPAL');
      toast.info("Preparando dados de pagamento...");
      navigate('/checkout');
      return;
    }

    try {
      console.log('[CheckoutSummary] ✅ DADOS VÁLIDOS - PROCESSANDO PIX:', {
        transactionId: currentTransactionId,
        sessionPrice,
        cartItemsCount: cartItems.length,
        selectedPlan
      });

      toast.loading("Processando pagamento PIX...");

      // Processar pagamento PIX diretamente - isso já navega para /pix-payment
      const pixSuccess = await processPixPayment(currentTransactionId);
      
      if (!pixSuccess) {
        toast.error("Erro ao processar pagamento PIX. Tente novamente.");
        return;
      }

      // O processPixPayment já faz a navegação para /pix-payment
      console.log('[CheckoutSummary] ✅ PIX PROCESSADO COM SUCESSO');
      
    } catch (error: any) {
      console.error('[CheckoutSummary] ❌ ERRO NO PROCESSAMENTO PIX:', error);
      toast.error(`Erro ao processar pagamento: ${error.message}`);
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

          {/* Status do Sistema Unificado - Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <h4 className="font-medium text-blue-800 mb-2">Status do Sistema Unificado</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>Inicializado: {isInitialized ? '✅' : '❌'}</div>
                <div>Transaction ID: {currentTransactionId || 'Nenhum'}</div>
                <div>Etapa Atual: {currentStep}</div>
                <div>Preço da Sessão: R$ {sessionPrice?.toFixed(2) || '0.00'}</div>
                <div>Processando: {isProcessing ? '✅' : '❌'}</div>
                <div>Carrinho: {cartItems?.length || 0} itens</div>
                <div>Plano: {selectedPlan || 'Não selecionado'}</div>
              </div>
            </motion.div>
          )}

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

            <Button
              onClick={handleNext}
              disabled={
                !isLoggedIn || 
                !cartItems || 
                cartItems.length === 0 || 
                !selectedPlan ||
                isProcessing
              }
              className="flex items-center space-x-2 bg-[#3C1361] hover:bg-[#3C1361]/90 w-full sm:w-auto order-3"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Processando PIX...</span>
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


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

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  const [hasValidatedCart, setHasValidatedCart] = useState(false);
  
  const {
    cartItems,
    calculateTotalPrice,
    couponValid,
    couponDiscount
  } = useCheckout();

  // CORREÇÃO: Verificação de autenticação melhorada
  useEffect(() => {
    if (isLoading) return;
    
    if (!isLoggedIn || !user?.id) {
      console.log('[CheckoutSummary] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout/resumo');
    }
  }, [isLoggedIn, user?.id, isLoading, navigate]);

  // CORREÇÃO: Validação do carrinho mais robusta - COM delay para permitir carregamento
  useEffect(() => {
    if (isLoading || !isLoggedIn || hasValidatedCart) return;
    
    // Dar tempo para o carrinho carregar
    const validateCartTimer = setTimeout(() => {
      console.log('[CheckoutSummary] VALIDAÇÃO DO CARRINHO CORRIGIDA:', {
        cartItemsLength: cartItems?.length || 0,
        cartItems: cartItems?.map(item => ({
          panelId: item.panel?.id,
          buildingName: item.panel?.buildings?.nome
        })) || [],
        timestamp: new Date().toISOString()
      });
      
      // CORREÇÃO: Validação menos agressiva
      if (!cartItems || cartItems.length === 0) {
        console.log('[CheckoutSummary] Cart appears empty, showing warning but NOT redirecting immediately');
        toast.error("Seu carrinho parece estar vazio. Se o problema persistir, adicione painéis novamente.", {
          duration: 5000,
          action: {
            label: "Ir para Loja",
            onClick: () => navigate('/paineis-digitais/loja')
          }
        });
      }
      
      setHasValidatedCart(true);
    }, 1000); // 1 segundo para carregar

    return () => clearTimeout(validateCartTimer);
  }, [isLoggedIn, cartItems, navigate, isLoading, hasValidatedCart]);

  const totalPrice = calculateTotalPrice();

  const handleBack = () => {
    navigate('/checkout/cupom');
  };

  const handleNext = () => {
    // CORREÇÃO: Validação antes de prosseguir
    if (!cartItems || cartItems.length === 0) {
      toast.error("Carrinho vazio. Adicione painéis para continuar.");
      navigate('/paineis-digitais/loja');
      return;
    }

    if (totalPrice <= 0) {
      toast.error("Erro no cálculo do preço. Tente novamente.");
      return;
    }

    console.log('[CheckoutSummary] PROSSEGUINDO PARA PAGAMENTO CORRIGIDO:', {
      cartItemsCount: cartItems.length,
      totalPrice,
      couponValid,
      couponDiscount
    });

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

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import PlanCard from '@/components/checkout/PlanCard';
import { useUserSession } from '@/hooks/useUserSession';
import { useCartManager } from '@/hooks/useCartManager';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlanKey, Plan } from '@/types/checkout';

const PLANS: Record<PlanKey, Plan> = {
  1: {
    id: 1,
    name: 'Plano Mensal',
    duration: '1 mês',
    months: 1,
    discount: 0,
    price: 0,
    popular: false,
    description: 'Ideal para campanhas pontuais'
  },
  3: {
    id: 3,
    name: 'Plano Trimestral',
    duration: '3 meses',
    months: 3,
    discount: 10,
    price: 0,
    popular: false,
    description: 'Economize 10% no valor total'
  },
  6: {
    id: 6,
    name: 'Plano Semestral',
    duration: '6 meses',
    months: 6,
    discount: 15,
    price: 0,
    popular: true,
    description: 'Plano mais popular - 15% desconto'
  },
  12: {
    id: 12,
    name: 'Plano Anual',
    duration: '12 meses',
    months: 12,
    discount: 25,
    price: 0,
    popular: false,
    description: 'Máxima economia - 25% desconto'
  }
};

const PlanSelection = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, isLoading } = useUserSession();
  const { cartItems, selectedPlan, setSelectedPlan, handleClearCart } = useCartManager();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    
    if (!isLoggedIn || !user?.id) {
      console.log('[PlanSelection] User not authenticated, redirecting to login');
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/selecionar-plano');
    }
  }, [isLoggedIn, user?.id, isLoading, navigate]);

  useEffect(() => {
    if (isLoading || !isLoggedIn) return;
    
    console.log('[PlanSelection] Checking cart:', {
      cartItemsLength: cartItems?.length || 0,
      cartItems: cartItems?.map(item => ({
        panelId: item.panel?.id,
        buildingName: item.panel?.buildings?.nome
      })) || [],
      timestamp: new Date().toISOString()
    });
    
    if (cartItems && cartItems.length === 0) {
      console.log('[PlanSelection] Cart is empty, showing warning');
      toast.error("Seu carrinho está vazio. Adicione painéis para continuar.");
    }
  }, [isLoggedIn, cartItems, isLoading]);

  const handlePlanSelect = (planKey: PlanKey) => {
    console.log('[PlanSelection] Plan selected:', planKey);
    setSelectedPlan(planKey);
    toast.success(`Plano ${PLANS[planKey].name} selecionado!`);
  };

  const handleContinue = async () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("Carrinho vazio. Adicione painéis para continuar.");
      navigate('/paineis-digitais/loja');
      return;
    }

    if (!selectedPlan) {
      toast.error("Selecione um plano para continuar.");
      return;
    }

    if (!isLoggedIn || !user?.id) {
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/selecionar-plano');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[PlanSelection] Proceeding to coupon step:', {
        selectedPlan,
        cartItemsCount: cartItems.length,
        userId: user.id
      });

      navigate('/checkout/cupom');
    } catch (error) {
      console.error('[PlanSelection] Error:', error);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    navigate('/paineis-digitais/loja');
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
            <p className="text-gray-600">Carregando...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const totalItems = cartItems?.length || 0;
  const basePrice = cartItems?.reduce((sum, item) => sum + (item.panel?.buildings?.preco_base || 0), 0) || 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="absolute left-4 top-4 flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Escolha seu Plano
            </h1>
            <p className="text-gray-600 mb-4">
              Selecione o período de exibição para seus {totalItems} painéis
            </p>
            
            {totalItems > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-600">
                  <strong>{totalItems}</strong> painel{totalItems > 1 ? 'éis' : ''} selecionado{totalItems > 1 ? 's' : ''}
                </p>
                <p className="text-lg font-semibold text-[#3C1361]">
                  Base: R$ {basePrice.toFixed(2)}
                </p>
              </div>
            )}
          </motion.div>

          {/* Plans Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {Object.entries(PLANS).map(([key, plan]) => {
              const planKey = parseInt(key) as PlanKey;
              const finalPrice = basePrice * planKey * (1 - plan.discount / 100);
              
              return (
                <PlanCard
                  key={key}
                  planKey={planKey}
                  plan={plan}
                  basePrice={basePrice}
                  finalPrice={finalPrice}
                  isSelected={selectedPlan === planKey}
                  onSelect={() => handlePlanSelect(planKey)}
                  disabled={totalItems === 0}
                />
              );
            })}
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button
              onClick={handleContinue}
              disabled={!selectedPlan || totalItems === 0 || isProcessing}
              className="bg-[#3C1361] hover:bg-[#3C1361]/90 text-white px-8 py-3 text-lg"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processando...</span>
                </div>
              ) : (
                'Continuar para Checkout'
              )}
            </Button>
            
            {(!selectedPlan || totalItems === 0) && (
              <p className="text-sm text-gray-500 mt-2">
                {totalItems === 0 
                  ? 'Adicione painéis ao carrinho para continuar'
                  : 'Selecione um plano para continuar'
                }
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default PlanSelection;

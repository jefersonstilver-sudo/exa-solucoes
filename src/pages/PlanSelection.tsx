
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import PlanSelector from '@/components/checkout/PlanSelector';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { useToast } from '@/hooks/use-toast';
import { ClientOnly } from '@/components/ui/client-only';

const PlanSelection = () => {
  const { isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    selectedPlan, 
    setSelectedPlan,
    cartItems,
    PLANS
  } = useCheckout();
  
  // Check for cart in localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('panelCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        
        if (parsedCart.length === 0) {
          toast({
            title: "Carrinho vazio",
            description: "Adicione itens ao carrinho antes de selecionar um plano.",
            variant: "destructive"
          });
          navigate('/paineis-digitais/loja');
        }
      } else {
        // No cart in localStorage
        toast({
          title: "Carrinho vazio",
          description: "Adicione itens ao carrinho antes de selecionar um plano.",
          variant: "destructive"
        });
        navigate('/paineis-digitais/loja');
      }
    } catch (e) {
      console.error("Erro ao carregar carrinho:", e);
      toast({
        title: "Erro ao carregar carrinho",
        description: "Ocorreu um erro ao carregar seu carrinho. Tente novamente.",
        variant: "destructive"
      });
      navigate('/paineis-digitais/loja');
    }
  }, [navigate, toast]);
  
  // Proceed to next step after plan selection
  const handleProceed = () => {
    // Save selected plan in localStorage
    try {
      localStorage.setItem('selectedPlan', String(selectedPlan));
    } catch (e) {
      console.error("Erro ao salvar plano:", e);
    }
    
    // Navigate to review page
    navigate('/checkout');
  };
  
  // Loading screen while checking session
  if (isSessionLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <ClientOnly>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-12 max-w-6xl"
        >
          <div className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-center text-gray-900">
                Escolha seu plano ideal de veiculação
              </h1>
              <p className="text-center text-gray-600 mt-3 text-lg max-w-3xl mx-auto">
                Ganhe vídeos, economize por mês e destaque sua campanha nos melhores locais!
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-4 flex justify-center"
            >
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-700 text-sm flex items-start gap-2 max-w-xl">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
                <div>
                  <span className="font-medium">Importante:</span> Seu plano determina o período de veiculação e benefícios extras como vídeos inclusos mensalmente para sua campanha. 
                  <span className="block mt-1">Escolha um plano antes de prosseguir para o pagamento.</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-6">
            <PlanSelector
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              plans={PLANS}
              panelCount={cartItems.length}
              onProceed={handleProceed}
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 text-center text-gray-600 text-sm"
          >
            <p>
              Todos os planos incluem: Gerenciamento de campanhas, Relatórios de desempenho, Suporte dedicado
            </p>
            <p className="mt-2">
              Dúvidas? Entre em contato com nossa equipe: (xx) xxxx-xxxx
            </p>
          </motion.div>
        </motion.div>
      </ClientOnly>
    </Layout>
  );
};

export default PlanSelection;


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import PlanSelector from '@/components/checkout/PlanSelector';
import PlanPageHeader from '@/components/checkout/PlanPageHeader';
import PlanPageFooter from '@/components/checkout/PlanPageFooter';
import PlanLoginNotification from '@/components/checkout/PlanLoginNotification';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { useToast } from '@/hooks/use-toast';
import { ClientOnly } from '@/components/ui/client-only';

const PlanSelection = () => {
  const { isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [hasCart, setHasCart] = useState(false);
  const {
    selectedPlan, 
    setSelectedPlan,
    cartItems,
    PLANS
  } = useCheckout();
  
  // Check for cart in localStorage
  useEffect(() => {
    try {
      console.log("PlanSelection: Verificando carrinho no localStorage");
      setIsPageLoading(true);
      
      const savedCart = localStorage.getItem('panelCart');
      console.log("PlanSelection: Carrinho encontrado:", savedCart ? "Sim" : "Não");
      
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log("PlanSelection: Carrinho carregado, itens:", parsedCart.length);
        
        if (parsedCart.length > 0) {
          setHasCart(true);
        } else {
          toast({
            title: "Carrinho vazio",
            description: "Adicione itens ao carrinho antes de selecionar um plano.",
            variant: "destructive"
          });
          navigate('/paineis-digitais/loja');
        }
      } else {
        // No cart in localStorage
        console.log("PlanSelection: Carrinho não encontrado no localStorage");
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
    } finally {
      setIsPageLoading(false);
    }
  }, [navigate, toast]);
  
  // Proceed to next step after plan selection
  const handleProceed = () => {
    console.log("PlanSelection: Prosseguindo com plano selecionado:", selectedPlan);
    
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Escolha um plano antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }
    
    // Save selected plan in localStorage
    try {
      localStorage.setItem('selectedPlan', String(selectedPlan));
      console.log("PlanSelection: Plano salvo no localStorage:", selectedPlan);
    } catch (e) {
      console.error("Erro ao salvar plano:", e);
      toast({
        title: "Erro ao salvar plano",
        description: "Ocorreu um erro ao salvar sua seleção. Tente novamente.",
        variant: "destructive"
      });
      return;
    }
    
    // Navigate to checkout page
    navigate('/checkout');
  };
  
  // Loading screen while checking session or cart
  if (isSessionLoading || isPageLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }
  
  // If cart exists but user is not logged in, redirect to login
  if (hasCart && !isLoggedIn) {
    return (
      <Layout>
        <PlanLoginNotification />
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
          <PlanPageHeader />
          
          <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-6">
            <PlanSelector
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              plans={PLANS}
              panelCount={cartItems.length}
              onProceed={handleProceed}
            />
          </div>
          
          <PlanPageFooter />
        </motion.div>
      </ClientOnly>
    </Layout>
  );
};

export default PlanSelection;

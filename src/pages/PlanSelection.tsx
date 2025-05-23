
import React, { useEffect, useState, useCallback } from 'react';
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
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { supabase } from '@/integrations/supabase/client';
import { isCartEmpty, loadCartFromStorage, CART_STORAGE_KEY } from '@/services/cartStorageService';

const PlanSelection = () => {
  const { user, isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [hasCart, setHasCart] = useState(false);
  // Adicionado initialLoadDone para prevenir redirecionamentos prematuros
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const {
    selectedPlan, 
    setSelectedPlan,
    cartItems,
    PLANS
  } = useCheckout();
  
  // Função para verificar a autenticação
  const checkAuthentication = useCallback(async () => {
    if (!isSessionLoading) {
      if (!isLoggedIn) {
        const { data } = await supabase.auth.getSession();
        
        // Dupla verificação para garantir que o usuário realmente não está autenticado
        if (!data.session) {
          console.log("PlanSelection: Usuário não autenticado, mostrando notificação de login");
          return false;
        } 
        return !!data.session;
      }
      return true;
    }
    return false;
  }, [isSessionLoading, isLoggedIn]);
  
  // Verificação de autenticação no início
  useEffect(() => {
    const verifyAuth = async () => {
      const isAuthenticated = await checkAuthentication();
      
      if (initialLoadDone && !isAuthenticated) {
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.WARNING,
          "Usuário não autenticado na seleção de plano",
          { timestamp: Date.now() }
        );
      }
    };
    
    verifyAuth();
  }, [initialLoadDone, checkAuthentication]);
  
  // Verificação crítica - Carrinho vazio
  useEffect(() => {
    try {
      console.log("PlanSelection: Verificando carrinho no localStorage");
      setIsPageLoading(true);
      
      // Verificação direta do localStorage
      const rawCart = localStorage.getItem(CART_STORAGE_KEY);
      console.log(`PlanSelection: Valor direto do localStorage [${CART_STORAGE_KEY}]:`, rawCart);
      
      // Verificação robusta do carrinho - Só redireciona depois que o carregamento inicial é concluído
      if (isCartEmpty() && initialLoadDone) {
        console.log(`PlanSelection: Carrinho vazio ou inválido detectado [${CART_STORAGE_KEY}]`);
        
        logCheckoutEvent(
          CheckoutEvent.LOAD_CART, 
          LogLevel.WARNING, 
          `ALERTA: Carrinho vazio ou inválido detectado [${CART_STORAGE_KEY}] na página de seleção de plano - redirecionando`, 
          { 
            timestamp: Date.now(),
            storageKey: CART_STORAGE_KEY,
            localStorageValue: rawCart
          }
        );
        
        toast({
          title: "Carrinho vazio",
          description: "Adicione itens ao carrinho antes de selecionar um plano.",
          variant: "destructive"
        });
        
        // Redirecionamento imediato para a loja
        navigate('/paineis-digitais/loja');
        return;
      }
      
      // Carregar carrinho com função aprimorada
      const parsedCart = loadCartFromStorage();
      console.log("PlanSelection: Carrinho carregado:", parsedCart);
      
      // Verificar explicitamente se temos itens no carrinho
      if (parsedCart.length === 0 && initialLoadDone) {
        logCheckoutEvent(
          CheckoutEvent.LOAD_CART, 
          LogLevel.WARNING, 
          `Carrinho vazio após carregamento [${CART_STORAGE_KEY}] - redirecionando para loja`, 
          { timestamp: Date.now(), storageKey: CART_STORAGE_KEY }
        );
        
        toast({
          title: "Carrinho vazio",
          description: "Adicione itens ao carrinho antes de selecionar um plano.",
          variant: "destructive"
        });
        
        navigate('/paineis-digitais/loja');
        return;
      }
      
      // Se chegamos aqui, temos um carrinho válido com itens
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART, 
        LogLevel.SUCCESS, 
        `Carrinho carregado com sucesso [${CART_STORAGE_KEY}] na página de seleção de plano: ${parsedCart.length} itens`, 
        { 
          itemCount: parsedCart.length, 
          timestamp: Date.now(),
          storageKey: CART_STORAGE_KEY
        }
      );
      
      setHasCart(true);
      setIsPageLoading(false);
      // Marca como carregamento inicial concluído
      setInitialLoadDone(true);
      
    } catch (e) {
      // Tratamento robusto de erro
      console.error(`Erro crítico ao carregar carrinho [${CART_STORAGE_KEY}]:`, e);
      
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART, 
        LogLevel.ERROR, 
        `ERRO CRÍTICO ao carregar carrinho [${CART_STORAGE_KEY}] na página de seleção de plano`, 
        { error: String(e), timestamp: Date.now(), storageKey: CART_STORAGE_KEY }
      );
      
      toast({
        title: "Erro ao carregar carrinho",
        description: "Ocorreu um erro ao carregar seu carrinho. Tente novamente.",
        variant: "destructive"
      });
      
      navigate('/paineis-digitais/loja');
    } finally {
      setIsPageLoading(false);
    }
  }, [navigate, toast, initialLoadDone]);
  
  // Carregar plano salvo do localStorage
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('selectedPlan');
      console.log("PlanSelection: Plano carregado:", savedPlan);
      
      if (savedPlan) {
        const parsedPlan = parseInt(savedPlan);
        if ([1, 3, 6, 12].includes(parsedPlan)) {
          setSelectedPlan(parsedPlan as any);
          
          logCheckoutEvent(
            CheckoutEvent.DEBUG_EVENT, 
            LogLevel.INFO, 
            `Plano carregado do localStorage: ${parsedPlan}`, 
            { plan: parsedPlan }
          );
        }
      }
    } catch (error) {
      console.error('Erro ao carregar plano selecionado:', error);
    }
  }, [setSelectedPlan]);
  
  // Calculate estimated total price based on cart and selected plan
  const calculateEstimatedPrice = () => {
    if (!selectedPlan || !cartItems.length) return 0;
    
    // Base calculation: number of panels * basic price per panel * months
    const pricePerPanelPerMonth = 250; // Example base price
    const totalPanels = cartItems.length;
    const months = PLANS[selectedPlan].months;
    
    return totalPanels * pricePerPanelPerMonth * months;
  };

  // Proceed to next step after plan selection
  const handleProceed = async () => {
    console.log("PlanSelection: Prosseguindo com plano selecionado:", selectedPlan);
    
    // Verificação de autenticação antes de prosseguir
    const isAuthenticated = await checkAuthentication();
    
    if (!isAuthenticated) {
      logCheckoutEvent(
        CheckoutEvent.AUTH_EVENT, 
        LogLevel.WARNING, 
        "Tentativa de prosseguir sem autenticação", 
        { timestamp: Date.now() }
      );
      
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para continuar. Faça login e tente novamente.",
        variant: "destructive"
      });
      return;
    }
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT, 
      LogLevel.INFO, 
      "Prosseguindo para checkout após selecionar plano", 
      { selectedPlan, hasCart, timestamp: Date.now() }
    );
    
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Escolha um plano antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }
    
    if (!hasCart) {
      logCheckoutEvent(
        CheckoutEvent.CHECKOUT_ERROR, 
        LogLevel.ERROR, 
        "Tentativa de prosseguir sem carrinho válido", 
        { timestamp: Date.now() }
      );
      
      toast({
        title: "Carrinho inválido",
        description: "Seu carrinho parece estar vazio. Volte à loja para adicionar itens.",
        variant: "destructive"
      });
      
      navigate('/paineis-digitais/loja');
      return;
    }
    
    // Save selected plan in localStorage
    try {
      localStorage.setItem('selectedPlan', String(selectedPlan));
      console.log("PlanSelection: Plano salvo no localStorage:", selectedPlan);
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT, 
        LogLevel.SUCCESS, 
        "Plano salvo com sucesso no localStorage", 
        { selectedPlan, timestamp: Date.now() }
      );
    } catch (e) {
      console.error("Erro ao salvar plano:", e);
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT, 
        LogLevel.ERROR, 
        "Erro ao salvar plano no localStorage", 
        { error: String(e), selectedPlan, timestamp: Date.now() }
      );
      
      toast({
        title: "Erro ao salvar plano",
        description: "Ocorreu um erro ao salvar sua seleção. Tente novamente.",
        variant: "destructive"
      });
      return;
    }
    
    // Verificação final de autenticação antes de navegar para o checkout
    const finalCheck = await checkAuthentication();
    
    if (!finalCheck) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para prosseguir para o checkout.",
        variant: "destructive"
      });
      return;
    }
    
    // Navigate to checkout page
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT, 
      LogLevel.INFO, 
      "Navegando para checkout após seleção de plano", 
      { timestamp: Date.now() }
    );
    
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
          className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl"
        >
          <PlanPageHeader />
          
          <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-6">
            <PlanSelector
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              plans={PLANS}
              panelCount={cartItems.length}
              onProceed={handleProceed}
              totalPrice={calculateEstimatedPrice()}
            />
          </div>
          
          <PlanPageFooter />
        </motion.div>
      </ClientOnly>
    </Layout>
  );
};

export default PlanSelection;

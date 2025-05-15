
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
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

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
      
      // Load cart from localStorage
      const savedCart = localStorage.getItem('panelCart');
      console.log("PlanSelection: Carrinho encontrado:", savedCart ? "Sim" : "Não");
      
      // If we found the cart in localStorage
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          console.log("PlanSelection: Carrinho carregado, itens:", parsedCart.length);
          
          // Log the details for debugging
          logCheckoutEvent(
            CheckoutEvent.LOAD_CART, 
            LogLevel.INFO, 
            "Carrinho carregado na página de seleção de plano", 
            { itemCount: parsedCart.length, timestamp: Date.now() }
          );
          
          // Validate that we have a valid cart with items
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            setHasCart(true);
          } else {
            // Empty array or invalid format
            logCheckoutEvent(
              CheckoutEvent.LOAD_CART, 
              LogLevel.WARNING, 
              "Carrinho vazio ou em formato inválido", 
              { rawValue: savedCart, timestamp: Date.now() }
            );
            
            toast({
              title: "Carrinho vazio",
              description: "Adicione itens ao carrinho antes de selecionar um plano.",
              variant: "destructive"
            });
            navigate('/paineis-digitais/loja');
          }
        } catch (parseError) {
          // JSON parsing error
          logCheckoutEvent(
            CheckoutEvent.LOAD_CART, 
            LogLevel.ERROR, 
            "Erro ao analisar dados do carrinho", 
            { error: String(parseError), rawValue: savedCart, timestamp: Date.now() }
          );
          
          toast({
            title: "Erro no carrinho",
            description: "Erro ao carregar o carrinho. Por favor, tente novamente.",
            variant: "destructive"
          });
          navigate('/paineis-digitais/loja');
        }
      } else {
        // No cart in localStorage
        console.log("PlanSelection: Carrinho não encontrado no localStorage");
        
        logCheckoutEvent(
          CheckoutEvent.LOAD_CART, 
          LogLevel.WARNING, 
          "Carrinho não encontrado no localStorage", 
          { timestamp: Date.now() }
        );
        
        toast({
          title: "Carrinho vazio",
          description: "Adicione itens ao carrinho antes de selecionar um plano.",
          variant: "destructive"
        });
        navigate('/paineis-digitais/loja');
      }
    } catch (e) {
      // General error
      console.error("Erro ao carregar carrinho:", e);
      
      logCheckoutEvent(
        CheckoutEvent.LOAD_CART, 
        LogLevel.ERROR, 
        "Erro ao carregar carrinho", 
        { error: String(e), timestamp: Date.now() }
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
  }, [navigate, toast]);
  
  // Proceed to next step after plan selection
  const handleProceed = () => {
    console.log("PlanSelection: Prosseguindo com plano selecionado:", selectedPlan);
    
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

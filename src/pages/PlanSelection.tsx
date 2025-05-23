
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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados de UI e carregamento
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [hasCart, setHasCart] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const [forceRerender, setForceRerender] = useState(0);
  
  // Estados de autenticação - deixar o estado de sessão primeiro para garantir inicialização correta
  const { user, isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  
  // Estados do checkout
  const {
    selectedPlan, 
    setSelectedPlan,
    cartItems,
    PLANS
  } = useCheckout();
  
  // Log de informação quando o componente é montado
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "PlanSelection: Componente montado",
      { isLoggedIn, userId: user?.id || 'não autenticado' }
    );
  }, [isLoggedIn, user]);

  // Verificação explícita de autenticação ao iniciar o componente
  useEffect(() => {
    const verifySession = async () => {
      console.log('Verificando sessão do Supabase explicitamente');
      try {
        setIsPageLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro na verificação explícita de sessão:', error);
          setIsAuthVerified(true); // Mesmo com erro, consideramos verificado
          setIsPageLoading(false);
          return false;
        }
        
        const hasValidSession = !!data.session?.user;
        console.log('Verificação de sessão:', hasValidSession ? 'Sessão válida encontrada' : 'Nenhuma sessão encontrada');
        
        if (hasValidSession) {
          logCheckoutEvent(
            CheckoutEvent.AUTH_EVENT,
            LogLevel.INFO,
            "Sessão válida verificada na página de planos",
            { 
              userId: data.session.user.id,
              email: data.session.user.email,
              timestamp: new Date().toISOString() 
            }
          );
        }
        
        setIsAuthVerified(true);
        // Não definir isPageLoading como false aqui, isso será feito
        // após a verificação do carrinho
        
        return hasValidSession;
      } catch (err) {
        console.error('Erro crítico ao verificar sessão:', err);
        setIsAuthVerified(true);
        setIsPageLoading(false);
        return false;
      }
    };
    
    // Apenas verificar a sessão quando não estiver mais carregando o estado de autenticação
    if (!isSessionLoading) {
      verifySession();
    }
  }, [isSessionLoading, forceRerender]);
  
  // Função para verificar a autenticação
  const checkAuthentication = useCallback(async () => {
    try {
      if (isSessionLoading) {
        console.log("PlanSelection: Ainda carregando sessão, aguardando...");
        return false;
      }
      
      if (!isLoggedIn) {
        console.log("PlanSelection: Não está logado segundo o estado React, verificando no Supabase...");
        
        // Verificação explícita da sessão para ter certeza
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("PlanSelection: Erro ao verificar sessão", error);
          logCheckoutEvent(
            CheckoutEvent.AUTH_EVENT,
            LogLevel.ERROR,
            "Erro ao verificar sessão na página de planos",
            { error: String(error), timestamp: Date.now() }
          );
          return false;
        }
        
        // Dupla verificação para garantir que o usuário realmente não está autenticado
        if (!data.session) {
          console.log("PlanSelection: Usuário não autenticado, mostrando notificação de login");
          logCheckoutEvent(
            CheckoutEvent.AUTH_EVENT,
            LogLevel.INFO,
            "Usuário não autenticado na página de planos",
            { timestamp: Date.now() }
          );
          return false;
        } 
        
        // Temos uma sessão, mas o hook useUserSession ainda não atualizou
        console.log("PlanSelection: Sessão encontrada no Supabase, mas estado React não está atualizado");
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.WARNING,
          "Sessão encontrada, mas estado de usuário está desatualizado",
          { userId: data.session.user.id, timestamp: Date.now() }
        );
        
        // Forçar recarregamento do componente para sincronizar estado
        setTimeout(() => setForceRerender(prev => prev + 1), 100);
        
        return !!data.session;
      }
      
      console.log("PlanSelection: Usuário autenticado segundo estado React");
      return true;
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      logCheckoutEvent(
        CheckoutEvent.AUTH_EVENT,
        LogLevel.ERROR,
        "Erro crítico ao verificar autenticação na página de planos",
        { error: String(error), timestamp: Date.now() }
      );
      return false;
    }
  }, [isSessionLoading, isLoggedIn]);
  
  // Verificação de autenticação e verificação do carrinho juntas
  useEffect(() => {
    // Só executar quando a autenticação estiver verificada
    if (!isAuthVerified) return;
    
    const verifyCartAndAuth = async () => {
      try {
        // Primeiro verificar autenticação
        const isAuthenticated = await checkAuthentication();
        
        console.log("PlanSelection: Verificação de autenticação concluída:", isAuthenticated);
        
        // Carregar carrinho apenas depois da verificação de autenticação
        try {
          console.log("PlanSelection: Verificando carrinho no localStorage");
          
          // Verificação direta do localStorage
          const rawCart = localStorage.getItem(CART_STORAGE_KEY);
          console.log(`PlanSelection: Valor direto do localStorage [${CART_STORAGE_KEY}]:`, rawCart);
          
          // Verificação robusta do carrinho
          if (isCartEmpty()) {
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
          if (parsedCart.length === 0) {
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
          return;
        }
      } catch (error) {
        console.error("Erro no processo de verificação:", error);
      } finally {
        setIsPageLoading(false);
        setInitialLoadDone(true);
      }
    };
    
    verifyCartAndAuth();
  }, [isAuthVerified, navigate, toast, checkAuthentication]);
  
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
    
    // Verificação de autenticação robusta antes de prosseguir
    try {
      // Verificar sessão atual explicitamente
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Erro ao verificar sessão: ${sessionError.message}`);
      }
      
      if (!sessionData.session) {
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT, 
          LogLevel.WARNING, 
          "Tentativa de prosseguir sem sessão válida", 
          { timestamp: Date.now() }
        );
        
        toast({
          title: "Login necessário",
          description: "Faça login para continuar com sua compra.",
          variant: "destructive"
        });
        
        navigate('/login?redirect=/selecionar-plano');
        return;
      }
      
      // Temos sessão confirmada, continua o processo
      logCheckoutEvent(
        CheckoutEvent.AUTH_EVENT, 
        LogLevel.SUCCESS, 
        "Sessão validada antes de prosseguir com plano", 
        { userId: sessionData.session.user.id, timestamp: Date.now() }
      );
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      
      logCheckoutEvent(
        CheckoutEvent.AUTH_EVENT, 
        LogLevel.ERROR, 
        `Erro ao verificar autenticação: ${String(error)}`, 
        { timestamp: Date.now() }
      );
      
      toast({
        title: "Erro de autenticação",
        description: "Ocorreu um problema ao verificar sua sessão. Tente fazer login novamente.",
        variant: "destructive"
      });
      
      navigate('/login?redirect=/selecionar-plano');
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
          <span className="ml-3">Verificando sua sessão e carrinho...</span>
        </div>
      </Layout>
    );
  }
  
  // Exibir botão de login se não estiver logado, independentemente do carregamento do carrinho
  if (!isLoggedIn) {
    // Verificar uma última vez se realmente não há sessão
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Se houver sessão mas isLoggedIn for falso, forçar recarregamento
        console.log("Inconsistência detectada: sessão existe mas isLoggedIn é falso. Recarregando...");
        setForceRerender(prev => prev + 1);
      }
    });
    
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


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCheckout } from '@/hooks/useCheckout';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { supabase } from '@/integrations/supabase/client';
import { PlanKey } from '@/types/checkout';

export const usePlanSelection = (hasCart: boolean) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados do checkout
  const {
    selectedPlan, 
    setSelectedPlan,
    cartItems,
    PLANS
  } = useCheckout();

  // Carregar plano salvo do localStorage
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('selectedPlan');
      console.log("PlanSelection: Plano carregado:", savedPlan);
      
      if (savedPlan) {
        const parsedPlan = parseInt(savedPlan);
        if ([1, 3, 6, 12].includes(parsedPlan)) {
          setSelectedPlan(parsedPlan as PlanKey);
          
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

  // FIXED: Navigate to coupon step instead of checkout
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
    
    // FIXED: Navigate to coupon step instead of checkout
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT, 
      LogLevel.INFO, 
      "Navegando para etapa de cupom após seleção de plano", 
      { timestamp: Date.now() }
    );
    
    navigate('/checkout/cupom');
  };

  return {
    selectedPlan,
    setSelectedPlan,
    cartItems,
    PLANS,
    calculateEstimatedPrice,
    handleProceed
  };
};

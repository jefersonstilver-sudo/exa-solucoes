
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCheckout } from '@/hooks/useCheckout';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
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

  // Função simplificada para ir direto para cupom
  const handleGoToCoupon = () => {
    console.log("PlanSelection: Ir para cupom - plano selecionado:", selectedPlan);
    
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Escolha um plano antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }

    // Salvar plano selecionado
    localStorage.setItem('selectedPlan', String(selectedPlan));
    console.log("PlanSelection: Plano salvo no localStorage:", selectedPlan);

    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT, 
      LogLevel.INFO, 
      "Navegando para cupom", 
      { selectedPlan, timestamp: Date.now() }
    );
    
    navigate('/checkout/cupom');
  };

  // Função simplificada para prosseguir (também vai para cupom)
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
    
    // Salvar plano selecionado
    localStorage.setItem('selectedPlan', String(selectedPlan));
    console.log("PlanSelection: Plano salvo no localStorage:", selectedPlan);
    
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT, 
      LogLevel.INFO, 
      "Navegando para etapa de cupom após seleção de plano", 
      { selectedPlan, timestamp: Date.now() }
    );
    
    navigate('/checkout/cupom');
  };

  return {
    selectedPlan,
    setSelectedPlan,
    cartItems,
    PLANS,
    calculateEstimatedPrice,
    handleProceed,
    handleGoToCoupon
  };
};

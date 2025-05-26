
import { useState, useEffect } from 'react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { PlanKey } from '@/types/checkout';

export const usePlanStorage = (setSelectedPlan: (plan: PlanKey) => void) => {
  // Load saved plan from localStorage
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

  // Save plan to localStorage
  const savePlanToStorage = (plan: PlanKey) => {
    localStorage.setItem('selectedPlan', String(plan));
    console.log("PlanSelection: Plano salvo no localStorage:", plan);
  };

  return {
    savePlanToStorage
  };
};

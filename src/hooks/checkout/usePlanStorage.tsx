
import { useState, useEffect, useCallback } from 'react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { PlanKey } from '@/types/checkout';

export const usePlanStorage = (setSelectedPlan: (plan: PlanKey) => void) => {
  // Load saved plan from localStorage
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('selectedPlan');
      console.log("💾 STORAGE: Carregando plano do localStorage:", savedPlan);
      
      if (savedPlan) {
        const parsedPlan = parseInt(savedPlan);
        if ([1, 3, 6, 12].includes(parsedPlan)) {
          setSelectedPlan(parsedPlan as PlanKey);
          console.log("💾 STORAGE: ✅ Plano carregado com sucesso:", parsedPlan);
          
          logCheckoutEvent(
            CheckoutEvent.DEBUG_EVENT, 
            LogLevel.INFO, 
            `Plano carregado do localStorage: ${parsedPlan}`, 
            { plan: parsedPlan }
          );
        } else {
          console.log("💾 STORAGE: ❌ Plano inválido encontrado:", parsedPlan);
        }
      } else {
        console.log("💾 STORAGE: Nenhum plano salvo encontrado");
      }
    } catch (error) {
      console.error('💾 STORAGE: Erro ao carregar plano selecionado:', error);
    }
  }, [setSelectedPlan]);

  // Save plan to localStorage - memoizado para evitar re-criação
  const savePlanToStorage = useCallback((plan: PlanKey) => {
    try {
      localStorage.setItem('selectedPlan', String(plan));
      console.log("💾 STORAGE: ✅ Plano salvo no localStorage:", plan);
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT, 
        LogLevel.INFO, 
        `Plano salvo no localStorage: ${plan}`, 
        { plan, timestamp: Date.now() }
      );
    } catch (error) {
      console.error("💾 STORAGE: ❌ Erro ao salvar plano:", error);
    }
  }, []);

  return {
    savePlanToStorage
  };
};

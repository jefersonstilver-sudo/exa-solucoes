
import React from 'react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';

export const useDebugCheckout = (cartItems: any[]) => {
  const [debugModalOpen, setDebugModalOpen] = React.useState(false);

  // Backup navigation function - simplified for reliability
  const directGoToCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      return;
    }
    
    logCheckoutEvent(
      CheckoutEvent.NAVIGATE_TO_PLAN,
      LogLevel.INFO,
      "Navegação direta para seleção de plano"
    );
    
    try {
      // Salvar carrinho
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      
      // Registrar na auditoria
      logNavigation('/selecionar-plano', 'direct', true);
      
      // Navegação direta - método mais confiável
      window.location.href = '/selecionar-plano';
    } catch (error) {
      console.error("Erro na navegação direta:", error);
      logNavigation('/selecionar-plano', 'direct', false, String(error));
    }
  };

  return {
    debugModalOpen,
    setDebugModalOpen,
    directGoToCheckout
  };
};

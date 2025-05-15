
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import StoreLayout from '@/components/panel-store/StoreLayout';
import PanelList from '@/components/panels/PanelList';
import PanelCart from '@/components/panels/PanelCart';
import PanelFilterSidebar from '@/components/panels/PanelFilterSidebar';
import { useCartManager } from '@/hooks/useCartManager';
import { usePanelStore } from '@/hooks/usePanelStore';
import CartDebugger from '@/components/debug/CartDebugger';
import { logDebugEvent } from '@/services/checkoutDebugService';

export default function PanelStore() {
  const { 
    panels, 
    isLoading, 
    filters,
    handleFilterChange
  } = usePanelStore();

  const { 
    cartItems,
    cartOpen,
    toggleCart,
    handleAddToCart,
    handleRemoveFromCart,
    handleChangeDuration,
    handleProceedToCheckout
  } = useCartManager();
  
  const [isDebuggerOpen, setIsDebuggerOpen] = useState(false);
  
  // Monitorar estado do carrinho para diagnóstico
  useEffect(() => {
    console.log("PanelStore: Cart state updated", cartItems);
    
    // Salvar último estado do carrinho para diagnóstico
    try {
      localStorage.setItem('debug_last_cart_state', JSON.stringify({
        timestamp: new Date().toISOString(),
        cartItems: cartItems
      }));
    } catch (e) {
      console.error("Error saving debug cart state", e);
    }
  }, [cartItems]);
  
  // Verificar integridade do carrinho ao montar o componente
  useEffect(() => {
    try {
      const localStorageCart = localStorage.getItem('indexa_cart');
      console.log("PanelStore: Cart from localStorage", localStorageCart);
    } catch (e) {
      console.error("Error checking localStorage cart", e);
    }
  }, []);
  
  // Função para abrir o debugger
  const openDebugger = (e: React.MouseEvent) => {
    e.preventDefault();
    logDebugEvent("Diagnostic button clicked", { timestamp: Date.now() });
    setIsDebuggerOpen(true);
  };
  
  // Transições com Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        when: "beforeChildren" 
      }
    }
  };

  // Verificar se o painel está no carrinho
  const isPanelInCart = (panel: any) => {
    return cartItems.some(item => item.panel.id === panel.id);
  };

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar com filtros */}
          <motion.div 
            className="lg:col-span-3 hidden lg:block" 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <PanelFilterSidebar 
              filters={filters}
              handleFilterChange={handleFilterChange}
              loading={isLoading}
            />
          </motion.div>
          
          {/* Lista de painéis */}
          <motion.div 
            className="lg:col-span-9"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <PanelList 
              panels={panels || []} 
              isLoading={isLoading} 
              cartItems={cartItems} 
              onAddToCart={handleAddToCart}
            />
          </motion.div>
        </div>
        
        {/* Cart sidebar */}
        <PanelCart 
          cartItems={cartItems}
          onRemoveItem={handleRemoveFromCart}
          onChangeDuration={handleChangeDuration}
          onCheckout={handleProceedToCheckout}
        />
        
        {/* Debugger modal */}
        <CartDebugger 
          open={isDebuggerOpen}
          onClose={() => setIsDebuggerOpen(false)}
        />
      </div>
    </StoreLayout>
  );
}

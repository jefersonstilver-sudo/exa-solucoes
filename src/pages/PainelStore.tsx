
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { usePanelStore } from '@/hooks/usePanelStore';
import { useCartManager } from '@/hooks/useCartManager';
import { useUserSession } from '@/hooks/useUserSession';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CheckoutDebugger from '@/components/debug/CheckoutDebugger';
import { useDebugCheckout } from '@/hooks/useDebugCheckout';
import PanelDebugActions from '@/components/panel-store/PanelDebugActions';
import PromotionBanner from '@/components/panel-store/PromotionBanner';
import StoreLayout from '@/components/panel-store/StoreLayout';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export default function PainelStore() {
  // Use our custom hooks for state management
  const {
    panels,
    isLoading,
    error,
    searchLocation,
    setSearchLocation,
    selectedLocation,
    isSearching,
    filters,
    handleFilterChange,
    handleSearch,
    handleClearLocation
  } = usePanelStore();

  const {
    cartItems,
    cartOpen,
    setCartOpen,
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    cartAnimation,
    handleProceedToCheckout
  } = useCartManager();

  const { isLoggedIn } = useUserSession();
  const [showPromotion, setShowPromotion] = useState(true);
  
  // Debug checkout hook
  const { 
    debugModalOpen, 
    setDebugModalOpen, 
    directGoToCheckout 
  } = useDebugCheckout(cartItems);

  // Effect to hide promotion when user logs in or adds items to cart
  useEffect(() => {
    if (isLoggedIn || cartItems.length > 0) {
      setShowPromotion(false);
    } else {
      setShowPromotion(true);
    }
  }, [isLoggedIn, cartItems.length]);

  // Log quando handleProceedToCheckout é chamado
  const handleCheckoutStart = () => {
    logCheckoutEvent(
      CheckoutEvent.CHECKOUT_INITIATION,
      LogLevel.INFO,
      "Iniciando checkout a partir da loja",
      { cartItemCount: cartItems.length, timestamp: Date.now() }
    );
    handleProceedToCheckout();
  };

  // Modified to match the expected signature without parameters
  const handleDirectGoToCheckout = () => {
    console.log("Redirecting to checkout directly");
    directGoToCheckout(new MouseEvent('click') as unknown as React.MouseEvent);
  };

  // Handler to open debug modal
  const handleOpenDebugger = () => {
    console.log("Opening debug modal");
    setDebugModalOpen(true);
  };

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <h2 className="text-2xl font-semibold text-red-500 mb-4">Erro ao carregar painéis</h2>
          <p className="text-muted-foreground mb-6">
            Ocorreu um problema ao buscar os painéis disponíveis. Por favor, tente novamente.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#3C1361] text-white rounded-md hover:bg-[#3C1361]/80"
          >
            Tentar novamente
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      cartItems={cartItems}
      onRemoveFromCart={handleRemoveFromCart}
      onClearCart={handleClearCart}
      onChangeDuration={handleChangeDuration}
      onProceedToCheckout={handleCheckoutStart}
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 md:px-6 py-8"
      >
        {/* Debug panel for diagnostics */}
        <PanelDebugActions 
          cartItemsCount={cartItems.length}
          onProceedToCheckout={handleCheckoutStart}
          directGoToCheckout={handleDirectGoToCheckout}
          onOpenDebugger={handleOpenDebugger}
        />
      
        {/* Promotional Welcome Banner */}
        <AnimatePresence>
          <PromotionBanner 
            showPromotion={showPromotion}
            setShowPromotion={setShowPromotion}
          />
        </AnimatePresence>
        
        {/* Store Layout - Search, Filter Sidebar, and Panel Cards */}
        <StoreLayout 
          panels={panels}
          isLoading={isLoading}
          isSearching={isSearching}
          searchLocation={searchLocation}
          setSearchLocation={setSearchLocation}
          selectedLocation={selectedLocation}
          filters={filters}
          handleFilterChange={handleFilterChange}
          handleSearch={handleSearch}
          handleClearLocation={handleClearLocation}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
        />
      </motion.div>
      
      {/* Modal de diagnóstico - Fixed with proper accessibility attributes */}
      <Dialog open={debugModalOpen} onOpenChange={setDebugModalOpen}>
        <DialogContent className="sm:max-w-md p-0">
          <CheckoutDebugger onClose={() => setDebugModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

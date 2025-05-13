
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import SearchSection from '@/components/panels/SearchSection';
import PanelsSection from '@/components/panels/PanelsSection';
import { usePanelStore } from '@/hooks/usePanelStore';
import { useCartManager } from '@/hooks/useCartManager';
import { DrawerContent } from '@/components/ui/drawer';
import PanelCart from '@/components/panels/PanelCart';
import { useUserSession } from '@/hooks/useUserSession';
import { Button } from '@/components/ui/button';

export default function PanelStore() {
  // Use our custom hooks for state management
  const {
    panels,
    isLoading,
    error,
    searchLocation,
    setSearchLocation,
    selectedLocation,
    setSelectedLocation,
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
    cartAnimation
  } = useCartManager();

  const { isLoggedIn } = useUserSession();
  const [showPromotion, setShowPromotion] = useState(true);

  // Effect to hide promotion when user logs in or adds items to cart
  useEffect(() => {
    if (isLoggedIn || cartItems.length > 0) {
      setShowPromotion(false);
    }
  }, [isLoggedIn, cartItems]);

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
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {/* Promotional Welcome Balloon - ALASKA Implementation */}
        <AnimatePresence>
          {showPromotion && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mb-8 bg-[#3C1361] rounded-xl p-5 text-white shadow-lg"
            >
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-lg font-medium mb-1">É novo por aqui? Ganhe um bônus de estreia na sua primeira campanha!</h3>
                </div>
                <Button 
                  className="bg-[#00FFAB] hover:bg-[#00FFAB]/90 text-[#3C1361] font-medium py-2 px-6 rounded-lg transition-transform hover:scale-105 duration-200"
                  onClick={() => setShowPromotion(false)}
                >
                  Ver promoção
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Search section */}
        <SearchSection 
          searchLocation={searchLocation}
          setSearchLocation={setSearchLocation}
          selectedLocation={selectedLocation}
          isSearching={isSearching}
          handleSearch={handleSearch}
          handleClearLocation={handleClearLocation}
          filters={filters}
          handleFilterChange={handleFilterChange}
          panelsCount={panels?.length || 0}
        />
        
        {/* Panels grid with filters and results */}
        <PanelsSection 
          panels={panels}
          isLoading={isLoading}
          isSearching={isSearching}
          selectedLocation={selectedLocation}
          filters={filters}
          handleFilterChange={handleFilterChange}
          handleSearch={handleSearch}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
        />
      </motion.div>
    </Layout>
  );
}

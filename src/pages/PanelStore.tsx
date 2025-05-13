
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import SearchSection from '@/components/panels/SearchSection';
import PanelsSection from '@/components/panels/PanelsSection';
import { usePanelStore } from '@/hooks/usePanelStore';
import { useCartManager } from '@/hooks/useCartManager';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PanelCart from '@/components/panels/PanelCart';

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
    handleChangeDuration
  } = useCartManager();

  // Sempre que um item é adicionado ao carrinho, mantenha o drawer aberto
  useEffect(() => {
    if (cartItems.length > 0) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }

    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [cartItems.length]);

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
            className="px-4 py-2 bg-[#2B0A3D] text-white rounded-md hover:bg-[#2B0A3D]/80"
          >
            Tentar novamente
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
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
        
        {/* Cart drawer - fixed at right side */}
        <Drawer open={cartOpen} onOpenChange={setCartOpen}>
          <DrawerTrigger asChild>
            <Button 
              className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg bg-[#2B0A3D] hover:bg-[#3B1A4D]"
              style={{ display: cartOpen ? 'none' : 'flex' }}
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-white" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#00FFAB] text-[#2B0A3D] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </div>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="drawer-side-right h-[90vh] mt-[10vh] rounded-t-3xl border-t border-x border-gray-200 shadow-xl">
            <div className="h-full px-4">
              <PanelCart 
                cartItems={cartItems}
                onRemove={handleRemoveFromCart}
                onClear={handleClearCart}
                onChangeDuration={handleChangeDuration}
              />
            </div>
          </DrawerContent>
        </Drawer>
        
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

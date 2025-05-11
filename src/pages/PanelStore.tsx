
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import SearchSection from '@/components/panels/SearchSection';
import PanelsSection from '@/components/panels/PanelsSection';
import { usePanelStore } from '@/hooks/usePanelStore';
import { useCartManager } from '@/hooks/useCartManager';

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
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration
  } = useCartManager();

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
            className="px-4 py-2 bg-indexa-purple text-white rounded-md hover:bg-indexa-purple-dark"
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

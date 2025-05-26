
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useBuildingStore } from '@/hooks/useBuildingStore';
import { useCartManager } from '@/hooks/useCartManager';
import { useUserSession } from '@/hooks/useUserSession';
import { BuildingStore } from '@/services/buildingStoreService';
import PromotionBanner from '@/components/panel-store/PromotionBanner';
import BuildingStoreLayout from '@/components/building-store/BuildingStoreLayout';

export default function BuildingStorePage() {
  const navigate = useNavigate();
  
  // Building store state
  const {
    buildings,
    isLoading,
    error,
    searchLocation,
    setSearchLocation,
    selectedLocation,
    isSearching,
    filters,
    handleFilterChange,
    handleSearch,
    handleClearLocation,
    fetchBuildings
  } = useBuildingStore();

  const {
    cartItems,
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleProceedToCheckout
  } = useCartManager();

  const { isLoggedIn } = useUserSession();
  const [showPromotion, setShowPromotion] = useState(true);

  // Load buildings on mount
  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  // Effect to hide promotion when user logs in or adds items to cart
  useEffect(() => {
    if (isLoggedIn || cartItems.length > 0) {
      setShowPromotion(false);
    } else {
      setShowPromotion(true);
    }
  }, [isLoggedIn, cartItems.length]);

  // Handle viewing panels of a specific building
  const handleViewPanels = (building: BuildingStore) => {
    // Navigate to panel selection page for this building
    navigate(`/paineis-digitais/loja?building_id=${building.id}`);
  };

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <h2 className="text-2xl font-semibold text-red-500 mb-4">Erro ao carregar prédios</h2>
          <p className="text-muted-foreground mb-6">
            Ocorreu um problema ao buscar os prédios disponíveis. Por favor, tente novamente.
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
      onProceedToCheckout={handleProceedToCheckout}
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 md:px-6 py-8"
      >
        {/* Promotional Welcome Banner */}
        <AnimatePresence>
          <PromotionBanner 
            showPromotion={showPromotion}
            setShowPromotion={setShowPromotion}
          />
        </AnimatePresence>
        
        {/* Building Store Layout */}
        <BuildingStoreLayout 
          buildings={buildings}
          isLoading={isLoading}
          isSearching={isSearching}
          searchLocation={searchLocation}
          setSearchLocation={setSearchLocation}
          selectedLocation={selectedLocation}
          filters={filters}
          handleFilterChange={handleFilterChange}
          handleSearch={handleSearch}
          handleClearLocation={handleClearLocation}
          onViewPanels={handleViewPanels}
          onAddToCart={handleAddToCart}
        />
      </motion.div>
    </Layout>
  );
}

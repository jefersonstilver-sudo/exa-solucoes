
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { usePanelStore } from '@/hooks/usePanelStore';
import { useBuildingStore } from '@/hooks/useBuildingStore';
import { useCartManager } from '@/hooks/useCartManager';
import { useUserSession } from '@/hooks/useUserSession';
import PromotionBanner from '@/components/panel-store/PromotionBanner';
import StoreLayout from '@/components/panel-store/StoreLayout';
import BuildingStoreLayout from '@/components/building-store/BuildingStoreLayout';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { BuildingStore } from '@/services/buildingStoreService';

export default function PanelStore() {
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get('building_id');
  
  // Determinar se estamos na loja de prédios (sem building_id) ou na loja de painéis (com building_id)
  const isStoreView = !buildingId; // Loja de prédios quando não há building_id
  const isPanelView = !!buildingId; // Loja de painéis quando há building_id
  
  console.log('🏪 [PANEL STORE] Contexto da loja:', { isStoreView, isPanelView, buildingId });
  
  // Panel store state (for when viewing specific building panels)
  const {
    panels,
    isLoading: panelsLoading,
    error: panelsError,
    searchLocation: panelSearchLocation,
    setSearchLocation: setPanelSearchLocation,
    selectedLocation: panelSelectedLocation,
    isSearching: panelsSearching,
    filters: panelFilters,
    handleFilterChange: handlePanelFilterChange,
    handleSearch: handlePanelSearch,
    handleClearLocation: handlePanelClearLocation
  } = usePanelStore();

  // Building store state (for main store view)
  const {
    buildings,
    isLoading: buildingsLoading,
    error: buildingsError,
    searchLocation: buildingSearchLocation,
    setSearchLocation: setBuildingSearchLocation,
    selectedLocation: buildingSelectedLocation,
    isSearching: buildingsSearching,
    filters: buildingFilters,
    handleFilterChange: handleBuildingFilterChange,
    handleSearch: handleBuildingSearch,
    handleClearLocation: handleBuildingClearLocation,
    fetchBuildings
  } = useBuildingStore();

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

  // Load appropriate data based on whether we're viewing a specific building or the main store
  useEffect(() => {
    console.log('🔄 [PANEL STORE] useEffect disparado:', { buildingId, isStoreView });
    
    if (isStoreView) {
      // Load buildings for main store view
      console.log('📋 [PANEL STORE] Carregando prédios para loja principal');
      fetchBuildings();
    }
    // Panel loading will be handled by the panel store hook when buildingId is present
  }, [buildingId, fetchBuildings, isStoreView]);

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
    console.log('👁️ [PANEL STORE] Visualizando painéis do prédio:', building.nome);
    // Update URL with building_id parameter
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('building_id', building.id);
    window.history.pushState({}, '', newUrl.toString());
  };

  // Handle going back to building list
  const handleBackToBuildings = () => {
    console.log('⬅️ [PANEL STORE] Voltando para lista de prédios');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('building_id');
    window.history.pushState({}, '', newUrl.toString());
  };

  // Enhanced handleAddToCart with debug logging
  const handleAddToCartWithLogging = (panel: any, duration?: number) => {
    console.log('🛒 [PANEL STORE] Adicionando ao carrinho:', { 
      panelId: panel.id, 
      panelName: panel.buildings?.nome || panel.nome,
      duration: duration || 30,
      cartItemsBefore: cartItems.length 
    });
    
    handleAddToCart(panel, duration);
    
    // Log após um pequeno delay para ver o estado atualizado
    setTimeout(() => {
      console.log('🛒 [PANEL STORE] Carrinho após adição:', { 
        cartItemsAfter: cartItems.length,
        cartItems: cartItems.map(item => ({
          id: item.panel.id,
          name: item.panel.buildings?.nome || item.panel.nome
        }))
      });
    }, 100);
  };

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

  // Determine which error to show
  const error = isPanelView ? panelsError : buildingsError;

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <h2 className="text-2xl font-semibold text-red-500 mb-4">
            Erro ao carregar {isPanelView ? 'painéis' : 'prédios'}
          </h2>
          <p className="text-muted-foreground mb-6">
            Ocorreu um problema ao buscar os {isPanelView ? 'painéis' : 'prédios'} disponíveis. Por favor, tente novamente.
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

  console.log('🎨 [PANEL STORE] Renderizando:', { 
    isStoreView, 
    isPanelView, 
    buildingsCount: buildings?.length || 0,
    panelsCount: panels?.length || 0,
    cartItemsCount: cartItems.length
  });

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
        {/* Promotional Welcome Banner */}
        <AnimatePresence>
          <PromotionBanner 
            showPromotion={showPromotion}
            setShowPromotion={setShowPromotion}
          />
        </AnimatePresence>
        
        {/* Conditional rendering based on whether we're viewing a specific building or the main store */}
        {isPanelView ? (
          // Show panel selection for specific building
          <StoreLayout 
            panels={panels}
            isLoading={panelsLoading}
            isSearching={panelsSearching}
            searchLocation={panelSearchLocation}
            setSearchLocation={setPanelSearchLocation}
            selectedLocation={panelSelectedLocation}
            filters={panelFilters}
            handleFilterChange={handlePanelFilterChange}
            handleSearch={handlePanelSearch}
            handleClearLocation={handlePanelClearLocation}
            cartItems={cartItems}
            onAddToCart={handleAddToCartWithLogging}
          />
        ) : (
          // Show building selection (main store view)
          <BuildingStoreLayout 
            buildings={buildings}
            isLoading={buildingsLoading}
            isSearching={buildingsSearching}
            searchLocation={buildingSearchLocation}
            setSearchLocation={setBuildingSearchLocation}
            selectedLocation={buildingSelectedLocation}
            filters={buildingFilters}
            handleFilterChange={handleBuildingFilterChange}
            handleSearch={handleBuildingSearch}
            handleClearLocation={handleBuildingClearLocation}
            onViewPanels={handleViewPanels}
            onAddToCart={handleAddToCartWithLogging}
          />
        )}
      </motion.div>
    </Layout>
  );
}

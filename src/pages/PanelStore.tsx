
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
import { forceCleanCart, cleanOrphanedCartItems } from '@/services/cartStorageService';

export default function PanelStore() {
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get('building_id');
  
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

  // Limpar carrinho órfão na inicialização
  useEffect(() => {
    console.log('🧹 [PANEL STORE] Limpando carrinho órfão na inicialização...');
    const wasCleanedUp = cleanOrphanedCartItems();
    if (wasCleanedUp) {
      console.log('✅ [PANEL STORE] Carrinho órfão limpo na inicialização');
    }
  }, []);

  // Load appropriate data based on whether we're viewing a specific building or the main store
  useEffect(() => {
    if (!buildingId) {
      // Load buildings for main store view
      console.log('🔄 [PANEL STORE] Carregando prédios para loja principal...');
      fetchBuildings();
    }
    // Panel loading will be handled by the panel store hook when buildingId is present
  }, [buildingId, fetchBuildings]);

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
    // Update URL with building_id parameter
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('building_id', building.id);
    window.history.pushState({}, '', newUrl.toString());
  };

  // Handle going back to building list
  const handleBackToBuildings = () => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('building_id');
    window.history.pushState({}, '', newUrl.toString());
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

  // Função para debug - forçar limpeza do carrinho
  const handleForceCleanCart = () => {
    console.log('🧹 [PANEL STORE] Executando limpeza forçada do carrinho...');
    forceCleanCart();
    window.location.reload();
  };

  // Determine which error to show
  const error = buildingId ? panelsError : buildingsError;

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <h2 className="text-2xl font-semibold text-red-500 mb-4">
            Erro ao carregar {buildingId ? 'painéis' : 'prédios'}
          </h2>
          <p className="text-muted-foreground mb-6">
            Ocorreu um problema ao buscar os {buildingId ? 'painéis' : 'prédios'} disponíveis. Por favor, tente novamente.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[#3C1361] text-white rounded-md hover:bg-[#3C1361]/80"
            >
              Tentar novamente
            </button>
            <button 
              onClick={handleForceCleanCart}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Limpar Cache
            </button>
          </div>
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
        {/* Debug info - só aparece em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Buildings carregados: {buildings?.length || 0}</p>
            <p>Carrinho: {cartItems.length} itens</p>
            <p>Modo: {buildingId ? 'Painéis do prédio' : 'Lista de prédios'}</p>
            <button 
              onClick={handleForceCleanCart}
              className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
            >
              Limpar Carrinho Forçado
            </button>
          </div>
        )}

        {/* Promotional Welcome Banner */}
        <AnimatePresence>
          <PromotionBanner 
            showPromotion={showPromotion}
            setShowPromotion={setShowPromotion}
          />
        </AnimatePresence>
        
        {/* Conditional rendering based on whether we're viewing a specific building or the main store */}
        {buildingId ? (
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
            onAddToCart={handleAddToCart}
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
            onAddToCart={handleAddToCart}
          />
        )}
      </motion.div>
    </Layout>
  );
}

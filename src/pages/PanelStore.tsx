
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { usePanelStore } from '@/hooks/usePanelStore';
import { useSimpleBuildingStore } from '@/hooks/useSimpleBuildingStore';
import { useCartManager } from '@/hooks/useCartManager';
import { useUserSession } from '@/hooks/useUserSession';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import PromotionBanner from '@/components/panel-store/PromotionBanner';
import StoreLayout from '@/components/panel-store/StoreLayout';
import SimpleBuildingGrid from '@/components/building-store/SimpleBuildingGrid';
import MobileBuildingGrid from '@/components/building-store/MobileBuildingGrid';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { Panel } from '@/types/panel';

// Type adapter function to convert SimpleBuildingStore to Building format expected by MobileBuildingGrid
const adaptBuildingForMobileGrid = (building: any) => ({
  id: building.id,
  nome: building.nome,
  endereco: building.endereco,
  bairro: building.bairro,
  cidade: building.bairro, // Use bairro as cidade for now
  basePrice: building.preco_base,
  paineis_count: building.quantidade_telas,
  tipo_perfil: building.padrao_publico,
  rating: 4.5, // Default rating
  views_mes: building.visualizacoes_mes
});

export default function PanelStore() {
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get('building_id');
  const { isMobile } = useMobileBreakpoints();
  
  // Panel store state (for specific building)
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

  // Simplified building store state (for main store view)
  const {
    buildings,
    isLoading: buildingsLoading,
    error: buildingsError,
    refetch: refetchBuildings
  } = useSimpleBuildingStore();

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

  // Effect to hide promotion when user logs in or adds items to cart
  useEffect(() => {
    if (isLoggedIn || cartItems.length > 0) {
      setShowPromotion(false);
    } else {
      setShowPromotion(true);
    }
  }, [isLoggedIn, cartItems.length]);

  // Log do estado atual
  useEffect(() => {
    console.log('🔄 [PANEL STORE] === ESTADO ATUAL ===');
    console.log('🔄 [PANEL STORE] isMobile:', isMobile);
    console.log('🔄 [PANEL STORE] buildingId:', buildingId);
    console.log('🔄 [PANEL STORE] buildings.length:', buildings.length);
    console.log('🔄 [PANEL STORE] buildingsLoading:', buildingsLoading);
    console.log('🔄 [PANEL STORE] buildingsError:', buildingsError);
  }, [isMobile, buildingId, buildings, buildingsLoading, buildingsError]);

  // Handle going back to building list
  const handleBackToBuildings = () => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('building_id');
    window.history.pushState({}, '', newUrl.toString());
  };

  const handleCheckoutStart = () => {
    logCheckoutEvent(
      CheckoutEvent.CHECKOUT_INITIATION,
      LogLevel.INFO,
      "Iniciando checkout a partir da loja",
      { cartItemCount: cartItems.length, timestamp: Date.now() }
    );
    handleProceedToCheckout();
  };

  // Create a function that handles adding building to cart by converting to panel
  const handleAddBuildingToCart = (building: any) => {
    // Convert building to panel format for cart
    const panel: Panel = {
      id: building.id,
      code: `${building.nome.substring(0, 3).toUpperCase()}-${building.id.substring(0, 8)}`,
      building_id: building.id,
      buildings: {
        id: building.id,
        nome: building.nome,
        endereco: building.endereco,
        bairro: building.bairro,
        cidade: building.bairro, // Use bairro as cidade
        estado: 'SP', // Default state
        cep: '00000-000', // Default CEP
        latitude: building.latitude || 0,
        longitude: building.longitude || 0,
        basePrice: building.basePrice || building.preco_base,
        venue_type: building.venue_type || 'Residencial'
      }
    };
    
    handleAddToCart(panel, 30); // Default 30 days duration
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
            Ocorreu um problema ao buscar os {buildingId ? 'painéis' : 'prédios'} disponíveis.
          </p>
          <button 
            onClick={() => buildingId ? window.location.reload() : refetchBuildings()} 
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
        className={`${isMobile ? 'px-4 py-4' : 'container mx-auto px-4 md:px-6 py-8'}`}
      >
        {/* Promotional Welcome Banner - só em desktop */}
        {!isMobile && (
          <AnimatePresence>
            <PromotionBanner 
              showPromotion={showPromotion}
              setShowPromotion={setShowPromotion}
            />
          </AnimatePresence>
        )}
        
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
          // Show building selection (main store view) - MOBILE-FIRST
          <div className="space-y-6">
            <div className={`text-center ${isMobile ? 'px-2' : ''}`}>
              <h1 className={`font-bold text-[#3C1361] mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                {isMobile ? 'Prédios Disponíveis' : 'Loja de Prédios'}
              </h1>
              <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
                {isMobile ? 'Toque para ver os painéis' : 'Selecione um prédio para ver os painéis disponíveis'}
              </p>
            </div>
            
            {/* Mobile-first grid */}
            {isMobile ? (
              <MobileBuildingGrid 
                buildings={buildings.map(adaptBuildingForMobileGrid)}
                isLoading={buildingsLoading}
                onAddToCart={handleAddBuildingToCart}
              />
            ) : (
              <SimpleBuildingGrid 
                buildings={buildings}
                isLoading={buildingsLoading}
                onAddToCart={handleAddToCart}
              />
            )}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}

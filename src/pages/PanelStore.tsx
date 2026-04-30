
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createBreadcrumbSchema, createFAQSchema, lojaFAQs, serviceSchema } from '@/components/seo/schemas';
import { usePanelStore } from '@/hooks/usePanelStore';
import { useSimpleBuildingStore } from '@/hooks/useSimpleBuildingStore';
import { useCartManager } from '@/hooks/useCartManager';
import { useUserSession } from '@/hooks/useUserSession';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import PromotionBanner from '@/components/panel-store/PromotionBanner';
import StoreLayout from '@/components/panel-store/StoreLayout';
import PanelStoreLayout from '@/components/panel-store/PanelStoreLayout';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

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
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleProceedToCheckout
  } = useCartManager();

  const { isLoggedIn } = useUserSession();
  const [showPromotion, setShowPromotion] = useState(true);

  // Type adapter function to convert SimpleBuildingStore to Building format expected by MobileBuildingGrid
  const adaptBuildingForMobileGrid = (building: any) => ({
    id: building.id,
    nome: building.nome,
    endereco: building.endereco,
    bairro: building.bairro,
    cidade: building.bairro, // Use bairro as cidade for now
    basePrice: building.preco_base || 0,
    paineis_count: building.quantidade_telas || 0,
    tipo_perfil: building.padrao_publico || 'normal',
    rating: 4.5, // Default rating
    views_mes: building.visualizacoes_mes || 0
  });

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
    <Layout>
      <SEO
        title="Loja Online de Painéis Digitais para Elevadores | EXA Foz do Iguaçu"
        description="Compre publicidade em painéis digitais 21&quot; HD instalados em elevadores de prédios premium em Foz do Iguaçu. Planos a partir de R$297/mês. Escolha seu prédio, crie seu anúncio e comece a impactar milhares de pessoas hoje."
        keywords="comprar espaço publicitário elevador, anunciar em prédio, painel digital loja online, publicidade condomínio preço, quanto custa anunciar elevador foz iguaçu"
        canonical="https://www.examidia.com.br/loja"
        ogImage="https://www.examidia.com.br/og-loja.jpg"
        structuredData={[
          organizationSchema,
          serviceSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://www.examidia.com.br/' },
            { name: 'Loja Online', url: 'https://www.examidia.com.br/loja' }
          ]),
          createFAQSchema(lojaFAQs),
          {
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "EXA Loja de Painéis Digitais",
            "description": "Loja online de espaços publicitários em painéis digitais para elevadores",
            "priceRange": "R$297 - R$2500",
            "paymentAccepted": ["PIX", "Cartão de Crédito"],
            "currenciesAccepted": "BRL"
          }
        ]}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`${isMobile ? 'px-4 py-4' : 'container mx-auto px-4 md:px-6 py-8'} mobile-scroll-fix`}
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
          // Show building selection with map integration
          <PanelStoreLayout
            buildings={buildings}
            isLoading={buildingsLoading}
            adaptBuildingForMobileGrid={adaptBuildingForMobileGrid}
          />
        )}
      </motion.div>
    </Layout>
  );
}

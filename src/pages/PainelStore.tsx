
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import useBuildingStore from '@/hooks/useBuildingStore';
import { useCartManager } from '@/hooks/useCartManager';
import { useUserSession } from '@/hooks/useUserSession';
import PromotionBanner from '@/components/panel-store/PromotionBanner';
import BuildingStoreLayout from '@/components/building-store/BuildingStoreLayout';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export default function PainelStore() {
  console.log('🏢 [PAINEL STORE] === INICIALIZANDO LOJA DE PRÉDIOS PROFISSIONAL ===');

  // Building store state usando o hook completo
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
    initializeStore
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

  // Initialize store on mount
  useEffect(() => {
    console.log('🚀 [PAINEL STORE] Inicializando store da loja profissional');
    initializeStore();
  }, [initializeStore]);

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
    console.log('🔄 [PAINEL STORE] === ESTADO ATUAL DA LOJA PROFISSIONAL ===');
    console.log('🔄 [PAINEL STORE] buildings.length:', buildings.length);
    console.log('🔄 [PAINEL STORE] isLoading:', isLoading);
    console.log('🔄 [PAINEL STORE] error:', error);
    console.log('🔄 [PAINEL STORE] cartItems.length:', cartItems.length);
    console.log('🔄 [PAINEL STORE] searchLocation:', searchLocation);
    console.log('🔄 [PAINEL STORE] selectedLocation:', selectedLocation);
  }, [buildings, isLoading, error, cartItems.length, searchLocation, selectedLocation]);

  const handleCheckoutStart = () => {
    logCheckoutEvent(
      CheckoutEvent.CHECKOUT_INITIATION,
      LogLevel.INFO,
      "Iniciando checkout a partir da loja de prédios profissional",
      { cartItemCount: cartItems.length, timestamp: Date.now() }
    );
    handleProceedToCheckout();
  };

  if (error) {
    console.error('❌ [PAINEL STORE] Erro na loja profissional:', error);
    return (
      <Layout>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-semibold text-red-500 mb-4">
              Erro ao carregar prédios
            </h2>
            <p className="text-muted-foreground mb-6">
              Ocorreu um problema ao buscar os prédios disponíveis. Nossa equipe está trabalhando para resolver.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-[#3C1361] text-white rounded-xl hover:bg-[#3C1361]/80 transition-all duration-300 font-medium"
            >
              Tentar novamente
            </button>
          </div>
        </motion.div>
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
        {/* Promotional Welcome Banner */}
        <AnimatePresence>
          <PromotionBanner 
            showPromotion={showPromotion}
            setShowPromotion={setShowPromotion}
          />
        </AnimatePresence>
        
        {/* Header da Loja Profissional */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#3C1361] via-[#4A1B6B] to-[#3C1361] bg-clip-text text-transparent mb-4">
            Loja de Painéis Digitais
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            Encontre o local perfeito para sua campanha publicitária. Nossa rede oferece os melhores pontos estratégicos da cidade.
          </p>
          
          {/* Contador Dinâmico Sempre Visível */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="inline-flex items-center bg-gradient-to-r from-[#3C1361]/10 via-[#4A1B6B]/10 to-[#3C1361]/10 text-[#3C1361] px-6 py-3 rounded-full border border-[#3C1361]/20 shadow-sm"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <span className="font-semibold text-lg">
              {isLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3C1361] mr-2"></div>
                  Carregando...
                </span>
              ) : (
                `${buildings.length} prédio${buildings.length !== 1 ? 's' : ''} disponível${buildings.length !== 1 ? 'eis' : ''}`
              )}
            </span>
          </motion.div>
        </motion.div>
        
        {/* Layout Profissional Completo */}
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
          onAddToCart={handleAddToCart}
        />
      </motion.div>
    </Layout>
  );
}

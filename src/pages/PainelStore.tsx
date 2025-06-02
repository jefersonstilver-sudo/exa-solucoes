
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import useBuildingStore from '@/hooks/useBuildingStore';
import { useCartManager } from '@/hooks/useCartManager';
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

  // Initialize store on mount
  useEffect(() => {
    console.log('🚀 [PAINEL STORE] Inicializando store da loja profissional');
    initializeStore();
  }, [initializeStore]);

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
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 md:px-6 py-6 mobile-scroll-fix"
      >
        {/* Header da Loja - ALTERADO conforme solicitado */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-[#3C1361] mb-2">
            Escolha seu Espaço
          </h1>
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

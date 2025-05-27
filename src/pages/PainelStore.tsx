
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useSimpleBuildingStore } from '@/hooks/useSimpleBuildingStore';
import { useCartManager } from '@/hooks/useCartManager';
import { useUserSession } from '@/hooks/useUserSession';
import PromotionBanner from '@/components/panel-store/PromotionBanner';
import SimpleBuildingGrid from '@/components/building-store/SimpleBuildingGrid';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export default function PainelStore() {
  console.log('🏢 [PAINEL STORE] === INICIALIZANDO LOJA DE PRÉDIOS ===');

  // Building store state (usando o hook correto)
  const {
    buildings,
    isLoading,
    error,
    refetch
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
    console.log('🔄 [PAINEL STORE] === ESTADO ATUAL ===');
    console.log('🔄 [PAINEL STORE] buildings.length:', buildings.length);
    console.log('🔄 [PAINEL STORE] isLoading:', isLoading);
    console.log('🔄 [PAINEL STORE] error:', error);
    console.log('🔄 [PAINEL STORE] cartItems.length:', cartItems.length);
  }, [buildings, isLoading, error, cartItems.length]);

  const handleCheckoutStart = () => {
    logCheckoutEvent(
      CheckoutEvent.CHECKOUT_INITIATION,
      LogLevel.INFO,
      "Iniciando checkout a partir da loja de prédios",
      { cartItemCount: cartItems.length, timestamp: Date.now() }
    );
    handleProceedToCheckout();
  };

  if (error) {
    console.error('❌ [PAINEL STORE] Erro na loja:', error);
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <h2 className="text-2xl font-semibold text-red-500 mb-4">
            Erro ao carregar prédios
          </h2>
          <p className="text-muted-foreground mb-6">
            Ocorreu um problema ao buscar os prédios disponíveis. Por favor, tente novamente.
          </p>
          <button 
            onClick={() => refetch()} 
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
        className="container mx-auto px-4 md:px-6 py-8"
      >
        {/* Promotional Welcome Banner */}
        <AnimatePresence>
          <PromotionBanner 
            showPromotion={showPromotion}
            setShowPromotion={setShowPromotion}
          />
        </AnimatePresence>
        
        {/* Header da Loja com Contagem */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#3C1361] mb-2">
            Loja de Painéis Digitais
          </h1>
          <p className="text-gray-600 mb-4">
            Selecione um prédio para anunciar seus produtos e serviços
          </p>
          
          {/* Contagem sempre visível */}
          <div className="inline-flex items-center bg-[#3C1361]/10 text-[#3C1361] px-4 py-2 rounded-full">
            <span className="font-semibold">
              {isLoading ? 'Carregando...' : `${buildings.length} prédio${buildings.length !== 1 ? 's' : ''} disponível${buildings.length !== 1 ? 'eis' : ''}`}
            </span>
          </div>
        </div>
        
        {/* Grid de Prédios Simplificado */}
        <SimpleBuildingGrid 
          buildings={buildings}
          isLoading={isLoading}
          onAddToCart={handleAddToCart}
        />
      </motion.div>
    </Layout>
  );
}


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import SearchSection from '@/components/panels/SearchSection';
import { usePanelStore } from '@/hooks/usePanelStore';
import { useCartManager } from '@/hooks/useCartManager';
import { DrawerContent } from '@/components/ui/drawer';
import PanelCart from '@/components/panels/PanelCart';
import { useUserSession } from '@/hooks/useUserSession';
import { Button } from '@/components/ui/button';
import PanelFilterSidebar from '@/components/panels/PanelFilterSidebar';
import PanelCardList from '@/components/panels/PanelCardList';
import { useNavigate } from 'react-router-dom';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

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

  const navigate = useNavigate();

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

  const { isLoggedIn, user } = useUserSession();
  const [showPromotion, setShowPromotion] = useState(true);

  // Backup navigation function
  const directGoToCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      return;
    }
    
    logCheckoutEvent(
      CheckoutEvent.NAVIGATE_TO_PLAN,
      LogLevel.INFO,
      "Tentando navegar diretamente para seleção de plano"
    );
    
    try {
      // Salvar carrinho
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      
      // Tentar navegar
      navigate('/selecionar-plano');
      
      // Fallback para window.location se necessário
      setTimeout(() => {
        if (window.location.pathname.includes('/paineis-digitais/loja')) {
          logCheckoutEvent(
            CheckoutEvent.NAVIGATE_TO_PLAN, 
            LogLevel.WARNING, 
            "Navegação com hook falhou, usando window.location"
          );
          window.location.href = '/selecionar-plano';
        }
      }, 300);
    } catch (error) {
      console.error("Erro na navegação direta:", error);
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_ERROR,
        LogLevel.ERROR,
        "Erro na navegação direta",
        { error }
      );
      
      // Último recurso
      window.location.href = '/selecionar-plano';
    }
  };

  // Effect to hide promotion when user logs in or adds items to cart
  useEffect(() => {
    if (isLoggedIn || cartItems.length > 0) {
      setShowPromotion(false);
    } else {
      setShowPromotion(true);
    }
  }, [isLoggedIn, cartItems.length]);

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
        {/* Debug panel for developer testing */}
        {cartItems.length > 0 && (
          <div className="mb-4 p-3 rounded-md bg-gray-100 border border-gray-300">
            <h3 className="text-sm font-semibold mb-2">Debug: Navegação para checkout</h3>
            <div className="flex gap-2">
              <Button 
                size="sm"
                variant="default"
                onClick={handleProceedToCheckout}
                className="text-xs"
              >
                Checkout normal
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={directGoToCheckout}
                className="text-xs"
              >
                Checkout direto
              </Button>
              <Button 
                size="sm"
                variant="destructive"
                onClick={() => {
                  logCheckoutEvent(
                    CheckoutEvent.NAVIGATE_TO_PLAN,
                    LogLevel.DEBUG,
                    "Navegação forçada via window.location"
                  );
                  window.location.href = '/selecionar-plano';
                }}
                className="text-xs"
              >
                Navegação forçada
              </Button>
            </div>
          </div>
        )}
      
        {/* Promotional Welcome Balloon - Redesigned Premium Banner */}
        <AnimatePresence>
          {showPromotion && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mb-8 bg-gradient-to-r from-[#3C1361] to-[#3C1361]/90 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxwYXRoIGQ9Ik0gLTEwLDEwIGwgNjAsLTIwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4xIiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')] opacity-20"></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
                <div className="mb-4 md:mb-0 max-w-lg">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">É novo por aqui? Ganhe um bônus de estreia na sua primeira campanha! ✨</h3>
                  <p className="text-sm md:text-base text-white/80">
                    Ganhe 1 vídeo profissional por mês com a Indexa Produtora!
                  </p>
                </div>
                <Button 
                  className="bg-[#00FFAB] hover:bg-[#00FFAB]/90 text-[#3C1361] font-medium py-6 px-8 rounded-xl transition-transform hover:scale-105 duration-200 text-base"
                  onClick={() => setShowPromotion(false)}
                >
                  Ver promoção
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
        
        {/* New layout with sidebar on left and single column cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative mt-8">
          {/* Left sidebar with filters and map */}
          <div className="lg:col-span-3 xl:col-span-3">
            <PanelFilterSidebar 
              filters={filters}
              handleFilterChange={handleFilterChange}
              isLoading={isLoading}
              isSearching={isSearching}
            />
          </div>
          
          {/* Main content with panel cards in vertical column */}
          <div className="lg:col-span-9 xl:col-span-9">
            <PanelCardList 
              panels={panels}
              isLoading={isLoading}
              isSearching={isSearching}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              selectedLocation={selectedLocation}
            />
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}

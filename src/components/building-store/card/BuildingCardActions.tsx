
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Bug
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuildingStore } from '@/services/buildingStoreService';
import { convertBuildingToPanel } from '@/services/buildingToPanelService';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';

interface BuildingCardActionsProps {
  building: BuildingStore;
}

const BuildingCardActions: React.FC<BuildingCardActionsProps> = ({ building }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(0);
  const isMobile = useIsMobile();
  const actionTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { addToCart, isItemInCart, isLoading, itemCount, syncVersion, debugClearCache } = useUnifiedCart();
  
  // Check if item is in cart with detailed logging and sync awareness
  const inCart = !isLoading && isItemInCart(building.id);

  console.log('🛒 [BuildingCardActions] === RENDERIZANDO ===');
  console.log('🛒 [BuildingCardActions] Building:', { id: building.id, nome: building.nome });
  console.log('🛒 [BuildingCardActions] States:', { inCart, isLoading, isAdding, showSuccess });
  console.log('🛒 [BuildingCardActions] Cart info:', { itemCount, syncVersion });

  // Reset success state when cart sync changes
  useEffect(() => {
    if (inCart && showSuccess) {
      console.log('🔄 [BuildingCardActions] Item confirmado no carrinho, mantendo sucesso');
    } else if (inCart && !showSuccess) {
      console.log('🔄 [BuildingCardActions] Item detectado no carrinho via sync');
      setShowSuccess(true);
      setIsAdding(false);
    }
  }, [inCart, showSuccess, syncVersion]);

  // Auto-reset success state after delay
  useEffect(() => {
    if (showSuccess && !inCart) {
      console.log('🔄 [BuildingCardActions] Resetando estado de sucesso');
      setTimeout(() => {
        setShowSuccess(false);
        setIsAdding(false);
      }, 2000);
    }
  }, [showSuccess, inCart]);

  const handleAddToCart = async () => {
    const now = Date.now();
    
    // Prevent rapid clicks (debounce)
    if (now - lastActionTime < 1000) {
      console.log('⚠️ [BuildingCardActions] Clique muito rápido, ignorando');
      return;
    }
    
    if (inCart || isAdding || isLoading) {
      console.log('🛒 [BuildingCardActions] Operação bloqueada:', { inCart, isAdding, isLoading });
      return;
    }
    
    try {
      console.log('🛒 [BuildingCardActions] === INICIANDO ADIÇÃO ===');
      console.log('🛒 [BuildingCardActions] Building data:', {
        id: building.id,
        nome: building.nome,
        preco_base: building.preco_base
      });
      
      setLastActionTime(now);
      setIsAdding(true);
      
      // Clear any existing timeout
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }
      
      // Convert building to panel with validation
      const panel = convertBuildingToPanel(building);
      console.log('🔄 [BuildingCardActions] Panel convertido:', {
        id: panel.id,
        buildingId: panel.building_id,
        nome: panel.buildings?.nome
      });
      
      // Validate panel
      if (!panel.id || !panel.buildings) {
        throw new Error('Panel inválido após conversão');
      }
      
      // Add to cart
      console.log('➕ [BuildingCardActions] Chamando addToCart...');
      await addToCart(panel, 30);
      console.log('✅ [BuildingCardActions] addToCart executado');
      
      // Show success state
      setShowSuccess(true);
      
      // Set timeout for state reset
      actionTimeoutRef.current = setTimeout(() => {
        console.log('🔄 [BuildingCardActions] Timeout: resetando estados');
        if (!inCart) {
          setIsAdding(false);
          setShowSuccess(false);
        }
      }, 2000);
      
      console.log('🎉 [BuildingCardActions] === ADIÇÃO CONCLUÍDA ===');
      
    } catch (error) {
      console.error('❌ [BuildingCardActions] Erro:', error);
      setIsAdding(false);
      setShowSuccess(false);
      toast.error(`Erro ao adicionar ${building.nome} ao carrinho`);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced button state logic
  const getButtonState = () => {
    let state;
    if (isAdding) {
      state = 'loading';
    } else if (inCart || showSuccess) {
      state = 'added';
    } else {
      state = 'normal';
    }
    
    console.log('🎨 [BuildingCardActions] Button state:', { 
      building: building.nome, 
      state,
      factors: { isAdding, inCart, showSuccess }
    });
    return state;
  };

  const buttonState = getButtonState();

  // Enhanced button styles
  const getButtonStyles = () => {
    const baseStyles = `font-semibold transition-all duration-300 transform ${
      isMobile ? 'w-full py-3 text-base' : 'px-6 py-2 text-sm'
    }`;

    switch (buttonState) {
      case 'loading':
        return `${baseStyles} bg-[#3C1361]/80 text-white cursor-wait scale-95`;
      case 'added':
        return `${baseStyles} bg-green-500 hover:bg-green-500 text-white cursor-default scale-100`;
      default:
        return `${baseStyles} bg-[#3C1361] hover:bg-[#3C1361]/90 text-white hover:scale-105 active:scale-95`;
    }
  };

  return (
    <div className={`flex items-start justify-between pt-4 border-t border-gray-100 ${
      isMobile ? 'flex-col space-y-3' : 'flex-col lg:flex-row'
    }`}>
      <div className={isMobile ? 'w-full' : 'mb-3 lg:mb-0'}>
        <p className="text-xs text-gray-600 mb-1">A partir de</p>
        <p className={`font-bold text-[#3C1361] ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          R$ {building.preco_base || 280}
          <span className="text-sm font-normal text-gray-500">/mês</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {building.quantidade_telas} painel{building.quantidade_telas !== 1 ? 'éis' : ''} disponível{building.quantidade_telas !== 1 ? 'eis' : ''}
        </p>
        
        {/* Enhanced debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-blue-500 mt-1 space-y-1">
            <p>ID: {building.id}</p>
            <p>InCart: {String(inCart)} | State: {buttonState}</p>
            <p>Sync: {syncVersion} | Count: {itemCount}</p>
            <button 
              onClick={debugClearCache}
              className="flex items-center gap-1 text-red-500 hover:text-red-700"
            >
              <Bug className="h-3 w-3" />
              Debug Clear
            </button>
          </div>
        )}
      </div>
      
      <div className={`flex ${isMobile ? 'w-full justify-center' : 'justify-center lg:justify-end'}`}>
        <Button
          onClick={handleAddToCart}
          size={isMobile ? "default" : "sm"}
          disabled={buttonState === 'added' || buttonState === 'loading' || isLoading}
          className={getButtonStyles()}
        >
          <AnimatePresence mode="wait">
            {buttonState === 'loading' ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center"
              >
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adicionando...
              </motion.div>
            ) : buttonState === 'added' ? (
              <motion.div
                key="added"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center"
              >
                <Check className="h-4 w-4 mr-2" />
                {inCart ? 'No Carrinho' : 'Adicionado!'}
                {!inCart && <Sparkles className="h-3 w-3 ml-1 text-yellow-300" />}
              </motion.div>
            ) : (
              <motion.div
                key="normal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isMobile ? 'Adicionar ao Carrinho' : 'Adicionar'}
                <ShoppingCart className="h-3 w-3 ml-1" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
};

export default BuildingCardActions;

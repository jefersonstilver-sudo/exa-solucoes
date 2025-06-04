
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart,
  Check,
  Loader2,
  Plus,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuildingStore, buildingToPanel } from '@/services/buildingStoreService';
import { Panel } from '@/types/panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useCartManager } from '@/hooks/useCartManager';
import { useEnhancedButtonAnimation } from '@/hooks/useEnhancedButtonAnimation';

interface BuildingCardActionsProps {
  building: BuildingStore;
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const BuildingCardActions: React.FC<BuildingCardActionsProps> = ({ 
  building, 
  onAddToCart 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isMobile = useIsMobile();
  const { isAnimating, isPressed, animationType, startAnimation } = useEnhancedButtonAnimation();
  
  // Connect to cart manager
  const { isItemInCart, initialLoadDone } = useCartManager();
  
  // Check if item is in cart
  const inCart = initialLoadDone ? isItemInCart(building.id) : false;

  console.log('🛒 [BuildingCardActions] Renderizando:', {
    buildingId: building.id,
    buildingName: building.nome,
    inCart,
    initialLoadDone,
    isAdding,
    isAnimating,
    animationType
  });

  const handleAddToCart = async () => {
    if (inCart || isAdding) {
      console.log('🛒 [BuildingCardActions] Item já está no carrinho ou sendo adicionado');
      return;
    }
    
    try {
      console.log('🛒 [BuildingCardActions] Iniciando adição ao carrinho');
      
      // Estado otimista - mostrar loading imediatamente
      setIsAdding(true);
      startAnimation('loading');
      
      // Convert Building to Panel before adding to cart
      const panel = buildingToPanel(building);
      
      // Simular delay mínimo para feedback visual
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Call real add to cart function
      await onAddToCart(panel, 30); // Default duration of 30 days
      
      console.log('🛒 [BuildingCardActions] Item adicionado com sucesso');
      
      // Mostrar estado de sucesso
      setShowSuccess(true);
      startAnimation('success');
      
      // Reset states
      setTimeout(() => {
        setIsAdding(false);
        setShowSuccess(false);
      }, 1500);
      
    } catch (error) {
      console.error('🛒 [BuildingCardActions] Erro ao adicionar ao carrinho:', error);
      setIsAdding(false);
      startAnimation('error');
      
      toast.error('Erro ao adicionar ao carrinho', {
        description: "Tente novamente em alguns instantes",
        duration: 3000,
      });
    }
  };

  // Determinar estado do botão
  const getButtonState = () => {
    if (isAdding) return 'loading';
    if (showSuccess || inCart) return 'added';
    return 'normal';
  };

  const buttonState = getButtonState();

  // Styling baseado no estado com animações aprimoradas
  const getButtonStyles = () => {
    const baseStyles = `font-semibold transition-all duration-300 transform ${
      isMobile ? 'w-full py-3 text-base' : 'px-6 py-2 text-sm'
    }`;

    switch (buttonState) {
      case 'loading':
        return `${baseStyles} bg-[#3C1361]/80 text-white cursor-wait scale-95 shadow-lg`;
      case 'added':
        return `${baseStyles} bg-green-500 hover:bg-green-500 text-white cursor-default scale-100 shadow-xl`;
      default:
        return `${baseStyles} bg-[#3C1361] hover:bg-[#3C1361]/90 text-white hover:scale-105 hover:shadow-xl active:scale-95`;
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
      </div>
      
      <div className={`flex ${isMobile ? 'w-full justify-center' : 'justify-center lg:justify-end'}`}>
        <motion.div
          animate={
            isAnimating 
              ? { 
                  scale: animationType === 'success' ? [1, 1.1, 1] : [1, 0.95, 1],
                  rotateZ: animationType === 'success' ? [0, 2, 0] : 0
                } 
              : isPressed 
                ? { scale: 0.98 }
                : { scale: 1 }
          }
          transition={{ 
            duration: isAnimating ? 0.8 : 0.2,
            ease: "easeInOut"
          }}
          className={isMobile ? 'w-full' : ''}
        >
          <Button
            onClick={handleAddToCart}
            size={isMobile ? "default" : "sm"}
            disabled={buttonState === 'added' || buttonState === 'loading'}
            className={getButtonStyles()}
          >
            <AnimatePresence mode="wait">
              {buttonState === 'loading' ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </motion.div>
              ) : buttonState === 'added' ? (
                <motion.div
                  key="added"
                  initial={{ opacity: 0, scale: 0.8, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -5 }}
                  className="flex items-center"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                  </motion.div>
                  {inCart ? 'No Carrinho' : 'Adicionado!'}
                  {!inCart && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      <Sparkles className="h-3 w-3 ml-1 text-yellow-300" />
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="normal"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                  </motion.div>
                  {isMobile ? 'Adicionar ao Carrinho' : 'Adicionar'}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ShoppingCart className="h-3 w-3 ml-1" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default BuildingCardActions;

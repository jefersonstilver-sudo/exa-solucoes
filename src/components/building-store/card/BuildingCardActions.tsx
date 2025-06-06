
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
  const isMobile = useIsMobile();
  
  const { addToCart, isItemInCart, isLoading } = useUnifiedCart();
  
  // Check if item is in cart
  const inCart = !isLoading && isItemInCart(building.id);

  console.log('🛒 [BuildingCardActions] Renderizando:', {
    buildingId: building.id,
    buildingName: building.nome,
    inCart,
    isLoading,
    isAdding
  });

  const handleAddToCart = async () => {
    if (inCart || isAdding || isLoading) {
      console.log('🛒 [BuildingCardActions] Operação bloqueada:', { inCart, isAdding, isLoading });
      return;
    }
    
    try {
      console.log('🛒 [BuildingCardActions] Iniciando adição');
      setIsAdding(true);
      
      // Convert building to panel
      const panel = convertBuildingToPanel(building);
      
      // Add to cart
      await addToCart(panel, 30);
      
      // Show success state
      setShowSuccess(true);
      setTimeout(() => {
        setIsAdding(false);
        setShowSuccess(false);
      }, 1500);
      
    } catch (error) {
      console.error('🛒 [BuildingCardActions] Erro:', error);
      setIsAdding(false);
      toast.error('Erro ao adicionar ao carrinho');
    }
  };

  // Determine button state
  const getButtonState = () => {
    if (isAdding) return 'loading';
    if (showSuccess || inCart) return 'added';
    return 'normal';
  };

  const buttonState = getButtonState();

  // Button styles
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

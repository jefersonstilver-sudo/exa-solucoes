
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart,
  Check,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BuildingStore, buildingToPanel } from '@/services/buildingStoreService';
import { Panel } from '@/types/panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useCartManager } from '@/hooks/useCartManager';
import { useButtonAnimation } from '@/hooks/useButtonAnimation';

interface BuildingCardActionsProps {
  building: BuildingStore;
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const BuildingCardActions: React.FC<BuildingCardActionsProps> = ({ 
  building, 
  onAddToCart 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const isMobile = useIsMobile();
  const { isAnimating, isPressed, startAnimation } = useButtonAnimation();
  
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
    isAnimating
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
      startAnimation();
      
      // Convert Building to Panel before adding to cart
      const panel = buildingToPanel(building);
      
      // Call real add to cart function
      await onAddToCart(panel, 30); // Default duration of 30 days
      
      console.log('🛒 [BuildingCardActions] Item adicionado com sucesso');
      
      // Reset loading state
      setTimeout(() => {
        setIsAdding(false);
      }, 1000);
      
    } catch (error) {
      console.error('🛒 [BuildingCardActions] Erro ao adicionar ao carrinho:', error);
      setIsAdding(false);
      
      toast.error('Erro ao adicionar ao carrinho', {
        description: "Tente novamente em alguns instantes",
        duration: 3000,
      });
    }
  };

  // Determinar estado do botão
  const getButtonState = () => {
    if (isAdding) return 'loading';
    if (inCart) return 'added';
    return 'normal';
  };

  const buttonState = getButtonState();

  // Styling baseado no estado
  const getButtonStyles = () => {
    const baseStyles = `font-semibold transition-all duration-300 ${
      isMobile ? 'w-full py-3 text-base' : 'px-6 py-2 text-sm'
    }`;

    switch (buttonState) {
      case 'loading':
        return `${baseStyles} bg-indexa-purple/80 text-white cursor-wait`;
      case 'added':
        return `${baseStyles} bg-green-500 hover:bg-green-500 text-white cursor-default`;
      default:
        return `${baseStyles} bg-indexa-purple hover:bg-indexa-purple-dark text-white hover:scale-105`;
    }
  };

  return (
    <div className={`flex items-start justify-between pt-4 border-t border-gray-100 ${
      isMobile ? 'flex-col space-y-3' : 'flex-col lg:flex-row'
    }`}>
      <div className={isMobile ? 'w-full' : 'mb-3 lg:mb-0'}>
        <p className="text-xs text-gray-600 mb-1">A partir de</p>
        <p className={`font-bold text-indexa-purple ${isMobile ? 'text-xl' : 'text-2xl'}`}>
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
                  scale: [1, 1.05, 1], 
                  backgroundColor: ['#3C1361', '#22c55e', '#3C1361']
                } 
              : isPressed 
                ? { scale: 1.02 }
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
            {buttonState === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Adicionando...
              </>
            ) : buttonState === 'added' ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Adicionado
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-1" />
                {isMobile ? 'Adicionar ao Carrinho' : 'Adicionar ao Carrinho'}
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default BuildingCardActions;

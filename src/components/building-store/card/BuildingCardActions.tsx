
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BuildingStore, buildingToPanel } from '@/services/buildingStoreService';
import { Panel } from '@/types/panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useCartManager } from '@/hooks/useCartManager';

interface BuildingCardActionsProps {
  building: BuildingStore;
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const BuildingCardActions: React.FC<BuildingCardActionsProps> = ({ 
  building, 
  onAddToCart 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();
  
  // Connect to cart manager
  const { isItemInCart, cartItems, initialLoadDone } = useCartManager();
  
  // Check if item is in cart - using memoization for performance
  const inCart = useMemo(() => {
    if (!initialLoadDone) return false;
    return isItemInCart(building.id);
  }, [building.id, cartItems, initialLoadDone, isItemInCart]);

  const handleAddToCart = async () => {
    if (inCart) return;
    
    try {
      // Convert Building to Panel before adding to cart
      const panel = buildingToPanel(building);
      
      setIsAnimating(true);
      
      // Call real add to cart function
      await onAddToCart(panel, 30); // Default duration of 30 days
      
      // Success toast
      toast.success(`${building.nome} adicionado ao carrinho!`, {
        description: "Painel adicionado com duração de 30 dias",
        duration: 3000,
      });
      
      // Animation feedback
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
      
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      setIsAnimating(false);
      
      toast.error('Erro ao adicionar ao carrinho', {
        description: "Tente novamente em alguns instantes",
        duration: 3000,
      });
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
          animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.6 }}
          className={isMobile ? 'w-full' : ''}
        >
          <Button
            onClick={handleAddToCart}
            size={isMobile ? "default" : "sm"}
            disabled={inCart}
            className={`font-semibold transition-all duration-300 ${
              isMobile ? 'w-full py-3 text-base' : 'px-6 py-2 text-sm'
            } ${
              inCart 
                ? 'bg-green-500 hover:bg-green-500 text-white cursor-default' 
                : 'bg-indexa-purple hover:bg-indexa-purple-dark text-white hover:scale-105'
            }`}
          >
            {inCart ? (
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


import React from 'react';
import { motion } from 'framer-motion';
import { BuildingStore, buildingToPanel } from '@/services/buildingStoreService';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingStoreCard from '../BuildingStoreCard';

interface BuildingStoreGridContentProps {
  buildings: BuildingStore[];
  onAddToCart: (panel: Panel, duration?: number) => void;
  cartItems: CartItem[];
  isPanelInCart?: (panelId: string) => boolean;
}

const BuildingStoreGridContent: React.FC<BuildingStoreGridContentProps> = ({
  buildings,
  onAddToCart,
  cartItems,
  isPanelInCart
}) => {
  const isMobile = useIsMobile();

  console.log('🏗️ [BUILDING GRID CONTENT] Renderizando', buildings.length, 'prédios');
  
  return (
    <div className={`grid gap-6 ${
      isMobile 
        ? 'grid-cols-1' 
        : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-1'
    }`}>
      {buildings.map((building, index) => {
        // Convert building to panel to check cart status
        const panel = buildingToPanel(building);
        const isInCart = isPanelInCart ? isPanelInCart(panel.id) : cartItems.some(item => item.panel.id === panel.id);
        
        console.log('🏢 [BUILDING GRID CONTENT] Building:', building.nome, 'isInCart:', isInCart);
        
        return (
          <motion.div
            key={building.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
          >
            <BuildingStoreCard
              building={building}
              onAddToCart={onAddToCart}
              isInCart={isInCart}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default BuildingStoreGridContent;


import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuildingStore } from '@/services/buildingStoreService';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { useIsMobile } from '@/hooks/use-mobile';
import BuildingStoreCard from '../BuildingStoreCard';

interface BuildingStoreGridContentProps {
  buildings: BuildingStore[];
  onAddToCart: (panel: Panel, duration?: number) => void;
  cartItems: CartItem[];
}

const BuildingStoreGridContent: React.FC<BuildingStoreGridContentProps> = ({
  buildings,
  onAddToCart,
  cartItems
}) => {
  const isMobile = useIsMobile();

  // Function to check if a building is in cart
  const isBuildingInCart = (building: BuildingStore): boolean => {
    if (!cartItems || cartItems.length === 0) return false;
    
    // Check if any cart item corresponds to this building
    return cartItems.some(cartItem => {
      // Compare by building_id if available, otherwise by building name
      return cartItem.panel.building_id === building.id ||
             cartItem.panel.buildings?.nome === building.nome;
    });
  };

  return (
    <AnimatePresence mode="popLayout">
      {buildings.map((building, index) => {
        console.log(`🏢 [BUILDING STORE GRID] Renderizando prédio ${index + 1}: ${building.nome}`);
        
        const isInCart = isBuildingInCart(building);
        console.log(`🛒 [BUILDING STORE GRID] ${building.nome} está no carrinho:`, isInCart);
        
        return (
          <motion.div
            key={building.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            whileHover={!isMobile ? { 
              y: -8,
              transition: { duration: 0.2, type: "spring", stiffness: 400 }
            } : {}}
            className="group"
          >
            <BuildingStoreCard
              building={building}
              onAddToCart={onAddToCart}
              isInCart={isInCart}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
};

export default BuildingStoreGridContent;

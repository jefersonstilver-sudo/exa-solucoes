
import React from 'react';
import { motion } from 'framer-motion';
import { BuildingStore } from '@/services/buildingStoreService';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCartManager } from '@/hooks/useCartManager';
import BuildingStoreGridLoading from './grid/BuildingStoreGridLoading';
import BuildingStoreGridEmpty from './grid/BuildingStoreGridEmpty';
import BuildingStoreGridStatus from './grid/BuildingStoreGridStatus';
import BuildingStoreGridContent from './grid/BuildingStoreGridContent';

interface BuildingStoreGridProps {
  buildings: BuildingStore[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  onAddToCart: (panel: Panel, duration?: number) => void;
  selectedLocation: { lat: number, lng: number } | null;
  cartItems: CartItem[];
}

const BuildingStoreGrid: React.FC<BuildingStoreGridProps> = ({
  buildings,
  isLoading,
  isSearching,
  onAddToCart,
  selectedLocation,
  cartItems
}) => {
  const isMobile = useIsMobile();
  const { isPanelInCart } = useCartManager();

  console.log('🏢 [BUILDING STORE GRID] === RENDERIZANDO GRID ===');
  console.log('🏢 [BUILDING STORE GRID] buildings?.length:', buildings?.length);
  console.log('🏢 [BUILDING STORE GRID] isMobile:', isMobile);
  console.log('🏢 [BUILDING STORE GRID] cartItems.length:', cartItems.length);

  // Loading state
  if (isLoading || isSearching) {
    console.log('🔄 [BUILDING STORE GRID] Mostrando loading state...');
    return <BuildingStoreGridLoading isSearching={isSearching} />;
  }

  // Empty state
  if (!buildings || buildings.length === 0) {
    console.log('❌ [BUILDING STORE GRID] Nenhum prédio encontrado');
    return <BuildingStoreGridEmpty selectedLocation={selectedLocation} />;
  }

  console.log('✅ [BUILDING STORE GRID] EXIBINDO', buildings.length, 'prédios');
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`space-y-${isMobile ? '6' : '8'}`}
    >
      {/* Status da busca se houver localização selecionada */}
      <BuildingStoreGridStatus 
        selectedLocation={selectedLocation}
        buildingsCount={buildings.length}
      />

      {/* Grid de prédios responsivo */}
      <BuildingStoreGridContent
        buildings={buildings}
        onAddToCart={onAddToCart}
        cartItems={cartItems}
        isPanelInCart={isPanelInCart}
      />
    </motion.div>
  );
};

export default BuildingStoreGrid;

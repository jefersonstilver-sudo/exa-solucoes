
import React from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { SimpleBuildingStore } from '@/services/simpleBuildingService';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { buildingToPanel } from '@/services/buildingStoreService';
import BuildingStoreCard from './BuildingStoreCard';

interface SimpleBuildingGridProps {
  buildings: SimpleBuildingStore[];
  isLoading: boolean;
  onAddToCart: (panel: Panel, duration?: number) => void;
  cartItems?: CartItem[]; // NEW: Add cartItems prop
}

// Adapter para converter SimpleBuildingStore para BuildingStore
const convertToBuildingStore = (building: SimpleBuildingStore) => {
  console.log('🔄 [SIMPLE GRID] Convertendo prédio:', building.nome);
  return {
    id: building.id,
    nome: building.nome,
    endereco: building.endereco,
    bairro: building.bairro,
    venue_type: building.venue_type,
    status: building.status,
    latitude: building.latitude,
    longitude: building.longitude,
    publico_estimado: building.publico_estimado,
    visualizacoes_mes: building.visualizacoes_mes,
    preco_base: building.preco_base,
    imagem_principal: building.imagem_principal,
    imagem_2: building.imagem_2,
    imagem_3: building.imagem_3,
    imagem_4: building.imagem_4,
    amenities: building.amenities || [],
    caracteristicas: building.caracteristicas || [],
    padrao_publico: building.padrao_publico,
    quantidade_telas: building.quantidade_telas
  };
};

const SimpleBuildingGrid: React.FC<SimpleBuildingGridProps> = ({
  buildings,
  isLoading,
  onAddToCart,
  cartItems = [] // Default empty array
}) => {
  console.log('🏢 [SIMPLE GRID] === RENDERIZANDO ===');
  console.log('🏢 [SIMPLE GRID] buildings.length:', buildings.length);
  console.log('🏢 [SIMPLE GRID] isLoading:', isLoading);
  console.log('🏢 [SIMPLE GRID] cartItems.length:', cartItems.length);

  // Function to check if a building is in cart
  const isBuildingInCart = (building: SimpleBuildingStore): boolean => {
    if (!cartItems || cartItems.length === 0) return false;
    
    // Check if any cart item corresponds to this building
    return cartItems.some(cartItem => {
      // Compare by building_id if available, otherwise by building name
      return cartItem.panel.building_id === building.id ||
             cartItem.panel.buildings?.nome === building.nome;
    });
  };

  if (isLoading) {
    console.log('🔄 [SIMPLE GRID] Mostrando loading...');
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, index) => (
          <motion.div 
            key={index} 
            className="animate-pulse"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="bg-gray-200 h-64 rounded-xl"></div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (buildings.length === 0) {
    console.log('❌ [SIMPLE GRID] Nenhum prédio - mostrando empty state');
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="flex flex-col items-center space-y-4">
          <Building2 className="h-16 w-16 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700">
            Nenhum prédio disponível
          </h3>
          <p className="text-gray-500 max-w-md">
            Não encontramos prédios ativos em nossa rede no momento. Nossa equipe está trabalhando para adicionar mais locais.
          </p>
        </div>
      </motion.div>
    );
  }

  console.log('✅ [SIMPLE GRID] EXIBINDO', buildings.length, 'prédios');
  
  return (
    <div className="space-y-6">
      {buildings.map((building, index) => {
        console.log(`🏢 [SIMPLE GRID] Renderizando prédio ${index + 1}: ${building.nome}`);
        const convertedBuilding = convertToBuildingStore(building);
        const isInCart = isBuildingInCart(building);
        
        console.log(`🛒 [SIMPLE GRID] ${building.nome} está no carrinho:`, isInCart);
        
        return (
          <motion.div
            key={building.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ 
              y: -2,
              transition: { duration: 0.2 }
            }}
          >
            <BuildingStoreCard
              building={convertedBuilding}
              onAddToCart={onAddToCart}
              isInCart={isInCart}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default SimpleBuildingGrid;

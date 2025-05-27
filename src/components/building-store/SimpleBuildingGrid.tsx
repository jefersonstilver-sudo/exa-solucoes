
import React from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { SimpleBuildingStore } from '@/services/simpleBuildingService';
import { Panel } from '@/types/panel';
import { buildingToPanel } from '@/services/buildingStoreService';
import BuildingStoreCard from './BuildingStoreCard';

interface SimpleBuildingGridProps {
  buildings: SimpleBuildingStore[];
  isLoading: boolean;
  onAddToCart: (panel: Panel, duration?: number) => void;
}

// Adapter para converter SimpleBuildingStore para BuildingStore
const convertToBuildingStore = (building: SimpleBuildingStore) => {
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
  onAddToCart
}) => {
  console.log('🏢 [SIMPLE GRID] === RENDERIZANDO ===');
  console.log('🏢 [SIMPLE GRID] buildings.length:', buildings.length);
  console.log('🏢 [SIMPLE GRID] isLoading:', isLoading);

  if (isLoading) {
    console.log('🔄 [SIMPLE GRID] Mostrando loading...');
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 h-56 rounded-xl"></div>
          </div>
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
        className="text-center py-12"
      >
        <div className="flex flex-col items-center space-y-3">
          <Building2 className="h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700">
            Nenhum prédio disponível
          </h3>
          <p className="text-gray-500 max-w-md text-sm">
            Não encontramos prédios ativos em nossa rede no momento.
          </p>
        </div>
      </motion.div>
    );
  }

  console.log('✅ [SIMPLE GRID] EXIBINDO', buildings.length, 'prédios');
  
  return (
    <div className="space-y-4">
      {buildings.map((building, index) => {
        console.log(`🏢 [SIMPLE GRID] Renderizando prédio ${index + 1}: ${building.nome}`);
        // CORREÇÃO CRÍTICA: Converter SimpleBuildingStore para BuildingStore
        const convertedBuilding = convertToBuildingStore(building);
        console.log(`🔄 [SIMPLE GRID] Prédio convertido:`, convertedBuilding);
        
        return (
          <motion.div
            key={building.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <BuildingStoreCard
              building={convertedBuilding}
              onAddToCart={onAddToCart}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default SimpleBuildingGrid;

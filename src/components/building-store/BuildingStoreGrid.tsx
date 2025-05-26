
import React, { useState, useMemo } from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BuildingStoreCard from './BuildingStoreCard';
import LoadingPanels from '@/components/panels/LoadingPanels';
import EmptyResults from '@/components/panels/EmptyResults';
import { sortBuildings } from '@/services/buildingFilterService';

interface BuildingStoreGridProps {
  buildings: BuildingStore[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  onViewPanels: (building: BuildingStore) => void;
  selectedLocation: {lat: number, lng: number} | null;
}

const BuildingStoreGrid: React.FC<BuildingStoreGridProps> = ({ 
  buildings, 
  isLoading, 
  isSearching,
  onViewPanels,
  selectedLocation
}) => {
  const [sortOption, setSortOption] = useState('distance');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Sortear prédios usando o serviço
  const sortedBuildings = useMemo(() => {
    if (!buildings) {
      return [];
    }
    return sortBuildings(buildings, sortOption, selectedLocation);
  }, [buildings, sortOption, selectedLocation]);

  if (isLoading || isSearching) {
    return <LoadingPanels vertical={true} count={3} />;
  }

  if (!buildings || buildings.length === 0) {
    return (
      <div className="space-y-6 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3C1361]">
              Prédios Disponíveis
            </h1>
            <p className="text-gray-500 mt-1">
              Nenhum prédio ativo encontrado na nossa rede
            </p>
          </div>
        </div>
        <EmptyResults />
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3C1361]">
            Prédios Disponíveis
          </h1>
          <p className="text-gray-500 mt-1">
            {buildings.length} prédio{buildings.length !== 1 ? 's' : ''} ativo{buildings.length !== 1 ? 's' : ''} disponível{buildings.length !== 1 ? 'eis' : ''} {selectedLocation ? 'próximos à localização selecionada' : 'em nossa rede'}
          </p>
        </div>
        
        <Select 
          defaultValue="distance"
          value={sortOption}
          onValueChange={setSortOption}
        >
          <SelectTrigger className="w-[220px] bg-white">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {selectedLocation && <SelectItem value="distance">Mais próximos</SelectItem>}
            <SelectItem value="price-asc">Preço: menor para maior</SelectItem>
            <SelectItem value="price-desc">Preço: maior para menor</SelectItem>
            <SelectItem value="audience-desc">Maior público</SelectItem>
            <SelectItem value="views-desc">Mais visualizações</SelectItem>
            <SelectItem value="panels-desc">Mais painéis</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Building Grid - Single Column */}
      {sortedBuildings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-gray-100 rounded-full p-4 mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum prédio encontrado</h3>
          <p className="text-gray-500 max-w-md">
            Tente ajustar seus filtros ou buscar em outra localização para encontrar prédios disponíveis.
          </p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {sortedBuildings.map(building => (
            <motion.div
              key={building.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <BuildingStoreCard
                building={building}
                onViewPanels={onViewPanels}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default BuildingStoreGrid;

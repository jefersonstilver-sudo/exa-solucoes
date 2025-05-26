
import React, { useState, useMemo } from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BuildingStoreCard from './BuildingStoreCard';
import LoadingPanels from '@/components/panels/LoadingPanels';
import EmptyResults from '@/components/panels/EmptyResults';
import { sortBuildings } from '@/services/buildingFilterService';
import { Panel } from '@/types/panel';

interface BuildingStoreGridProps {
  buildings: BuildingStore[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  onViewPanels: (building: BuildingStore) => void;
  selectedLocation: {lat: number, lng: number} | null;
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const BuildingStoreGrid: React.FC<BuildingStoreGridProps> = ({ 
  buildings, 
  isLoading, 
  isSearching,
  onViewPanels,
  selectedLocation,
  onAddToCart
}) => {
  const [sortOption, setSortOption] = useState('distance');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
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
      <div className="space-y-8 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-[#3C1361] mb-2">
              Prédios Disponíveis
            </h1>
            <p className="text-gray-500 text-lg">
              Nenhum prédio ativo encontrado na nossa rede
            </p>
          </div>
        </div>
        <EmptyResults />
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-10">
      {/* Header */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-[#3C1361] mb-2">
            Prédios Disponíveis
          </h1>
          <p className="text-gray-600 text-lg">
            {buildings.length} prédio{buildings.length !== 1 ? 's' : ''} ativo{buildings.length !== 1 ? 's' : ''} disponível{buildings.length !== 1 ? 'eis' : ''} {selectedLocation ? 'próximos à localização selecionada' : 'em nossa rede'}
          </p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Select 
            defaultValue="distance"
            value={sortOption}
            onValueChange={setSortOption}
          >
            <SelectTrigger className="w-[250px] bg-white shadow-sm border-2 border-gray-200 hover:border-[#3C1361]/30 transition-colors duration-200 rounded-xl">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-white shadow-xl border-2 border-gray-100 rounded-xl">
              {selectedLocation && <SelectItem value="distance">Mais próximos</SelectItem>}
              <SelectItem value="price-asc">Preço: menor para maior</SelectItem>
              <SelectItem value="price-desc">Preço: maior para menor</SelectItem>
              <SelectItem value="audience-desc">Maior público</SelectItem>
              <SelectItem value="views-desc">Mais visualizações</SelectItem>
              <SelectItem value="panels-desc">Mais painéis</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      </motion.div>
      
      {/* Building Grid - Single Column Optimized */}
      {sortedBuildings.length === 0 ? (
        <motion.div 
          className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl shadow-sm border border-gray-100"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-gray-100 rounded-full p-6 mb-6">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-gray-800">Nenhum prédio encontrado</h3>
          <p className="text-gray-500 max-w-md text-lg">
            Tente ajustar seus filtros ou buscar em outra localização para encontrar prédios disponíveis.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {sortedBuildings.map((building, index) => (
            <motion.div
              key={building.id}
              variants={itemVariants}
              className="w-full"
            >
              <BuildingStoreCard
                building={building}
                onViewPanels={onViewPanels}
                onAddToCart={onAddToCart}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default BuildingStoreGrid;

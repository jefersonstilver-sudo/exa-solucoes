
import React from 'react';
import { motion } from 'framer-motion';
import { FilterOptions } from '@/types/filter';

import SearchForm from './search/SearchForm';
import LocationInfo from './search/LocationInfo';

interface SearchSectionProps {
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  isSearching: boolean;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation?: () => void;
  filters: FilterOptions;
  handleFilterChange: (filters: Partial<FilterOptions>) => void;
  panelsCount: number;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  searchLocation,
  setSearchLocation,
  selectedLocation,
  isSearching,
  handleSearch,
  handleClearLocation,
  filters,
  handleFilterChange,
  panelsCount
}) => {
  // Check if specific location types are selected
  const isResidentialOnly = filters.locationType.includes('residential') && !filters.locationType.includes('commercial');
  const isCommercialOnly = filters.locationType.includes('commercial') && !filters.locationType.includes('residential');
  const isBothTypes = filters.locationType.includes('residential') && filters.locationType.includes('commercial');

  // Toggle location type filter - Lógica melhorada
  const toggleLocationType = (type: string) => {
    // Clone atual da lista de tipos
    let newLocationTypes = [...filters.locationType];
    
    // Verifica se o tipo atual já está selecionado
    if (newLocationTypes.includes(type)) {
      // Se só temos um tipo selecionado (e é este), não permitimos desmarcá-lo
      if (newLocationTypes.length === 1) {
        console.log("Não é possível desmarcar todos os tipos");
        return; // Mantém pelo menos um tipo selecionado
      }
      
      // Remove o tipo clicado
      newLocationTypes = newLocationTypes.filter(t => t !== type);
    } else {
      // Adiciona o tipo clicado
      newLocationTypes.push(type);
    }
    
    console.log("Novos tipos selecionados:", newLocationTypes);
    handleFilterChange({ locationType: newLocationTypes });
  };

  // Função para selecionar ambos os tipos
  const selectAllTypes = () => {
    handleFilterChange({ locationType: ['residential', 'commercial'] });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-enhanced hover:shadow-enhanced-hover transition-all duration-300 mb-8 border border-gray-200"
    >
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-indexa-purple mb-6">
          Encontre Painéis Digitais
        </h1>
        
        <SearchForm
          searchLocation={searchLocation}
          setSearchLocation={setSearchLocation}
          isSearching={isSearching}
          handleSearch={handleSearch}
        />
        
        {/* Location type filters - Movidos para a barra lateral */}
        <LocationInfo
          searchLocation={searchLocation}
          selectedLocation={selectedLocation}
          filters={filters}
          handleFilterChange={handleFilterChange}
          panelsCount={panelsCount}
        />
      </div>
    </motion.div>
  );
};

export default SearchSection;

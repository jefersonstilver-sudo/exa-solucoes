
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BuildingFilters } from '@/hooks/useBuildingStore';

interface BuildingSearchSectionProps {
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  isSearching: boolean;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
  filters: BuildingFilters;
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => void;
  buildingsCount: number;
}

const BuildingSearchSection: React.FC<BuildingSearchSectionProps> = ({
  searchLocation,
  setSearchLocation,
  selectedLocation,
  isSearching,
  handleSearch,
  handleClearLocation,
  filters,
  handleFilterChange,
  buildingsCount
}) => {
  // LOGS para debug do contador
  console.log('🔍 [BUILDING SEARCH] buildingsCount recebido:', buildingsCount);
  console.log('🔍 [BUILDING SEARCH] Vai exibir:', buildingsCount > 0 
    ? `${buildingsCount} ${buildingsCount === 1 ? 'prédio encontrado' : 'prédios encontrados'}`
    : 'Busque por localização ou explore todos os prédios disponíveis'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchLocation);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border p-6 mb-8"
    >
      {/* Header with title and results count */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Encontre Prédios para Publicidade
          </h2>
          <p className="text-gray-600 mt-1">
            {buildingsCount > 0 
              ? `${buildingsCount} ${buildingsCount === 1 ? 'prédio encontrado' : 'prédios encontrados'}`
              : 'Busque por localização ou explore todos os prédios disponíveis'
            }
          </p>
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          
          <Input
            type="text"
            placeholder="Digite um endereço, bairro ou cidade..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="pl-10 pr-12 h-12 text-base"
          />
          
          {selectedLocation && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button 
            type="submit" 
            disabled={isSearching}
            className="bg-[#3C1361] hover:bg-[#3C1361]/90 text-white px-6 py-3 h-12"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </>
            )}
          </Button>
          
          {selectedLocation && (
            <Button 
              type="button"
              variant="outline"
              onClick={handleClearLocation}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 h-12"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar busca
            </Button>
          )}
        </div>
      </form>

      {/* Search status */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              Buscando prédios próximos ao local: {searchLocation}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BuildingSearchSection;

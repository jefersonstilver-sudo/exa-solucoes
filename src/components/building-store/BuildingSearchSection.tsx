
import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Filter } from 'lucide-react';
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
  handleFilterChange: (filters: Partial<BuildingFilters>) => void;
  buildingsCount: number;
}

const BuildingSearchSection: React.FC<BuildingSearchSectionProps> = ({
  searchLocation,
  setSearchLocation,
  selectedLocation,
  isSearching,
  handleSearch,
  handleClearLocation,
  buildingsCount
}) => {
  console.log('🔍 [BUILDING SEARCH] buildingsCount recebido:', buildingsCount);
  console.log('🔍 [BUILDING SEARCH] Vai exibir:', buildingsCount, 'prédios encontrados');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchLocation.trim()) {
      handleSearch(searchLocation);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mb-8"
    >
      {/* Card Principal com Sombra Aumentada */}
      <div className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-3xl p-8 shadow-2xl border border-gray-100/50 backdrop-blur-sm relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#3C1361]/5 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#58E3AB]/5 to-transparent rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#3C1361] mb-3">
              Encontre prédios para publicidade
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubra locais estratégicos para sua campanha publicitária com nossa tecnologia de painéis digitais
            </p>
          </motion.div>

          {/* Barra de busca */}
          <motion.form 
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative flex flex-col sm:flex-row gap-4 items-stretch">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3C1361] h-5 w-5 z-10" />
                <Input
                  type="text"
                  placeholder="Digite o endereço, bairro ou cidade..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-[#3C1361] focus:ring-4 focus:ring-[#3C1361]/10 bg-white/80 backdrop-blur-sm transition-all duration-300 shadow-lg"
                />
                {selectedLocation && (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isSearching || !searchLocation.trim()}
                className="px-8 py-4 bg-gradient-to-r from-[#3C1361] to-[#4A1B7D] hover:from-[#4A1B7D] hover:to-[#3C1361] text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSearching ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                    Buscando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Search className="mr-2 h-5 w-5" />
                    Buscar
                  </div>
                )}
              </Button>
            </div>
          </motion.form>

          {/* Resultado da busca */}
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="inline-flex items-center px-6 py-3 bg-[#3C1361]/10 backdrop-blur-sm rounded-full text-[#3C1361] font-medium">
              <Filter className="mr-2 h-4 w-4" />
              {buildingsCount} prédios encontrados
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default BuildingSearchSection;

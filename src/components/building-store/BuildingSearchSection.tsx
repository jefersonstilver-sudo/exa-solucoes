
import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { useIsMobile } from '@/hooks/use-mobile';

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
  handleClearLocation
}) => {
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchLocation.trim()) {
      handleSearch(searchLocation);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 building-search-section">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
        {/* Container principal com espaçamento adequado */}
        <div className={`w-full relative z-20 ${isMobile ? 'px-4 py-3 mt-2' : 'px-6 py-4 mt-3'}`}>
          <div className="w-full max-w-6xl mx-auto">
            {/* Card principal com proteções contra sobreposição */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative z-10">
              {/* Container interno com padding adequado */}
              <div className={`relative ${isMobile ? 'p-4' : 'p-8'}`}>
                {/* Elementos decorativos apenas em desktop */}
                {!isMobile && (
                  <>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#3C1361]/5 to-transparent rounded-full -translate-y-24 translate-x-24"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#58E3AB]/5 to-transparent rounded-full translate-y-16 -translate-x-16"></div>
                  </>
                )}
                
                {/* Header com título principal - SEMPRE VISÍVEL */}
                <motion.div 
                  className={`text-center relative z-30 ${isMobile ? 'mb-6' : 'mb-8'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className={`font-bold text-[#3C1361] ${isMobile ? 'text-2xl mb-3' : 'text-4xl mb-4'}`}>
                    Encontre prédios para publicidade
                  </h1>
                </motion.div>

                {/* Barra de busca com z-index alto */}
                <motion.form 
                  onSubmit={handleSubmit}
                  className="relative z-30"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className={`flex items-stretch gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
                    <div className="flex-1 relative">
                      <MapPin className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3C1361] z-10 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                      <Input
                        type="text"
                        placeholder={isMobile ? "Digite endereço ou bairro..." : "Digite o endereço, bairro ou cidade..."}
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        className={`w-full border-2 border-gray-200 rounded-xl focus:border-[#3C1361] focus:ring-2 focus:ring-[#3C1361]/10 bg-white transition-all duration-300 shadow-lg ${
                          isMobile ? 'pl-12 pr-4 py-4 text-base h-14' : 'pl-14 pr-4 py-5 text-lg h-16'
                        }`}
                      />
                      {selectedLocation && (
                        <button
                          type="button"
                          onClick={handleClearLocation}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isSearching || !searchLocation.trim()}
                      className={`bg-gradient-to-r from-[#3C1361] to-[#4A1B7D] hover:from-[#4A1B7D] hover:to-[#3C1361] text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                        isMobile ? 'px-8 py-4 h-14 w-full' : 'px-10 py-5 h-16'
                      }`}
                    >
                      {isSearching ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                          Buscando...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Search className="mr-2 h-5 w-5" />
                          Buscar
                        </div>
                      )}
                    </Button>
                  </div>
                </motion.form>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BuildingSearchSection;

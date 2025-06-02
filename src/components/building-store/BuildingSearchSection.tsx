
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
    <div className={`w-full ${isMobile ? 'mb-6' : 'mb-8'}`}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        {/* Card Principal com layout mobile otimizado */}
        <div className={`bg-gradient-to-br from-white via-gray-50/50 to-white rounded-2xl shadow-xl border border-gray-100/50 backdrop-blur-sm relative overflow-hidden ${
          isMobile ? 'mx-2 p-4' : 'p-6'
        }`}>
          {/* Elementos decorativos de fundo - apenas em desktop */}
          {!isMobile && (
            <>
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#3C1361]/5 to-transparent rounded-full -translate-y-24 translate-x-24"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#58E3AB]/5 to-transparent rounded-full translate-y-16 -translate-x-16"></div>
            </>
          )}
          
          <div className="relative z-10">
            {/* Header com título principal - SEMPRE VISÍVEL */}
            <motion.div 
              className={`text-center ${isMobile ? 'mb-4' : 'mb-6'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className={`font-bold text-[#3C1361] ${
                isMobile ? 'text-xl mb-2' : 'text-3xl mb-3'
              }`}>
                Encontre prédios para publicidade
              </h1>
              <p className={`text-gray-600 max-w-2xl mx-auto ${
                isMobile ? 'text-sm px-2' : 'text-lg'
              }`}>
                {isMobile ? 'Locais estratégicos para sua campanha' : 'Descubra locais estratégicos para sua campanha publicitária'}
              </p>
            </motion.div>

            {/* Barra de busca otimizada */}
            <motion.form 
              onSubmit={handleSubmit}
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={`relative flex items-stretch ${
                isMobile ? 'flex-col gap-3' : 'flex-row gap-3'
              }`}>
                <div className="flex-1 relative">
                  <MapPin className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-[#3C1361] z-10 ${
                    isMobile ? 'h-4 w-4' : 'h-5 w-5'
                  }`} />
                  <Input
                    type="text"
                    placeholder={isMobile ? "Digite endereço ou bairro..." : "Digite o endereço, bairro ou cidade..."}
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className={`w-full ${isMobile ? 'pl-10 pr-4' : 'pl-12 pr-4'} border-2 border-gray-200 rounded-xl focus:border-[#3C1361] focus:ring-2 focus:ring-[#3C1361]/10 bg-white/90 backdrop-blur-sm transition-all duration-300 shadow-md ${
                      isMobile ? 'py-3 text-base h-12' : 'py-4 text-lg h-14'
                    }`}
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
                  className={`bg-gradient-to-r from-[#3C1361] to-[#4A1B7D] hover:from-[#4A1B7D] hover:to-[#3C1361] text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    isMobile ? 'px-6 py-3 h-12 w-full' : 'px-8 py-4 h-14'
                  }`}
                >
                  {isSearching ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
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
      </motion.div>
    </div>
  );
};

export default BuildingSearchSection;

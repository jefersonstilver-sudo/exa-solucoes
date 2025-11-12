import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { useIsMobile } from '@/hooks/use-mobile';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';
import { shallow } from 'zustand/shallow';
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';
interface BuildingSearchSectionProps {
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: {
    lat: number;
    lng: number;
  } | null;
  isSearching: boolean;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
  filters: BuildingFilters;
  handleFilterChange: (filters: Partial<BuildingFilters>) => void;
  buildingsCount: number;
}
const BuildingSearchSection: React.FC<BuildingSearchSectionProps> = React.memo(({
  searchLocation,
  setSearchLocation,
  selectedLocation,
  isSearching,
  handleSearch,
  handleClearLocation,
  buildingsCount
}) => {
  const isMobile = useIsMobile();
  const { trackSearch } = useBehaviorTracking();
  
  // Estado local para debounce
  const [localSearchValue, setLocalSearchValue] = useState(searchLocation);
  
  // Seletores otimizados do Zustand
  const businessLocation = useBuildingStore(s => s.businessLocation);
  const businessAddress = useBuildingStore(s => s.businessAddress);

  // Sincronizar valor local com prop quando ela muda externamente
  useEffect(() => {
    setLocalSearchValue(searchLocation);
  }, [searchLocation]);

  // Debounce: atualizar store apenas após 300ms sem digitação
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearchValue !== searchLocation) {
        setSearchLocation(localSearchValue);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchValue, searchLocation, setSearchLocation]);
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const valueToSearch = localSearchValue.trim() || searchLocation.trim();
    if (valueToSearch) {
      // Track search event
      trackSearch(valueToSearch, {
        source: 'manual_search',
        hasLocation: !!selectedLocation
      });
      
      // Sincronizar imediatamente antes de buscar
      if (localSearchValue !== searchLocation) {
        setSearchLocation(localSearchValue);
      }
      handleSearch(valueToSearch);
    }
  }, [localSearchValue, searchLocation, setSearchLocation, handleSearch, trackSearch, selectedLocation]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchValue(e.target.value);
  }, []);

  const handleClearLocationLocal = useCallback(() => {
    setLocalSearchValue('');
    handleClearLocation();
  }, [handleClearLocation]);

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback((place: { 
    address: string; 
    coordinates: { lat: number; lng: number }; 
    placeId: string 
  }) => {
    // Track autocomplete selection
    trackSearch(place.address, {
      source: 'autocomplete',
      coordinates: place.coordinates,
      placeId: place.placeId
    });
    
    setLocalSearchValue(place.address);
    setSearchLocation(place.address);
    // Trigger search with the selected coordinates
    handleSearch(place.address);
  }, [setSearchLocation, handleSearch, trackSearch]);
  return <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 building-search-section">
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.6
    }} className="w-full">
        {/* Container principal com espaçamento adequado */}
        <div className={`w-full relative z-20 ${isMobile ? 'px-4 py-3 mt-2' : 'px-6 py-4 mt-3'}`}>
          <div className="w-full mx-auto">
            {/* Layout de duas colunas no desktop, uma coluna no mobile */}
            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
              
              {/* Card de busca - Coluna esquerda (aumentado) */}
              <div className={`${isMobile ? 'col-span-1' : 'col-span-12'}`}>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative z-10 h-full">
                  {/* Container interno com padding adequado */}
                  <div className={`relative ${isMobile ? 'p-4' : 'p-6'}`}>
                    {/* Elementos decorativos apenas em desktop */}
                    {!isMobile && <>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#9C1E1E]/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#58E3AB]/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
                      </>}
                    
                     {/* Header com título principal - SEMPRE VISÍVEL */}
                    <motion.div className={`text-center relative z-30 ${isMobile ? 'mb-4' : 'mb-4'}`} initial={{
                    opacity: 0,
                    y: 10
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} transition={{
                    delay: 0.2
                  }}>
                       <h1 className={`font-bold text-[#9C1E1E] ${isMobile ? 'text-2xl mb-3' : 'text-3xl mb-4'}`}>
                         Encontre prédios para publicidade
                       </h1>
                    </motion.div>

                    {/* Barra de busca com z-index alto */}
                    <motion.form onSubmit={handleSubmit} className="relative z-30" initial={{
                    opacity: 0,
                    y: 10
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} transition={{
                    delay: 0.3
                  }}>
                      <div className={`flex items-stretch gap-3 ${isMobile ? 'flex-col' : 'flex-col'}`}>
                        <div className="flex-1 relative">
                           <AddressAutocomplete
                             value={localSearchValue}
                             onChange={setLocalSearchValue}
                             onPlaceSelect={handlePlaceSelect}
                             onClear={handleClearLocationLocal}
                             placeholder={isMobile ? "Digite o endereço da sua empresa..." : "Digite o endereço da sua empresa ou negócio..."}
                             className={`w-full border-2 border-gray-200 rounded-xl focus:border-[#9C1E1E] focus:ring-2 focus:ring-[#9C1E1E]/10 bg-white transition-all duration-300 shadow-lg ${isMobile ? 'text-base h-12' : 'text-lg h-12'}`}
                           />
                        </div>
                        
                        <Button type="submit" disabled={isSearching || !localSearchValue.trim()} className={`bg-gradient-to-r from-[#9C1E1E] to-[#D72638] hover:from-[#D72638] hover:to-[#9C1E1E] text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${isMobile ? 'px-8 py-3 h-12 w-full' : 'px-10 py-3 h-12 w-full'}`}>
                          {isSearching ? <div className="flex items-center justify-center">
                              <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                              Buscando...
                            </div> : <div className="flex items-center justify-center">
                              <Search className="mr-2 h-5 w-5" />
                              Buscar
                            </div>}
                        </Button>
                      </div>
                    </motion.form>
                  </div>
                </div>
              </div>

              
            </div>
          </div>
        </div>

      </motion.div>
    </div>;
});

export default BuildingSearchSection;
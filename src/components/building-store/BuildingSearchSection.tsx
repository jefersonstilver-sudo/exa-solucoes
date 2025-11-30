import React, { useState, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { useIsMobile } from '@/hooks/use-mobile';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';
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
  return (
    <div className="w-full bg-white building-search-section sticky top-[80px] z-40 border-b border-gray-100 shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          {/* Campo de busca */}
          <div className="flex-1">
            <AddressAutocomplete
              value={localSearchValue}
              onChange={setLocalSearchValue}
              onPlaceSelect={handlePlaceSelect}
              onClear={handleClearLocationLocal}
              placeholder="Digite o endereço da sua empresa..."
              className="w-full h-11 border border-gray-200 rounded-lg focus:border-[#9C1E1E] focus:ring-1 focus:ring-[#9C1E1E] bg-white text-sm"
            />
          </div>
          
          {/* Botão de busca */}
          <Button 
            type="submit" 
            disabled={isSearching || !localSearchValue.trim()} 
            className="h-11 px-6 bg-[#9C1E1E] hover:bg-[#9C1E1E]/90 text-white font-medium rounded-lg transition-colors"
          >
            {isSearching ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                Buscando...
              </div>
            ) : (
              <>
                <Search className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Buscar</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
});

export default BuildingSearchSection;
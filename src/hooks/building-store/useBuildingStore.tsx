
import { useState, useEffect, useCallback } from 'react';
import { BuildingStore, loadBuildingsFromSupabase } from '@/services/buildingStoreService';
import { useBuildingStoreFilters } from './useBuildingStoreFilters';
import { geocodeLocation } from '@/services/geocodingService';

export interface BuildingFilters {
  neighborhood: string;
  venueType: string[];
  priceRange: [number, number];
  audienceMin: number;
  standardProfile: string[];
  amenities: string[];
  sortBy: string;
}

export const useBuildingStore = () => {
  const [allBuildings, setAllBuildings] = useState<BuildingStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Use the filters hook
  const {
    filters,
    filteredBuildings,
    handleFilterChange,
    resetFilters,
    filterStats,
    isDebouncing
  } = useBuildingStoreFilters({
    allBuildings,
    selectedLocation
  });

  // Initialize store data
  const initializeStore = useCallback(async () => {
    console.log('🏗️ [BUILDING STORE] === INICIALIZANDO LOJA ===');
    setIsLoading(true);
    setError(null);
    
    try {
      const buildings = await loadBuildingsFromSupabase();
      console.log('🏗️ [BUILDING STORE] Prédios carregados:', buildings.length);
      
      // Validar dados dos prédios
      const validBuildings = buildings.filter(building => {
        const isValid = building && 
                       building.id && 
                       building.nome && 
                       typeof building.status === 'string';
        
        if (!isValid) {
          console.warn('🏗️ [BUILDING STORE] Prédio inválido encontrado:', building);
        }
        
        return isValid;
      });
      
      console.log('🏗️ [BUILDING STORE] Prédios válidos:', validBuildings.length);
      setAllBuildings(validBuildings);
      
    } catch (err) {
      console.error('🏗️ [BUILDING STORE] Erro ao carregar prédios:', err);
      setError('Falha ao carregar dados dos prédios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle location search
  const handleSearch = useCallback(async (location: string) => {
    if (!location.trim()) return;
    
    console.log('🔍 [BUILDING STORE] Buscando localização:', location);
    setIsSearching(true);
    
    try {
      const result = await geocodeLocation(location);
      if (result) {
        console.log('🔍 [BUILDING STORE] Localização encontrada:', result);
        setSelectedLocation(result);
        setSearchLocation(location);
      } else {
        console.warn('🔍 [BUILDING STORE] Localização não encontrada');
        setError('Localização não encontrada');
      }
    } catch (err) {
      console.error('🔍 [BUILDING STORE] Erro na busca:', err);
      setError('Erro ao buscar localização');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Clear location
  const handleClearLocation = useCallback(() => {
    console.log('🔍 [BUILDING STORE] Limpando localização');
    setSelectedLocation(null);
    setSearchLocation('');
    setError(null);
  }, []);

  return {
    // Data
    buildings: filteredBuildings,
    allBuildings,
    isLoading: isLoading || isDebouncing,
    error,
    
    // Search
    searchLocation,
    setSearchLocation,
    selectedLocation,
    isSearching,
    handleSearch,
    handleClearLocation,
    
    // Filters
    filters,
    handleFilterChange,
    resetFilters,
    filterStats,
    
    // Actions
    initializeStore
  };
};

export default useBuildingStore;

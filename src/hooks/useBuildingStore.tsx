
import { useState, useEffect } from 'react';
import { BuildingStore, fetchBuildingsForStore } from '@/services/buildingStoreService';
import { toast } from 'sonner';

export interface BuildingFilters {
  radius: number;
  venueType: string[];
  standardProfile: string[];
  priceRange: [number, number];
  audienceMin: number;
  amenities: string[];
  neighborhood?: string;
}

const DEFAULT_FILTERS: BuildingFilters = {
  radius: 10000,
  venueType: ['Residencial', 'Comercial', 'Misto'],
  standardProfile: ['alto', 'medio', 'normal'],
  priceRange: [0, 1000],
  audienceMin: 0,
  amenities: [],
  neighborhood: ''
};

export const useBuildingStore = () => {
  const [buildings, setBuildings] = useState<BuildingStore[]>([]);
  const [filteredBuildings, setFilteredBuildings] = useState<BuildingStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [filters, setFilters] = useState<BuildingFilters>(DEFAULT_FILTERS);
  const [searchLocation, setSearchLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Função para buscar prédios
  const fetchBuildings = async (lat?: number, lng?: number, radius?: number) => {
    try {
      console.log('🏢 [useBuildingStore] Iniciando busca de prédios...', { lat, lng, radius });
      setIsSearching(true);
      setError(null);
      
      const data = await fetchBuildingsForStore(lat, lng, radius || filters.radius);
      
      console.log('🏢 [useBuildingStore] Prédios recebidos:', data.length);
      console.log('🏢 [useBuildingStore] Dados dos prédios:', data);
      
      setBuildings(data);
      
      if (data.length === 0) {
        console.warn('⚠️ [useBuildingStore] Nenhum prédio encontrado');
        toast.error('Nenhum prédio encontrado na região');
      } else {
        console.log('✅ [useBuildingStore] Prédios carregados com sucesso');
        toast.success(`${data.length} prédios encontrados`);
      }
    } catch (error) {
      console.error('❌ [useBuildingStore] Erro ao buscar prédios:', error);
      const errorMessage = 'Erro ao carregar prédios';
      setError(errorMessage);
      toast.error(errorMessage);
      setBuildings([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  // Carregamento inicial automático
  useEffect(() => {
    console.log('🔄 [useBuildingStore] Iniciando carregamento automático...');
    fetchBuildings();
  }, []);

  // Filtrar prédios quando os filtros ou dados mudarem
  useEffect(() => {
    console.log('🔍 [useBuildingStore] Aplicando filtros...', { 
      totalBuildings: buildings.length,
      filters 
    });

    if (!buildings.length) {
      setFilteredBuildings([]);
      return;
    }

    const filtered = buildings.filter(building => {
      // Filtro por tipo de local
      if (filters.venueType.length > 0 && !filters.venueType.includes(building.venue_type)) {
        return false;
      }

      // Filtro por padrão do público
      if (filters.standardProfile.length > 0 && !filters.standardProfile.includes(building.padrao_publico)) {
        return false;
      }

      // Filtro por faixa de preço - usar valor padrão se não houver preço
      const preco = building.preco_base || 250; // Valor padrão se não houver preço
      if (preco < filters.priceRange[0] || preco > filters.priceRange[1]) {
        return false;
      }

      // Filtro por público mínimo - usar valor padrão se não houver público
      const publico = building.publico_estimado || 1000; // Valor padrão se não houver público
      if (publico < filters.audienceMin) {
        return false;
      }

      // Filtro por comodidades
      if (filters.amenities.length > 0) {
        const buildingAmenities = building.amenities || [];
        const hasAmenity = filters.amenities.some(amenity => 
          buildingAmenities.includes(amenity)
        );
        if (!hasAmenity) {
          return false;
        }
      }

      return true;
    });

    console.log('✅ [useBuildingStore] Filtros aplicados:', {
      original: buildings.length,
      filtered: filtered.length
    });

    setFilteredBuildings(filtered);
  }, [buildings, filters]);

  // Buscar por localização
  const searchByLocation = async (lat: number, lng: number) => {
    console.log('📍 [useBuildingStore] Buscando por localização:', { lat, lng });
    setSelectedLocation({ lat, lng });
    await fetchBuildings(lat, lng, filters.radius);
  };

  // Handlers para compatibilidade com outras páginas
  const handleFilterChange = (newFilters: Partial<BuildingFilters>) => {
    console.log('🔧 [useBuildingStore] Atualizando filtros:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSearch = async (location: string) => {
    console.log('🔍 [useBuildingStore] Buscando localização:', location);
    setSearchLocation(location);
    // Implementar geocoding se necessário
  };

  const handleClearLocation = () => {
    console.log('🗑️ [useBuildingStore] Limpando localização');
    setSelectedLocation(null);
    setSearchLocation('');
  };

  // Atualizar filtros
  const updateFilters = (newFilters: Partial<BuildingFilters>) => {
    console.log('🔧 [useBuildingStore] Atualizando filtros:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Reset filtros
  const resetFilters = () => {
    console.log('🔄 [useBuildingStore] Resetando filtros');
    setFilters(DEFAULT_FILTERS);
    setSelectedLocation(null);
  };

  return {
    buildings: filteredBuildings,
    isLoading,
    isSearching,
    selectedLocation,
    filters,
    searchLocation,
    setSearchLocation,
    error,
    fetchBuildings,
    searchByLocation,
    updateFilters,
    resetFilters,
    handleFilterChange,
    handleSearch,
    handleClearLocation
  };
};

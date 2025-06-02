
import React, { useState, useMemo, useCallback } from 'react';
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { filterBuildings, sortBuildings } from '@/services/buildingFilterService';

interface UseBuildingStoreFiltersProps {
  allBuildings: BuildingStore[];
  selectedLocation: { lat: number, lng: number } | null;
}

export const useBuildingStoreFilters = ({
  allBuildings,
  selectedLocation
}: UseBuildingStoreFiltersProps) => {
  const [filters, setFilters] = useState<BuildingFilters>({
    neighborhood: '',
    venueType: [],
    priceRange: [0, 10000],
    audienceMin: 0,
    standardProfile: [],
    amenities: [],
    sortBy: 'relevance'
  });

  // Debounce para evitar "piscar" dos filtros
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [filters]);

  // Aplicar filtros com memoização para performance
  const filteredBuildings = useMemo(() => {
    console.log('🔍 [FILTERS] === APLICANDO FILTROS DEBOUNCERS ===');
    console.log('🔍 [FILTERS] Total buildings:', allBuildings.length);
    console.log('🔍 [FILTERS] Filters:', debouncedFilters);

    if (!allBuildings || allBuildings.length === 0) {
      console.log('🔍 [FILTERS] Nenhum prédio disponível para filtrar');
      return [];
    }

    // Primeiro filtrar apenas por status ativo
    const activeBuildings = allBuildings.filter(building => {
      const isActive = building.status === 'ativo';
      if (!isActive) {
        console.log(`🔍 [FILTERS] Prédio ${building.nome} removido - Status: ${building.status}`);
      }
      return isActive;
    });

    console.log('🔍 [FILTERS] Prédios ativos:', activeBuildings.length);

    // Verificar se há filtros aplicados
    const hasActiveFilters = (
      debouncedFilters.neighborhood.trim() !== '' ||
      debouncedFilters.venueType.length > 0 ||
      debouncedFilters.priceRange[0] > 0 || 
      debouncedFilters.priceRange[1] < 10000 ||
      debouncedFilters.audienceMin > 0 ||
      debouncedFilters.standardProfile.length > 0 ||
      debouncedFilters.amenities.length > 0
    );

    if (!hasActiveFilters) {
      console.log('🔍 [FILTERS] Nenhum filtro ativo - retornando todos os prédios ativos');
      return sortBuildings(activeBuildings, debouncedFilters.sortBy, selectedLocation);
    }

    // Aplicar filtros avançados
    const filtered = filterBuildings(activeBuildings, debouncedFilters);
    console.log('🔍 [FILTERS] Após filtros avançados:', filtered.length);

    // Aplicar ordenação
    const sorted = sortBuildings(filtered, debouncedFilters.sortBy, selectedLocation);
    console.log('🔍 [FILTERS] Após ordenação:', sorted.length);

    return sorted;
  }, [allBuildings, debouncedFilters, selectedLocation]);

  // Handle filter changes com validação
  const handleFilterChange = useCallback((newFilters: Partial<BuildingFilters>) => {
    console.log('🔍 [FILTERS] Mudança de filtro:', newFilters);
    
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Validações para evitar estados inválidos
      if (updated.priceRange[0] > updated.priceRange[1]) {
        updated.priceRange = [0, 10000];
      }
      
      if (updated.audienceMin < 0) {
        updated.audienceMin = 0;
      }
      
      return updated;
    });
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    console.log('🔍 [FILTERS] Resetando filtros');
    const defaultFilters: BuildingFilters = {
      neighborhood: '',
      venueType: [],
      priceRange: [0, 10000],
      audienceMin: 0,
      standardProfile: [],
      amenities: [],
      sortBy: 'relevance'
    };
    setFilters(defaultFilters);
  }, []);

  // Get filter stats
  const filterStats = useMemo(() => {
    return {
      totalBuildings: allBuildings.length,
      activeBuildings: allBuildings.filter(b => b.status === 'ativo').length,
      filteredBuildings: filteredBuildings.length,
      hasActiveFilters: (
        debouncedFilters.neighborhood.trim() !== '' ||
        debouncedFilters.venueType.length > 0 ||
        debouncedFilters.priceRange[0] > 0 || 
        debouncedFilters.priceRange[1] < 10000 ||
        debouncedFilters.audienceMin > 0 ||
        debouncedFilters.standardProfile.length > 0 ||
        debouncedFilters.amenities.length > 0
      )
    };
  }, [allBuildings, filteredBuildings, debouncedFilters]);

  return {
    filters,
    filteredBuildings,
    handleFilterChange,
    resetFilters,
    filterStats,
    isDebouncing: JSON.stringify(filters) !== JSON.stringify(debouncedFilters)
  };
};

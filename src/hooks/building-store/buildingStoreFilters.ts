
import { filterBuildings, sortBuildings } from '@/services/buildingFilterService';
import { defaultFilters } from './defaultFilters';
import { calculateDistance, getEffectiveBuildingCoords } from '@/services/distanceCalculation';

export const createFilterActions = (set: any, get: any) => ({
  applyFilters: () => {
    const { allBuildings, filters, disableFilters, selectedLocation, sortOption } = get();
    
    console.log('🔍 [BUILDING STORE] === APLICANDO FILTROS ===');
    console.log('🔍 [BUILDING STORE] Total de prédios disponíveis:', allBuildings.length);
    console.log('🔍 [BUILDING STORE] Filtros desabilitados:', disableFilters);
    
    if (disableFilters || allBuildings.length === 0) {
      const activeBuildings = allBuildings.filter((building: any) => building.status === 'ativo');
      console.log('✅ [BUILDING STORE] Mostrando todos os prédios ativos:', activeBuildings.length);
      set({ buildings: activeBuildings });
      return;
    }

    // Base: apenas prédios ativos
    let result = allBuildings.filter((building: any) => building.status === 'ativo');

    // Aplicar filtro de distância quando houver localização selecionada
    if (selectedLocation && typeof selectedLocation.lat === 'number' && typeof selectedLocation.lng === 'number') {
      const radiusMeters = (filters.radius || 20000);
      result = result.filter((building: any) => {
        const coords = getEffectiveBuildingCoords(building);
        if (!coords) return false;
        const d = calculateDistance(selectedLocation, coords);
        return d <= radiusMeters;
      });
      console.log('📏 [BUILDING STORE] Após filtro de distância (<=', radiusMeters, 'm):', result.length);
    } else {
      console.log('ℹ️ [BUILDING STORE] Sem localização selecionada - filtro de distância não aplicado');
    }

    // Aplicar apenas filtro de Tipo de Prédio
    if (filters.venueType && filters.venueType.length > 0) {
      result = result.filter((building: any) => filters.venueType.includes(building.venue_type));
    }

    console.log('✅ [BUILDING STORE] Prédios após aplicar filtros finais:', result.length);
    
    // Aplicar ordenação
    if (sortOption && sortOption !== 'relevance') {
      result = sortBuildings(result, sortOption, selectedLocation);
      console.log('📊 [BUILDING STORE] Prédios ordenados por:', sortOption);
    }
    
    set({ buildings: result });
  },

  resetFilters: () => {
    console.log('🔄 [BUILDING STORE] === RESETANDO FILTROS ===');
    set({ filters: { ...defaultFilters } });
    get().applyFilters();
  }
});


import { filterBuildings } from '@/services/buildingFilterService';

export const createFilterActions = (set: any, get: any) => ({
  applyFilters: () => {
    const { allBuildings, filters, disableFilters } = get();
    
    console.log('🔍 [BUILDING STORE] === APLICANDO FILTROS ===');
    console.log('🔍 [BUILDING STORE] Total de prédios disponíveis:', allBuildings.length);
    console.log('🔍 [BUILDING STORE] Filtros desabilitados:', disableFilters);
    
    if (disableFilters || allBuildings.length === 0) {
      const activeBuildings = allBuildings.filter((building: any) => building.status === 'ativo');
      console.log('✅ [BUILDING STORE] Mostrando todos os prédios ativos:', activeBuildings.length);
      set({ buildings: activeBuildings });
      return;
    }
    
    const hasActiveFilters = (
      filters.neighborhood.trim() !== '' ||
      filters.venueType.length > 0 ||
      filters.priceRange[0] > 0 || filters.priceRange[1] < 10000 ||
      filters.audienceMin > 0 ||
      filters.standardProfile.length > 0 ||
      filters.amenities.length > 0
    );
    
    if (!hasActiveFilters) {
      console.log('🟢 [BUILDING STORE] Nenhum filtro específico ativo - Mostrando todos os prédios ativos');
      const activeBuildings = allBuildings.filter((building: any) => building.status === 'ativo');
      set({ buildings: activeBuildings });
      return;
    }
    
    const filteredBuildings = filterBuildings(allBuildings, filters);
    console.log('✅ [BUILDING STORE] Prédios após aplicar filtros:', filteredBuildings.length);
    
    set({ buildings: filteredBuildings });
  }
});

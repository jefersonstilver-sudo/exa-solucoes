
import { filterBuildings, sortBuildings } from '@/services/buildingFilterService';
import { defaultFilters } from './defaultFilters';

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
      const deg2rad = (deg: number) => deg * (Math.PI / 180);
      const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const radiusKm = (filters.radius || 20000) / 1000;
      result = result.filter((building: any) => {
        if (typeof building.latitude !== 'number' || typeof building.longitude !== 'number') return false;
        const d = distanceKm(selectedLocation.lat, selectedLocation.lng, building.latitude, building.longitude);
        return d <= radiusKm;
      });
      console.log('📏 [BUILDING STORE] Após filtro de distância (<=', radiusKm, 'km):', result.length);
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

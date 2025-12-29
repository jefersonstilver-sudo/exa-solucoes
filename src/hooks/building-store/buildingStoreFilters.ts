
import { filterBuildings, sortBuildings } from '@/services/buildingFilterService';
import { defaultFilters } from './defaultFilters';
import { calculateDistance, getEffectiveBuildingCoords } from '@/services/distanceCalculation';

export const createFilterActions = (set: any, get: any) => ({
  applyFilters: () => {
    const { allBuildings, filters, disableFilters, selectedLocation, sortOption } = get();
    
    console.log('🔍 [BUILDING STORE] === APLICANDO FILTROS ===');
    console.log('🔍 [BUILDING STORE] Total de prédios disponíveis:', allBuildings.length);
    console.log('🔍 [BUILDING STORE] Filtros desabilitados:', disableFilters);
    console.log('🔍 [BUILDING STORE] Localização selecionada:', selectedLocation);
    console.log('🔍 [BUILDING STORE] Opção de ordenação:', sortOption);
    console.log('🔍 [BUILDING STORE] Configuração dos filtros:', filters);
    
    if (disableFilters || allBuildings.length === 0) {
      const activeStatuses = ['ativo', 'instalação', 'instalacao'];
      const activeBuildings = allBuildings.filter((building: any) =>
        activeStatuses.includes(building.status) &&
        typeof building.imagem_principal === 'string' &&
        building.imagem_principal.trim().length > 0
      );
      console.log('✅ [BUILDING STORE] Filtros desabilitados ou sem prédios - Mostrando todos os prédios elegíveis (status + foto):', activeBuildings.length);
      activeBuildings.forEach((building: any, index: number) => {
        console.log(`🏢 [BUILDING STORE] Prédio sem filtro ${index + 1}: ${building.nome}`);
      });
      set({ buildings: activeBuildings });
      return;
    }

    // Base: only buildings eligible for public store (status + required photo)
    const activeStatuses = ['ativo', 'instalação', 'instalacao'];
    let result = allBuildings.filter((building: any) =>
      activeStatuses.includes(building.status) &&
      typeof building.imagem_principal === 'string' &&
      building.imagem_principal.trim().length > 0
    );
    console.log('🏢 [BUILDING STORE] Eligible filter applied - Buildings:', result.length,
      'Status counts:', allBuildings.reduce((acc: Record<string, number>, b: any) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {}));

    // Aplicar filtro de distância quando houver localização selecionada
    if (selectedLocation && typeof selectedLocation.lat === 'number' && typeof selectedLocation.lng === 'number') {
      const radiusMeters = (filters.radius || 20000);
      console.log('📏 [BUILDING STORE] Aplicando filtro de distância com raio:', radiusMeters, 'm');
      
      const beforeFilter = result.length;
      let withCoords = 0, withoutCoords = 0, withinRadius = 0;
      
      result = result.filter((building: any) => {
        console.log('📏 [BUILDING STORE] Analisando prédio para filtro de distância:', building.nome);
        const coords = getEffectiveBuildingCoords(building);
        if (!coords) {
          withoutCoords++;
          console.log('🏢 [BUILDING STORE] Prédio sem coordenadas, MANTENDO:', building.nome);
          return true; // Keep buildings without coordinates - don't exclude them
        }
        
        withCoords++;
        const d = calculateDistance(selectedLocation, coords);
        const isWithin = d <= radiusMeters;
        if (isWithin) withinRadius++;
        console.log(`📏 [BUILDING STORE] Prédio ${building.nome}: distância ${d}m, dentro do raio: ${isWithin}`);
        return isWithin;
      });
      
      console.log('📏 [BUILDING STORE] Filtro de distância aplicado:');
      console.log(`📏 [BUILDING STORE] - Antes: ${beforeFilter} prédios`);
      console.log(`📏 [BUILDING STORE] - Depois: ${result.length} prédios`);  
      console.log(`📏 [BUILDING STORE] - Com coords: ${withCoords} (${withinRadius} dentro do raio)`);
      console.log(`📏 [BUILDING STORE] - Sem coords: ${withoutCoords} (mantidos)`);
      console.log(`📏 [BUILDING STORE] - Raio: ${radiusMeters}m`);
    } else {
      console.log('ℹ️ [BUILDING STORE] Sem localização selecionada - filtro de distância não aplicado');
    }

    // Aplicar apenas filtro de Tipo de Prédio
    if (filters.venueType && filters.venueType.length > 0) {
      result = result.filter((building: any) => filters.venueType.includes(building.venue_type));
    }

    console.log('✅ [BUILDING STORE] === RESULTADO FINAL DOS FILTROS ===');
    console.log('✅ [BUILDING STORE] Prédios após aplicar filtros:', result.length);
    
    result.forEach((building: any, index: number) => {
      console.log(`🏢 [BUILDING STORE] Prédio final ${index + 1}: ${building.nome}`);
    });
    
    // Aplicar ordenação
    if (sortOption && sortOption !== 'relevance') {
      console.log('📊 [BUILDING STORE] Aplicando ordenação por:', sortOption);
      result = sortBuildings(result, sortOption, selectedLocation);
      console.log('📊 [BUILDING STORE] Prédios ordenados por:', sortOption);
      
      result.forEach((building: any, index: number) => {
        console.log(`🏢 [BUILDING STORE] Prédio ordenado ${index + 1}: ${building.nome}`);
      });
    }
    
    console.log('📊 [BUILDING STORE] === DEFININDO RESULTADO FINAL ===');
    console.log('📊 [BUILDING STORE] Total de prédios no resultado:', result.length);
    set({ buildings: result });
  },

  resetFilters: () => {
    console.log('🔄 [BUILDING STORE] === RESETANDO FILTROS ===');
    set({ filters: { ...defaultFilters } });
    get().applyFilters();
  }
});

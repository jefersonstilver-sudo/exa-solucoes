import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';

export const filterBuildings = (buildings: BuildingStore[], filters: BuildingFilters): BuildingStore[] => {
  console.log('🔍 [FILTER] === INICIANDO FILTROS ===');
  console.log('🔍 [FILTER] Total de prédios para filtrar:', buildings.length);
  console.log('🔍 [FILTER] Configuração dos filtros:', filters);

  let passedBuildings = 0;
  let rejectedBuildings = 0;

  const filteredBuildings = buildings.filter((building, index) => {
    console.log(`\n🏢 [FILTER] Analisando prédio ${index + 1}: ${building.nome}`);

    // FILTRO 1: Status ativo (OBRIGATÓRIO)
    if (building.status !== 'ativo') {
      console.log(`❌ [FILTER] REJEITADO - Status: ${building.status}`);
      rejectedBuildings++;
      return false;
    }
    console.log(`✅ [FILTER] Status ativo - OK`);

    // FILTRO 2: Tipo de venue
    if (filters.venueType.length > 0) {
      if (!filters.venueType.includes(building.venue_type)) {
        console.log(`❌ [FILTER] REJEITADO - Venue type: ${building.venue_type}`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Venue type: ${building.venue_type} - OK`);
    }

    // FILTRO 3: Bairro
    if (filters.neighborhood && filters.neighborhood.trim()) {
      const buildingBairro = building.bairro || '';
      if (!buildingBairro.toLowerCase().includes(filters.neighborhood.toLowerCase())) {
        console.log(`❌ [FILTER] REJEITADO - Bairro: '${buildingBairro}'`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Bairro: ${buildingBairro} - OK`);
    }

    // FILTRO 4: Faixa de preço
    const preco = building.preco_base !== null && building.preco_base !== undefined ? Number(building.preco_base) : 280;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
      if (preco < filters.priceRange[0] || preco > filters.priceRange[1]) {
        console.log(`❌ [FILTER] REJEITADO - Preço: R$ ${preco}`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Preço: R$ ${preco} - OK`);
    }

    // FILTRO 5: Público mínimo (CORREÇÃO CRÍTICA)
    if (filters.audienceMin > 0) {
      const publicoEstimado = building.publico_estimado !== null && building.publico_estimado !== undefined ? Number(building.publico_estimado) : 0;
      
      // CORREÇÃO: Se publico_estimado for 0 e audienceMin for 0, considerar válido
      if (publicoEstimado < filters.audienceMin) {
        console.log(`❌ [FILTER] REJEITADO - Público: ${publicoEstimado} < ${filters.audienceMin}`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Público: ${publicoEstimado} >= ${filters.audienceMin} - OK`);
    } else {
      console.log(`✅ [FILTER] Público mínimo - FILTRO DESABILITADO`);
    }

    // FILTRO 6: Padrão do público
    if (filters.standardProfile.length > 0) {
      const padrao = building.padrao_publico || '';
      if (!filters.standardProfile.includes(padrao)) {
        console.log(`❌ [FILTER] REJEITADO - Padrão: '${padrao}'`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Padrão: ${padrao} - OK`);
    }

    // FILTRO 7: Amenities
    if (filters.amenities.length > 0) {
      const buildingAmenities = building.amenities || [];
      const hasAmenity = filters.amenities.some(amenity => 
        buildingAmenities.includes(amenity)
      );
      if (!hasAmenity) {
        console.log(`❌ [FILTER] REJEITADO - Amenities não encontradas`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Amenities - OK`);
    }

    console.log(`🎉 [FILTER] Prédio ${building.nome} APROVADO!`);
    passedBuildings++;
    return true;
  });

  console.log('\n📊 [FILTER] === RESUMO FINAL ===');
  console.log(`📊 [FILTER] Analisados: ${buildings.length}`);
  console.log(`📊 [FILTER] Aprovados: ${passedBuildings}`);
  console.log(`📊 [FILTER] Rejeitados: ${rejectedBuildings}`);
  
  // CORREÇÃO: Se nenhum prédio passou, retornar todos os ativos como fallback
  if (filteredBuildings.length === 0) {
    console.warn('⚠️ [FILTER] FALLBACK: Nenhum prédio passou nos filtros, retornando todos os ativos');
    const activeBuildings = buildings.filter(building => building.status === 'ativo');
    console.log(`🔄 [FILTER] Fallback aplicado: ${activeBuildings.length} prédios ativos retornados`);
    return activeBuildings;
  }

  return filteredBuildings;
};

export const sortBuildings = (
  buildings: BuildingStore[], 
  sortOption: string, 
  selectedLocation?: { lat: number, lng: number } | null
): BuildingStore[] => {
  console.log('📊 [SORT] Ordenando prédios por:', sortOption, '| Quantidade:', buildings.length);
  
  return [...buildings].sort((a, b) => {
    switch (sortOption) {
      case 'distance':
        if (selectedLocation && 'distance' in a && 'distance' in b) {
          return (a as any).distance - (b as any).distance;
        }
        return 0;
      
      case 'price-asc':
        const priceA = a.preco_base || 280;
        const priceB = b.preco_base || 280;
        return priceA - priceB;
      
      case 'price-desc':
        const priceDescA = a.preco_base || 280;
        const priceDescB = b.preco_base || 280;
        return priceDescB - priceDescA;
      
      case 'audience-desc':
        const audienceA = a.publico_estimado || 0;
        const audienceB = b.publico_estimado || 0;
        return audienceB - audienceA;
      
      case 'views-desc':
        const viewsA = a.visualizacoes_mes || 0;
        const viewsB = b.visualizacoes_mes || 0;
        return viewsB - viewsA;
      
      case 'panels-desc':
        const panelsA = a.quantidade_telas || 0;
        const panelsB = b.quantidade_telas || 0;
        return panelsB - panelsA;
      
      default:
        return 0;
    }
  });
};

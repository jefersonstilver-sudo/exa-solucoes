
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';

export const filterBuildings = (buildings: BuildingStore[], filters: BuildingFilters): BuildingStore[] => {
  console.log('🔍 [FILTER] === AUDIT DETALHADO DOS FILTROS ===');
  console.log('🔍 [FILTER] Total de prédios para filtrar:', buildings.length);
  console.log('🔍 [FILTER] Configuração dos filtros:', {
    venueType: filters.venueType,
    neighborhood: filters.neighborhood,
    priceRange: filters.priceRange,
    audienceMin: filters.audienceMin,
    standardProfile: filters.standardProfile,
    amenities: filters.amenities
  });

  let passedBuildings = 0;
  let rejectedBuildings = 0;

  const filteredBuildings = buildings.filter((building, index) => {
    console.log(`\n🏢 [FILTER] Prédio ${index + 1}/${buildings.length}: ${building.nome}`);
    console.log('🏢 [FILTER] Dados do prédio:', {
      id: building.id,
      status: building.status,
      venue_type: building.venue_type,
      bairro: building.bairro,
      preco_base: building.preco_base,
      publico_estimado: building.publico_estimado,
      padrao_publico: building.padrao_publico,
      amenities: building.amenities
    });

    // FILTRO 1: Status ativo (OBRIGATÓRIO)
    if (building.status !== 'ativo') {
      console.log(`❌ [FILTER] Prédio ${building.nome} REJEITADO - Status: ${building.status} (deve ser 'ativo')`);
      rejectedBuildings++;
      return false;
    }
    console.log(`✅ [FILTER] Status ativo - OK`);

    // FILTRO 2: Tipo de venue
    if (filters.venueType.length > 0) {
      if (!filters.venueType.includes(building.venue_type)) {
        console.log(`❌ [FILTER] Prédio ${building.nome} REJEITADO - Venue type: ${building.venue_type} não está em [${filters.venueType.join(', ')}]`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Venue type: ${building.venue_type} - OK`);
    } else {
      console.log(`✅ [FILTER] Venue type - FILTRO DESABILITADO`);
    }

    // FILTRO 3: Bairro
    if (filters.neighborhood && filters.neighborhood.trim()) {
      const buildingBairro = building.bairro || '';
      if (!buildingBairro.toLowerCase().includes(filters.neighborhood.toLowerCase())) {
        console.log(`❌ [FILTER] Prédio ${building.nome} REJEITADO - Bairro: '${buildingBairro}' não contém '${filters.neighborhood}'`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Bairro: ${buildingBairro} contém '${filters.neighborhood}' - OK`);
    } else {
      console.log(`✅ [FILTER] Bairro - FILTRO DESABILITADO`);
    }

    // FILTRO 4: Faixa de preço (CORREÇÃO CRÍTICA)
    const preco = building.preco_base !== null && building.preco_base !== undefined ? Number(building.preco_base) : 280;
    console.log(`💰 [FILTER] Verificando preço: preco_base=${building.preco_base}, valor_usado=${preco}, range=[${filters.priceRange[0]}, ${filters.priceRange[1]}]`);
    
    // CORREÇÃO: Se o range é muito amplo (padrão), não filtrar por preço
    if (filters.priceRange[0] === 0 && filters.priceRange[1] >= 10000) {
      console.log(`✅ [FILTER] Range de preço muito amplo - FILTRO DESABILITADO`);
    } else if (preco < filters.priceRange[0] || preco > filters.priceRange[1]) {
      console.log(`❌ [FILTER] Prédio ${building.nome} REJEITADO - Preço: R$ ${preco} fora da faixa [R$ ${filters.priceRange[0]} - R$ ${filters.priceRange[1]}]`);
      rejectedBuildings++;
      return false;
    } else {
      console.log(`✅ [FILTER] Preço: R$ ${preco} dentro da faixa - OK`);
    }

    // FILTRO 5: Público mínimo (CORREÇÃO CRÍTICA PARA NULL/UNDEFINED)
    console.log(`👥 [FILTER] Verificando público: audienceMin=${filters.audienceMin}, publico_estimado=${building.publico_estimado}`);
    
    if (filters.audienceMin > 0) {
      // CORREÇÃO: Tratar valores null/undefined como 0
      const publicoEstimado = building.publico_estimado !== null && building.publico_estimado !== undefined ? Number(building.publico_estimado) : 0;
      
      // CORREÇÃO: Se publico_estimado for null/undefined, considerar como válido se audienceMin for 0
      if (building.publico_estimado === null || building.publico_estimado === undefined) {
        console.log(`⚠️ [FILTER] Público estimado é null/undefined - CONSIDERANDO COMO VÁLIDO`);
      } else if (publicoEstimado < filters.audienceMin) {
        console.log(`❌ [FILTER] Prédio ${building.nome} REJEITADO - Público: ${publicoEstimado} menor que mínimo ${filters.audienceMin}`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Público: ${publicoEstimado} >= ${filters.audienceMin} - OK`);
    } else {
      console.log(`✅ [FILTER] Público mínimo - FILTRO DESABILITADO (audienceMin = 0)`);
    }

    // FILTRO 6: Padrão do público
    if (filters.standardProfile.length > 0) {
      const padrao = building.padrao_publico || '';
      if (!filters.standardProfile.includes(padrao)) {
        console.log(`❌ [FILTER] Prédio ${building.nome} REJEITADO - Padrão: '${padrao}' não está em [${filters.standardProfile.join(', ')}]`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Padrão: ${padrao} - OK`);
    } else {
      console.log(`✅ [FILTER] Padrão do público - FILTRO DESABILITADO`);
    }

    // FILTRO 7: Amenities
    if (filters.amenities.length > 0) {
      const buildingAmenities = building.amenities || [];
      const hasAmenity = filters.amenities.some(amenity => 
        buildingAmenities.includes(amenity)
      );
      if (!hasAmenity) {
        console.log(`❌ [FILTER] Prédio ${building.nome} REJEITADO - Amenities: [${buildingAmenities.join(', ')}] não contém nenhum de [${filters.amenities.join(', ')}]`);
        rejectedBuildings++;
        return false;
      }
      console.log(`✅ [FILTER] Amenities: encontrado match - OK`);
    } else {
      console.log(`✅ [FILTER] Amenities - FILTRO DESABILITADO`);
    }

    console.log(`🎉 [FILTER] Prédio ${building.nome} APROVADO em todos os filtros!`);
    passedBuildings++;
    return true;
  });

  console.log('\n📊 [FILTER] === RESUMO FINAL ===');
  console.log(`📊 [FILTER] Prédios analisados: ${buildings.length}`);
  console.log(`📊 [FILTER] Prédios aprovados: ${passedBuildings}`);
  console.log(`📊 [FILTER] Prédios rejeitados: ${rejectedBuildings}`);
  console.log(`📊 [FILTER] Taxa de aprovação: ${buildings.length > 0 ? ((passedBuildings / buildings.length) * 100).toFixed(1) : 0}%`);
  
  if (filteredBuildings.length === 0) {
    console.warn('⚠️ [FILTER] ALERTA: NENHUM PRÉDIO PASSOU NOS FILTROS!');
    console.warn('⚠️ [FILTER] Possíveis causas:');
    console.warn('⚠️ [FILTER] 1. Faixa de preço muito restritiva');
    console.warn('⚠️ [FILTER] 2. Filtro de público mínimo muito alto');
    console.warn('⚠️ [FILTER] 3. Todos os prédios têm status diferente de "ativo"');
    console.warn('⚠️ [FILTER] 4. Combinação de filtros muito específica');
    
    // CORREÇÃO: Sugerir mostrar todos os ativos como fallback
    console.warn('⚠️ [FILTER] FALLBACK: Retornando todos os prédios ativos');
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

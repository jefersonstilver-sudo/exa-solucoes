
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';

export const filterBuildings = (buildings: BuildingStore[], filters: BuildingFilters): BuildingStore[] => {
  return buildings.filter(building => {
    // REGRA PRINCIPAL: Só exibir prédios ativos
    if (building.status !== 'ativo') {
      return false;
    }

    // Filtro por tipo de venue
    if (filters.venueType.length > 0) {
      if (!filters.venueType.includes(building.venue_type)) {
        return false;
      }
    }

    // Filtro por bairro
    if (filters.neighborhood) {
      if (!building.bairro.toLowerCase().includes(filters.neighborhood.toLowerCase())) {
        return false;
      }
    }

    // Filtro por faixa de preço - usar preço base ou valor padrão
    const preco = building.preco_base || 280;
    if (preco < filters.priceRange[0] || preco > filters.priceRange[1]) {
      return false;
    }

    // Filtro por público mínimo - só aplicar se for maior que 0
    if (filters.audienceMin > 0) {
      const publicoEstimado = building.publico_estimado || 0;
      if (publicoEstimado < filters.audienceMin) {
        return false;
      }
    }

    // Filtro por padrão do público
    if (filters.standardProfile.length > 0) {
      if (!filters.standardProfile.includes(building.padrao_publico)) {
        return false;
      }
    }

    // Filtro por amenities
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
};

export const sortBuildings = (
  buildings: BuildingStore[], 
  sortOption: string, 
  selectedLocation?: { lat: number, lng: number } | null
): BuildingStore[] => {
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

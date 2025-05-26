
import { BuildingStore } from '@/services/buildingStoreService';
import { BuildingFilters } from '@/hooks/useBuildingStore';

export const filterBuildings = (buildings: BuildingStore[], filters: BuildingFilters): BuildingStore[] => {
  return buildings.filter(building => {
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

    // Filtro por faixa de preço
    const preco = building.preco_base || 280;
    if (preco < filters.priceRange[0] || preco > filters.priceRange[1]) {
      return false;
    }

    // Filtro por público mínimo estimado
    if (filters.audienceMin > 0) {
      if (building.publico_estimado < filters.audienceMin) {
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
        return (a.preco_base || 280) - (b.preco_base || 280);
      
      case 'price-desc':
        return (b.preco_base || 280) - (a.preco_base || 280);
      
      case 'audience-desc':
        return (b.publico_estimado || 0) - (a.publico_estimado || 0);
      
      case 'views-desc':
        return (b.visualizacoes_mes || 0) - (a.visualizacoes_mes || 0);
      
      case 'panels-desc':
        return (b.quantidade_telas || 0) - (a.quantidade_telas || 0);
      
      default:
        return 0;
    }
  });
};

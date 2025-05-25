
import { Building, buildImageUrlsArray } from './buildingsDataService';

export const processBuildingsData = (buildingsData: any[], panelsData: any[]): Building[] => {
  // Criar mapa de contagem de painéis por prédio
  const panelCountMap = new Map();
  if (panelsData) {
    panelsData.forEach(panel => {
      const buildingId = panel.building_id;
      if (buildingId) {
        panelCountMap.set(buildingId, (panelCountMap.get(buildingId) || 0) + 1);
      }
    });
  }
  
  // Processar dados dos prédios com validação robusta
  const typedBuildings = (buildingsData || [])
    .filter(building => building && building.id && building.nome) // Filtrar dados inválidos
    .map(building => {
      const panelCount = panelCountMap.get(building.id) || 0;
      
      return {
        ...building,
        // GARANTIR RESIDENCIAL COMO PADRÃO se venue_type não estiver definido ou for inválido
        venue_type: (building.venue_type === 'Residencial' || building.venue_type === 'Comercial') 
          ? building.venue_type 
          : 'Residencial',
        location_type: building.location_type || 'residential',
        padrao_publico: (building.padrao_publico as 'alto' | 'medio' | 'normal') || 'normal',
        image_urls: building.image_urls || buildImageUrlsArray(building),
        amenities: building.amenities || building.caracteristicas || [],
        caracteristicas: building.caracteristicas || building.amenities || [],
        numero_unidades: building.numero_unidades || 0,
        publico_estimado: building.publico_estimado || (building.numero_unidades * 3) || 0,
        preco_base: building.preco_base || 0,
        quantidade_telas: panelCount,
        visualizacoes_mes: panelCount * 7350 || 0,
        monthly_traffic: building.monthly_traffic || 0,
        latitude: building.latitude || 0,
        longitude: building.longitude || 0
      };
    });
  
  console.log('📊 [BUILDINGS PROCESSOR] Prédios processados:', typedBuildings.length);
  return typedBuildings;
};

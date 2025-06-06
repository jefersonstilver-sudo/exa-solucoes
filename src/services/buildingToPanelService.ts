
import { Panel } from '@/types/panel';
import { BuildingStore } from '@/services/buildingStoreService';

export const convertBuildingToPanel = (building: BuildingStore): Panel => {
  console.log('🔄 [BuildingToPanel] Convertendo:', building.id, building.nome);
  
  const panel: Panel = {
    id: building.id,
    code: `panel_${building.id}`,
    building_id: building.id,
    status: 'online',
    buildings: {
      id: building.id,
      nome: building.nome,
      endereco: building.endereco || '',
      bairro: building.bairro,
      cidade: building.cidade || '',
      estado: building.estado || '',
      cep: '', // Valor padrão para campo obrigatório
      latitude: building.latitude,
      longitude: building.longitude,
      venue_type: building.venue_type,
      caracteristicas: building.caracteristicas || [],
      preco_base: building.preco_base || 280,
      quantidade_telas: building.quantidade_telas || 1,
      imagens: building.imagens || []
    }
  };
  
  console.log('🔄 [BuildingToPanel] Convertido para panel:', panel.id);
  return panel;
};

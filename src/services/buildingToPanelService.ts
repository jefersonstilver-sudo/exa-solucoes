
import { Panel } from '@/types/panel';
import { BuildingStore } from '@/services/buildingStoreService';

export const convertBuildingToPanel = (building: BuildingStore): Panel => {
  console.log('🔄 [BuildingToPanel] Convertendo:', building.id, building.nome);
  
  const panel: Panel = {
    id: building.id,
    building_id: building.id,
    posicao: 'centro',
    largura: 1920,
    altura: 1080,
    status: 'online',
    buildings: {
      id: building.id,
      nome: building.nome,
      endereco: building.endereco || '',
      cidade: building.cidade || '',
      estado: building.estado || '',
      caracteristicas: building.caracteristicas || [],
      preco_base: building.preco_base || 280,
      quantidade_telas: building.quantidade_telas || 1,
      imagens: building.imagens || []
    }
  };
  
  console.log('🔄 [BuildingToPanel] Convertido para panel:', panel.id);
  return panel;
};

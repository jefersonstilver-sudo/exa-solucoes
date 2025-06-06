
import { Panel } from '@/types/panel';
import { BuildingStore } from '@/services/buildingStoreService';

export const convertBuildingToPanel = (building: BuildingStore): Panel => {
  console.log('🔄 [BuildingToPanel] === CONVERTENDO BUILDING ===');
  console.log('🔄 [BuildingToPanel] Input building:', {
    id: building.id,
    nome: building.nome,
    endereco: building.endereco,
    preco_base: building.preco_base
  });
  
  // Validate input
  if (!building) {
    throw new Error('Building é null ou undefined');
  }
  
  if (!building.id) {
    throw new Error('Building.id é obrigatório');
  }
  
  if (!building.nome) {
    console.warn('⚠️ [BuildingToPanel] Building.nome está vazio');
  }
  
  // Create panel with validation
  const panel: Panel = {
    id: building.id,
    code: `panel_${building.id}`,
    building_id: building.id,
    status: 'online',
    buildings: {
      id: building.id,
      nome: building.nome || `Prédio ${building.id}`,
      endereco: building.endereco || '',
      bairro: building.bairro || '',
      cidade: building.cidade || building.bairro || 'Cidade não informada',
      estado: building.estado || '',
      cep: '', // Valor padrão para campo obrigatório
      latitude: building.latitude,
      longitude: building.longitude,
      venue_type: building.venue_type || 'comercial',
      caracteristicas: building.caracteristicas || [],
      preco_base: building.preco_base || 280,
      quantidade_telas: building.quantidade_telas || 1,
      imagens: building.imagens || []
    }
  };
  
  console.log('🔄 [BuildingToPanel] Panel criado:', {
    id: panel.id,
    code: panel.code,
    building_id: panel.building_id,
    buildings_id: panel.buildings.id,
    buildings_nome: panel.buildings.nome
  });
  
  // Validate output
  if (!panel.id || !panel.buildings || !panel.buildings.id) {
    console.error('❌ [BuildingToPanel] Panel inválido criado:', panel);
    throw new Error('Falha na conversão: Panel inválido');
  }
  
  console.log('✅ [BuildingToPanel] Conversão bem-sucedida');
  return panel;
};

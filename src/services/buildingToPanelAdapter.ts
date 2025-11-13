// Adaptador temporário: converte Building para o formato compatível com o sistema atual
// Mantém compatibilidade enquanto gradualmente movemos para usar Building diretamente

import { BuildingStore } from './buildingStoreService';
import { Panel } from '@/types/panel';

export const adaptBuildingToPanel = (building: BuildingStore): Panel => {
  console.log('🔄 [ADAPTER] Adaptando Building para Panel:', building.nome);
  
  return {
    id: building.id, // IMPORTANTE: Usar o ID do prédio
    code: building.id, // Usar ID como código temporário
    buildings: {
      id: building.id,
      nome: building.nome,
      endereco: building.endereco,
      cidade: building.cidade,
      estado: building.estado,
      bairro: building.bairro,
      cep: '', // Campo não disponível em BuildingStore
      status: building.status,
      preco_base: building.preco_base,
      publico_estimado: building.publico_estimado,
      visualizacoes_mes: building.visualizacoes_mes,
      quantidade_telas: building.quantidade_telas,
      numero_elevadores: building.numero_elevadores,
      imagens: building.imagens,
      caracteristicas: building.caracteristicas,
      venue_type: building.venue_type,
      latitude: building.latitude,
      longitude: building.longitude
    }
  } as Panel;
};

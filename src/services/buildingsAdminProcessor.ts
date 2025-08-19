import { AdminBuilding } from './buildingsAdminService';

export const processAdminBuildingsData = (buildingsData: any[]): AdminBuilding[] => {
  console.log('🔄 [ADMIN BUILDINGS PROCESSOR] Processando dados dos prédios para administração...');
  
  if (!buildingsData || !Array.isArray(buildingsData)) {
    console.warn('⚠️ [ADMIN BUILDINGS PROCESSOR] Dados de prédios inválidos ou vazios');
    return [];
  }

  const processedBuildings = buildingsData
    .filter((building: any) => {
      if (!building || typeof building !== 'object') {
        console.warn('⚠️ [ADMIN BUILDINGS PROCESSOR] Prédio inválido encontrado:', building);
        return false;
      }
      return true;
    })
    .map((building: any): AdminBuilding => {
      return {
        id: building.id || '',
        nome: building.nome || 'Nome não definido',
        endereco: building.endereco || 'Endereço não definido',
        bairro: building.bairro || 'Bairro não definido',
        status: building.status || 'inativo',
        venue_type: building.venue_type || 'Residencial',
        monthly_traffic: building.monthly_traffic || 0,
        latitude: building.latitude || 0,
        longitude: building.longitude || 0,
        numero_unidades: building.numero_unidades || 0,
        publico_estimado: building.publico_estimado || 0,
        preco_base: building.preco_base || 0,
        image_urls: Array.isArray(building.image_urls) ? building.image_urls : [],
        amenities: Array.isArray(building.amenities) ? building.amenities : [],
        padrao_publico: building.padrao_publico || 'normal',
        quantidade_telas: building.quantidade_telas || 0,
        visualizacoes_mes: building.visualizacoes_mes || 0,
        imagem_principal: building.imagem_principal || '',
        imagem_2: building.imagem_2 || '',
        imagem_3: building.imagem_3 || '',
        imagem_4: building.imagem_4 || '',
        caracteristicas: Array.isArray(building.caracteristicas) ? building.caracteristicas : [],
        created_at: building.created_at || new Date().toISOString(),
        nome_sindico: building.nome_sindico || '',
        contato_sindico: building.contato_sindico || '',
        nome_vice_sindico: building.nome_vice_sindico || '',
        contato_vice_sindico: building.contato_vice_sindico || '',
        nome_contato_predio: building.nome_contato_predio || '',
        numero_contato_predio: building.numero_contato_predio || '',
        paineis_ativos: building.paineis_ativos || 0,
        vendas_mes_atual: building.vendas_mes_atual || 0
      };
    });

  console.log('✅ [ADMIN BUILDINGS PROCESSOR] Processamento concluído:', {
    total: processedBuildings.length,
    comPaineisAtivos: processedBuildings.filter(b => b.paineis_ativos > 0).length,
    comVendasMes: processedBuildings.filter(b => b.vendas_mes_atual > 0).length
  });

  return processedBuildings;
};
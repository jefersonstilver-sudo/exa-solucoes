
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BuildingDetails {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  imageurl?: string;
  imagem_principal?: string;
  imagem_2?: string;
  imagem_3?: string;
  imagem_4?: string;
  publico_estimado?: number;
  numero_unidades?: number;
  quantidade_telas?: number;
  numero_elevadores?: number;
  caracteristicas?: string[];
  latitude?: number;
  longitude?: number;
}

export const useSelectedBuildingsDetails = (listaPredios: string[] = []) => {
  const [buildings, setBuildings] = useState<BuildingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildingsDetails = async () => {
      if (!listaPredios || listaPredios.length === 0) {
        console.log('🏢 [BUILDINGS_DETAILS] Lista de prédios vazia ou não fornecida');
        setBuildings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🏢 [BUILDINGS_DETAILS] Iniciando busca de detalhes dos prédios:');
        console.log('   - Lista de IDs:', listaPredios);
        console.log('   - Quantidade:', listaPredios.length);

        // Use secure function that requires authentication
        const { data: publicBuildings, error: buildingsError } = await supabase
          .rpc('get_buildings_for_authenticated_users');

        if (buildingsError) {
          console.error('❌ [BUILDINGS_DETAILS] Erro ao buscar prédios públicos:', buildingsError);
          throw buildingsError;
        }

        console.log('✅ [BUILDINGS_DETAILS] Dados públicos retornados:', publicBuildings);

        // Filtrar apenas os prédios solicitados
        const buildingsData = publicBuildings?.filter(building => 
          listaPredios.includes(building.id)
        ) || [];

        console.log('✅ [BUILDINGS_DETAILS] Dados retornados do Supabase:');
        console.log('   - Quantidade encontrada:', buildingsData?.length || 0);
        console.log('   - Dados:', buildingsData);

        if (!buildingsData || buildingsData.length === 0) {
          console.warn('⚠️ [BUILDINGS_DETAILS] Nenhum prédio encontrado para os IDs fornecidos');
          console.log('   - IDs solicitados:', listaPredios);
          console.log('   - Total de prédios públicos encontrados:', publicBuildings?.length || 0);
        }

        // Adaptar dados para incluir endereco obrigatório
        const adaptedBuildings = buildingsData.map(building => ({
          ...building,
          endereco: building.nome, // Usar nome como endereço temporariamente
        }));

        setBuildings(adaptedBuildings);

      } catch (error) {
        console.error('💥 [BUILDINGS_DETAILS] Erro geral:', error);
        setError(`Erro ao carregar detalhes dos prédios: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        setBuildings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingsDetails();
  }, [JSON.stringify(listaPredios)]); // Use JSON.stringify para comparação correta de arrays

  return { buildings, loading, error };
};

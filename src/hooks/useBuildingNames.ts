
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BuildingInfo {
  id: string;
  nome: string;
}

export const useBuildingNames = (listaPaineis: string[], listaPredios?: string[]) => {
  const [buildingNames, setBuildingNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildingNames = async () => {
      console.log('🔍 [BUILDING_NAMES] Iniciando busca - painéis:', listaPaineis, 'prédios:', listaPredios);
      
      // Priorizar lista_predios se disponível
      if (listaPredios && listaPredios.length > 0) {
        console.log('📍 [BUILDING_NAMES] Usando lista_predios (nova coluna)');
        
        try {
          setLoading(true);
          setError(null);

          const { data: buildings, error: buildingsError } = await supabase
            .from('buildings')
            .select('id, nome')
            .in('id', listaPredios);

          if (buildingsError) {
            console.error('❌ [BUILDING_NAMES] Erro ao buscar prédios:', buildingsError);
            throw buildingsError;
          }

          console.log('🏢 [BUILDING_NAMES] Prédios encontrados via lista_predios:', buildings);

          const names = buildings?.map(b => b.nome) || ['Nomes dos prédios não encontrados'];
          console.log('📝 [BUILDING_NAMES] Nomes finais dos prédios:', names);
          
          setBuildingNames(names);
          setLoading(false);
          return;
        } catch (error) {
          console.error('💥 [BUILDING_NAMES] Erro ao buscar via lista_predios:', error);
          // Continuar com fallback para lista_paineis
        }
      }

      // Fallback para lista_paineis (método antigo)
      if (!listaPaineis || listaPaineis.length === 0) {
        console.log('⚠️ [BUILDING_NAMES] Nenhuma lista disponível, retornando estado vazio');
        setBuildingNames([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('📡 [BUILDING_NAMES] Fallback: buscando painéis pelos IDs:', listaPaineis);

        // Buscar painéis pelos IDs
        const { data: painels, error: painelsError } = await supabase
          .from('painels')
          .select('building_id')
          .in('id', listaPaineis);

        if (painelsError) {
          console.error('❌ [BUILDING_NAMES] Erro ao buscar painéis:', painelsError);
          throw painelsError;
        }

        console.log('✅ [BUILDING_NAMES] Painéis encontrados:', painels);

        if (!painels || painels.length === 0) {
          console.log('⚠️ [BUILDING_NAMES] Nenhum painel encontrado no banco');
          setBuildingNames(['Painéis não encontrados no sistema']);
          setLoading(false);
          return;
        }

        // Extrair building_ids únicos
        const buildingIds = [...new Set(painels.map(p => p.building_id).filter(Boolean))];
        console.log('🏢 [BUILDING_NAMES] IDs dos prédios únicos:', buildingIds);

        if (buildingIds.length === 0) {
          console.log('⚠️ [BUILDING_NAMES] Nenhum prédio vinculado aos painéis');
          setBuildingNames(['Prédios não vinculados aos painéis']);
          setLoading(false);
          return;
        }

        // Buscar nomes dos prédios
        const { data: buildings, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, nome')
          .in('id', buildingIds);

        if (buildingsError) {
          console.error('❌ [BUILDING_NAMES] Erro ao buscar prédios:', buildingsError);
          throw buildingsError;
        }

        console.log('🏢 [BUILDING_NAMES] Prédios encontrados:', buildings);

        const names = buildings?.map(b => b.nome) || ['Nomes dos prédios não encontrados'];
        console.log('📝 [BUILDING_NAMES] Nomes finais dos prédios:', names);
        
        setBuildingNames(names);

      } catch (error) {
        console.error('💥 [BUILDING_NAMES] Erro geral ao buscar nomes dos prédios:', error);
        setError('Erro ao carregar informações dos locais');
        setBuildingNames(['Erro ao carregar locais']);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingNames();
  }, [listaPaineis, listaPredios]);

  return { buildingNames, loading, error };
};

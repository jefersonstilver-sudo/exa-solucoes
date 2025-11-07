import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBuildingNames = (listaPaineis: string[], listaPredios?: string[]) => {
  const [buildingNames, setBuildingNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildingNames = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🏢 [useBuildingNames] Iniciando busca:', {
          listaPredios,
          listaPaineis
        });

        // Prioriza lista_predios se disponível
        if (listaPredios && listaPredios.length > 0) {
          console.log('🏢 [useBuildingNames] Buscando por lista_predios');
          
          const { data, error: prediosError } = await supabase
            .from('buildings')
            .select('nome')
            .in('id', listaPredios)
            .order('nome');

          if (prediosError) {
            console.error('❌ [useBuildingNames] Erro na query buildings:', prediosError);
            throw prediosError;
          }

          const names = data?.map(b => b.nome) || [];
          console.log('✅ [useBuildingNames] Prédios encontrados:', names);
          setBuildingNames(names);
          
        } else if (listaPaineis && listaPaineis.length > 0) {
          console.log('🏢 [useBuildingNames] Buscando por lista_paineis (fallback)');
          
          // Fallback para painéis
          const { data, error: paineisError } = await supabase
            .from('painels')
            .select('building_id')
            .in('id', listaPaineis);

          if (paineisError) {
            console.error('❌ [useBuildingNames] Erro na query painels:', paineisError);
            throw paineisError;
          }

          const buildingIds = data?.map(p => p.building_id).filter(Boolean) || [];
          console.log('🏢 [useBuildingNames] Building IDs dos painéis:', buildingIds);

          if (buildingIds.length > 0) {
            const { data: buildings, error: buildingsError } = await supabase
              .from('buildings')
              .select('nome')
              .in('id', buildingIds)
              .order('nome');

            if (buildingsError) {
              console.error('❌ [useBuildingNames] Erro na query buildings:', buildingsError);
              throw buildingsError;
            }

            const names = buildings?.map(b => b.nome) || [];
            console.log('✅ [useBuildingNames] Prédios encontrados:', names);
            setBuildingNames(names);
          } else {
            console.log('⚠️ [useBuildingNames] Nenhum building_id encontrado nos painéis');
            setBuildingNames([]);
          }
        } else {
          console.log('⚠️ [useBuildingNames] Sem dados de painéis ou prédios');
          setBuildingNames([]);
        }
      } catch (err: any) {
        console.error('❌ [useBuildingNames] Erro ao buscar nomes dos prédios:', err);
        setError(err?.message || 'Erro ao carregar locais');
        setBuildingNames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingNames();
  }, [JSON.stringify(listaPaineis), JSON.stringify(listaPredios)]);

  return { buildingNames, loading, error };
};

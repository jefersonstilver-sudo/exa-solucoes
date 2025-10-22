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

        // Prioriza lista_predios se disponível
        if (listaPredios && listaPredios.length > 0) {
          const { data, error: prediosError } = await supabase
            .from('buildings')
            .select('nome')
            .in('id', listaPredios)
            .order('nome');

          if (prediosError) throw prediosError;

          const names = data?.map(b => b.nome) || [];
          setBuildingNames(names);
        } else if (listaPaineis && listaPaineis.length > 0) {
          // Fallback para painéis
          const { data, error: paineisError } = await supabase
            .from('painels')
            .select('building_id')
            .in('id', listaPaineis);

          if (paineisError) throw paineisError;

          const buildingIds = data?.map(p => p.building_id).filter(Boolean) || [];

          if (buildingIds.length > 0) {
            const { data: buildings, error: buildingsError } = await supabase
              .from('buildings')
              .select('nome')
              .in('id', buildingIds)
              .order('nome');

            if (buildingsError) throw buildingsError;

            const names = buildings?.map(b => b.nome) || [];
            setBuildingNames(names);
          } else {
            setBuildingNames([]);
          }
        } else {
          setBuildingNames([]);
        }
      } catch (err) {
        console.error('Erro ao buscar nomes dos prédios:', err);
        setError('Erro ao carregar locais');
        setBuildingNames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingNames();
  }, [listaPaineis, listaPredios]);

  return { buildingNames, loading, error };
};

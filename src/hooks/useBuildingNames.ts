
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BuildingInfo {
  id: string;
  nome: string;
}

export const useBuildingNames = (listaPaineis: string[]) => {
  const [buildingNames, setBuildingNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildingNames = async () => {
      if (!listaPaineis || listaPaineis.length === 0) {
        setBuildingNames([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar painéis pelos IDs
        const { data: painels, error: painelsError } = await supabase
          .from('painels')
          .select('building_id')
          .in('id', listaPaineis);

        if (painelsError) throw painelsError;

        if (!painels || painels.length === 0) {
          setBuildingNames(['Painéis não encontrados']);
          setLoading(false);
          return;
        }

        // Extrair building_ids únicos
        const buildingIds = [...new Set(painels.map(p => p.building_id).filter(Boolean))];

        if (buildingIds.length === 0) {
          setBuildingNames(['Prédios não vinculados']);
          setLoading(false);
          return;
        }

        // Buscar nomes dos prédios
        const { data: buildings, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, nome')
          .in('id', buildingIds);

        if (buildingsError) throw buildingsError;

        const names = buildings?.map(b => b.nome) || ['Prédios não encontrados'];
        setBuildingNames(names);

      } catch (error) {
        console.error('Erro ao buscar nomes dos prédios:', error);
        setError('Erro ao carregar informações');
        setBuildingNames(['Erro ao carregar']);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingNames();
  }, [listaPaineis]);

  return { buildingNames, loading, error };
};

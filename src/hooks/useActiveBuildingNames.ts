import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useActiveBuildingNames = () => {
  const [buildingNames, setBuildingNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuildingNames = async () => {
      try {
        const { data, error } = await supabase
          .from('buildings')
          .select('nome')
          .eq('status', 'ativo')
          .order('nome');

        if (error) throw error;

        const names = data?.map(b => b.nome) || [];
        setBuildingNames(names);
      } catch (error) {
        console.error('Erro ao buscar nomes dos prédios:', error);
        setBuildingNames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingNames();
  }, []);

  return { buildingNames, loading };
};

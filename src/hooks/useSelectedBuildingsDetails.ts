
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BuildingDetails {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  imageurl?: string;
  publico_estimado?: number;
  numero_unidades?: number;
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
        setBuildings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🏢 [BUILDINGS_DETAILS] Buscando detalhes dos prédios:', listaPredios);

        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, nome, endereco, bairro, imageurl, publico_estimado, numero_unidades, caracteristicas, latitude, longitude')
          .in('id', listaPredios);

        if (buildingsError) {
          console.error('❌ [BUILDINGS_DETAILS] Erro ao buscar prédios:', buildingsError);
          throw buildingsError;
        }

        console.log('✅ [BUILDINGS_DETAILS] Prédios encontrados:', buildingsData);
        setBuildings(buildingsData || []);

      } catch (error) {
        console.error('💥 [BUILDINGS_DETAILS] Erro geral:', error);
        setError('Erro ao carregar detalhes dos prédios');
        setBuildings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingsDetails();
  }, [listaPredios]);

  return { buildings, loading, error };
};

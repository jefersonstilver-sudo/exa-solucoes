
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building, 
  fetchBuildingsData 
} from '@/services/buildingsDataService';
import { processBuildingsData } from '@/services/buildingsProcessor';
import { BuildingStats, calculateBuildingStats } from '@/services/buildingsStatsService';
import { 
  updateBuildingInDatabase, 
  deleteBuildingFromDatabase 
} from '@/services/buildingsOperationsService';

export const useBuildingsData = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BuildingStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalPanels: 0
  });

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      
      const { buildings: buildingsData, panels: panelsData } = await fetchBuildingsData();
      const processedBuildings = processBuildingsData(buildingsData, panelsData);
      
      setBuildings(processedBuildings);
      setStats(calculateBuildingStats(processedBuildings));
      
    } catch (error: any) {
      console.error('💥 [BUILDINGS DATA] Erro ao buscar prédios:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBuilding = async (id: string, updates: Partial<Building>) => {
    await updateBuildingInDatabase(id, updates);
    fetchBuildings();
  };

  const deleteBuilding = async (id: string) => {
    await deleteBuildingFromDatabase(id);
    fetchBuildings();
  };

  useEffect(() => {
    fetchBuildings();

    const channel = supabase
      .channel('buildings-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'buildings' 
        }, 
        (payload) => {
          console.log('🏢 Mudança nos prédios detectada:', payload);
          fetchBuildings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    buildings, 
    stats, 
    loading, 
    refetch: fetchBuildings, 
    updateBuilding,
    deleteBuilding 
  };
};

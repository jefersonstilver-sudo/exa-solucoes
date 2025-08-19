
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  AdminBuilding, 
  fetchAllBuildingsForAdmin 
} from '@/services/buildingsAdminService';
import { processAdminBuildingsData } from '@/services/buildingsAdminProcessor';
import { BuildingStats, calculateBuildingStats } from '@/services/buildingsStatsService';
import { 
  updateBuildingInDatabase, 
  deleteBuildingFromDatabase 
} from '@/services/buildingsOperationsService';

export const useAdminBuildingsData = () => {
  const [buildings, setBuildings] = useState<AdminBuilding[]>([]);
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
      
      console.log('🏢 [ADMIN BUILDINGS HOOK] Buscando todos os prédios para administração...');
      
      const { buildings: buildingsData, panels: panelsData } = await fetchAllBuildingsForAdmin();
      const processedBuildings = processAdminBuildingsData(buildingsData);
      
      setBuildings(processedBuildings);
      
      // Calcular estatísticas específicas para admin (incluindo inativos)
      const adminStats = {
        total: processedBuildings.length,
        active: processedBuildings.filter(b => b.status === 'ativo').length,
        inactive: processedBuildings.filter(b => b.status === 'inativo').length,
        totalPanels: processedBuildings.reduce((acc, building) => acc + (building.quantidade_telas || 0), 0)
      };
      
      setStats(adminStats);
      
      console.log('✅ [ADMIN BUILDINGS HOOK] Estatísticas calculadas:', adminStats);
      
    } catch (error: any) {
      console.error('💥 [ADMIN BUILDINGS HOOK] Erro ao buscar prédios:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBuilding = async (id: string, updates: Partial<AdminBuilding>) => {
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
      .channel('admin-buildings-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'buildings' 
        }, 
        (payload) => {
          console.log('🏢 [ADMIN] Mudança nos prédios detectada:', payload);
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

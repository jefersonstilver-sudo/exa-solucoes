
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  status: string;
  venue_type: string;
  location_type: string;
  monthly_traffic: number;
  latitude: number;
  longitude: number;
  numero_unidades: number;
  publico_estimado: number;
  preco_base: number;
  image_urls: string[];
  amenities: string[];
  padrao_publico: 'alto' | 'medio' | 'normal';
  quantidade_telas: number;
  created_at: string;
}

interface BuildingStats {
  total: number;
  active: number;
  inactive: number;
  totalTraffic: number;
  totalUnits: number;
  averagePrice: number;
}

export const useBuildingsData = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BuildingStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalTraffic: 0,
    totalUnits: 0,
    averagePrice: 0
  });

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      console.log('🏢 Buscando prédios com novos campos...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        toast.error('Erro de autenticação. Faça login novamente.');
        return;
      }

      if (!user) {
        console.error('❌ Usuário não autenticado');
        toast.error('Acesso negado. Faça login como administrador.');
        return;
      }

      const { data, error } = await supabase
        .from('buildings')
        .select(`
          id,
          nome,
          endereco,
          bairro,
          status,
          venue_type,
          location_type,
          monthly_traffic,
          latitude,
          longitude,
          numero_unidades,
          publico_estimado,
          preco_base,
          image_urls,
          amenities,
          padrao_publico,
          quantidade_telas,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar prédios:', error);
        toast.error(`Erro ao carregar prédios: ${error.message}`);
        return;
      }

      console.log('✅ Prédios carregados:', data?.length);
      setBuildings(data || []);
      
      // Calcular estatísticas
      const buildingsList = data || [];
      const total = buildingsList.length;
      const active = buildingsList.filter(b => b.status === 'ativo').length;
      const inactive = buildingsList.filter(b => b.status === 'inativo').length;
      const totalTraffic = buildingsList.reduce((sum, building) => 
        sum + (building.monthly_traffic || 0), 0
      );
      const totalUnits = buildingsList.reduce((sum, building) => 
        sum + (building.numero_unidades || 0), 0
      );
      const averagePrice = buildingsList.length > 0 
        ? buildingsList.reduce((sum, building) => sum + (building.preco_base || 0), 0) / buildingsList.length
        : 0;

      setStats({ total, active, inactive, totalTraffic, totalUnits, averagePrice });
      
    } catch (error) {
      console.error('💥 Erro crítico ao carregar prédios:', error);
      toast.error('Erro crítico. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const updateBuilding = async (id: string, updates: Partial<Building>) => {
    try {
      const { error } = await supabase
        .from('buildings')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Log da ação
      await supabase.rpc('log_building_action', {
        p_building_id: id,
        p_action_type: 'update',
        p_description: 'Prédio atualizado',
        p_new_values: updates
      });

      toast.success('Prédio atualizado com sucesso!');
      fetchBuildings();
    } catch (error) {
      console.error('Erro ao atualizar prédio:', error);
      toast.error('Erro ao atualizar prédio');
    }
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

  return { buildings, stats, loading, refetch: fetchBuildings, updateBuilding };
};

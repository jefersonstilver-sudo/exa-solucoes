
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
  visualizacoes_mes: number;
  imagem_principal: string;
  imagem_2: string;
  imagem_3: string;
  imagem_4: string;
  caracteristicas: string[];
  created_at: string;
}

interface BuildingStats {
  total: number;
  active: number;
  inactive: number;
  totalTraffic: number;
  totalUnits: number;
  totalPublic: number;
  averagePrice: number;
  totalScreens: number;
  totalViews: number;
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
    totalPublic: 0,
    averagePrice: 0,
    totalScreens: 0,
    totalViews: 0
  });

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      console.log('🏢 Buscando prédios com contagem real de painéis...');
      
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

      // Query com JOIN para obter contagem real de painéis
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
          imagem_principal,
          imagem_2,
          imagem_3,
          imagem_4,
          caracteristicas,
          created_at,
          painels!inner(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar prédios:', error);
        toast.error(`Erro ao carregar prédios: ${error.message}`);
        return;
      }

      console.log('✅ Prédios carregados:', data?.length);
      
      // Processar dados com contagem real de painéis
      const typedBuildings = (data || []).map(building => {
        // Contar painéis reais associados ao prédio
        const realPanelCount = building.painels?.length || 0;
        
        return {
          ...building,
          padrao_publico: (building.padrao_publico as 'alto' | 'medio' | 'normal') || 'normal',
          image_urls: building.image_urls || buildImageUrlsArray(building),
          amenities: building.amenities || building.caracteristicas || [],
          caracteristicas: building.caracteristicas || building.amenities || [],
          numero_unidades: building.numero_unidades || 0,
          publico_estimado: building.publico_estimado || (building.numero_unidades * 3) || 0,
          preco_base: building.preco_base || 0,
          quantidade_telas: realPanelCount, // Usar contagem real
          visualizacoes_mes: realPanelCount * 7350 || 0, // Calcular baseado na contagem real
          monthly_traffic: building.monthly_traffic || 0,
          latitude: building.latitude || 0,
          longitude: building.longitude || 0
        };
      });
      
      setBuildings(typedBuildings);
      
      // Calcular estatísticas completas
      const total = typedBuildings.length;
      const active = typedBuildings.filter(b => b.status === 'ativo').length;
      const inactive = typedBuildings.filter(b => b.status === 'inativo').length;
      const totalTraffic = typedBuildings.reduce((sum, building) => 
        sum + (building.monthly_traffic || 0), 0
      );
      const totalUnits = typedBuildings.reduce((sum, building) => 
        sum + (building.numero_unidades || 0), 0
      );
      const totalPublic = typedBuildings.reduce((sum, building) => 
        sum + (building.publico_estimado || 0), 0
      );
      const totalScreens = typedBuildings.reduce((sum, building) => 
        sum + (building.quantidade_telas || 0), 0
      );
      const totalViews = typedBuildings.reduce((sum, building) => 
        sum + (building.visualizacoes_mes || 0), 0
      );
      const averagePrice = typedBuildings.length > 0 
        ? typedBuildings.reduce((sum, building) => sum + (building.preco_base || 0), 0) / typedBuildings.length
        : 0;

      setStats({ 
        total, 
        active, 
        inactive, 
        totalTraffic, 
        totalUnits, 
        totalPublic,
        averagePrice, 
        totalScreens,
        totalViews 
      });
      
    } catch (error) {
      console.error('💥 Erro crítico ao carregar prédios:', error);
      toast.error('Erro crítico. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para construir array de URLs a partir dos campos individuais
  const buildImageUrlsArray = (building: any) => {
    const urls = [];
    if (building.imagem_principal) urls.push(building.imagem_principal);
    if (building.imagem_2) urls.push(building.imagem_2);
    if (building.imagem_3) urls.push(building.imagem_3);
    if (building.imagem_4) urls.push(building.imagem_4);
    return urls;
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
        p_description: 'Prédio atualizado via gerenciamento completo',
        p_new_values: updates
      });

      toast.success('Prédio atualizado com sucesso!');
      fetchBuildings();
    } catch (error) {
      console.error('Erro ao atualizar prédio:', error);
      toast.error('Erro ao atualizar prédio');
    }
  };

  const deleteBuilding = async (id: string) => {
    try {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log da ação
      await supabase.rpc('log_building_action', {
        p_building_id: id,
        p_action_type: 'delete',
        p_description: 'Prédio excluído',
        p_new_values: {}
      });

      toast.success('Prédio excluído com sucesso!');
      fetchBuildings();
    } catch (error) {
      console.error('Erro ao excluir prédio:', error);
      toast.error('Erro ao excluir prédio');
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

  return { 
    buildings, 
    stats, 
    loading, 
    refetch: fetchBuildings, 
    updateBuilding,
    deleteBuilding 
  };
};

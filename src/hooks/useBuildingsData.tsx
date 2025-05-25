
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
  // Novos campos de contato
  nome_sindico: string;
  contato_sindico: string;
  nome_vice_sindico: string;
  contato_vice_sindico: string;
  nome_contato_predio: string;
  numero_contato_predio: string;
}

interface BuildingStats {
  total: number;
  active: number;
  inactive: number;
  totalPanels: number;
}

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
      console.log('🏢 [BUILDINGS DATA] Iniciando busca de prédios...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ [BUILDINGS DATA] Erro de autenticação:', authError);
        toast.error('Erro de autenticação. Faça login novamente.');
        return;
      }

      if (!user) {
        console.error('❌ [BUILDINGS DATA] Usuário não autenticado');
        toast.error('Acesso negado. Faça login como administrador.');
        return;
      }

      // Query para buscar prédios com timeout
      const buildingsPromise = supabase
        .from('buildings')
        .select('*')
        .order('created_at', { ascending: false });

      const panelsPromise = supabase
        .from('painels')
        .select('building_id');

      // Implementar timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na busca de dados')), 10000);
      });

      const [buildingsResult, panelsResult] = await Promise.race([
        Promise.all([buildingsPromise, panelsPromise]),
        timeoutPromise
      ]) as any;

      const { data: buildingsData, error: buildingsError } = buildingsResult;
      const { data: panelsData, error: panelsError } = panelsResult;

      if (buildingsError) {
        console.error('❌ [BUILDINGS DATA] Erro ao buscar prédios:', buildingsError);
        toast.error(`Erro ao carregar prédios: ${buildingsError.message}`);
        return;
      }

      console.log('✅ [BUILDINGS DATA] Prédios carregados:', buildingsData?.length || 0);

      if (panelsError) {
        console.error('⚠️ [BUILDINGS DATA] Erro ao buscar painéis (não crítico):', panelsError);
      }

      // Criar mapa de contagem de painéis por prédio
      const panelCountMap = new Map();
      if (panelsData) {
        panelsData.forEach(panel => {
          const buildingId = panel.building_id;
          if (buildingId) {
            panelCountMap.set(buildingId, (panelCountMap.get(buildingId) || 0) + 1);
          }
        });
      }
      
      // Processar dados dos prédios com validação robusta
      const typedBuildings = (buildingsData || [])
        .filter(building => building && building.id && building.nome) // Filtrar dados inválidos
        .map(building => {
          const panelCount = panelCountMap.get(building.id) || 0;
          
          return {
            ...building,
            // GARANTIR RESIDENCIAL COMO PADRÃO se venue_type não estiver definido ou for inválido
            venue_type: (building.venue_type === 'Residencial' || building.venue_type === 'Comercial') 
              ? building.venue_type 
              : 'Residencial',
            location_type: building.location_type || 'residential',
            padrao_publico: (building.padrao_publico as 'alto' | 'medio' | 'normal') || 'normal',
            image_urls: building.image_urls || buildImageUrlsArray(building),
            amenities: building.amenities || building.caracteristicas || [],
            caracteristicas: building.caracteristicas || building.amenities || [],
            numero_unidades: building.numero_unidades || 0,
            publico_estimado: building.publico_estimado || (building.numero_unidades * 3) || 0,
            preco_base: building.preco_base || 0,
            quantidade_telas: panelCount,
            visualizacoes_mes: panelCount * 7350 || 0,
            monthly_traffic: building.monthly_traffic || 0,
            latitude: building.latitude || 0,
            longitude: building.longitude || 0
          };
        });
      
      console.log('📊 [BUILDINGS DATA] Prédios processados:', typedBuildings.length);
      setBuildings(typedBuildings);
      
      // Calcular estatísticas
      const total = typedBuildings.length;
      const active = typedBuildings.filter(b => b.status === 'ativo').length;
      const inactive = typedBuildings.filter(b => b.status === 'inativo').length;
      const totalPanels = typedBuildings.reduce((sum, building) => 
        sum + (building.quantidade_telas || 0), 0
      );

      setStats({ 
        total, 
        active, 
        inactive, 
        totalPanels 
      });
      
    } catch (error: any) {
      console.error('💥 [BUILDINGS DATA] Erro crítico ao carregar prédios:', error);
      
      if (error.message === 'Timeout na busca de dados') {
        toast.error('Timeout ao carregar dados. Tente novamente.');
      } else {
        toast.error('Erro crítico. Verifique sua conexão e tente novamente.');
      }
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
      // Garantir que venue_type seja sempre válido (Residencial ou Comercial)
      const updatesWithDefaults = {
        ...updates,
        venue_type: (updates.venue_type === 'Residencial' || updates.venue_type === 'Comercial') 
          ? updates.venue_type 
          : 'Residencial'
      };

      const { error } = await supabase
        .from('buildings')
        .update(updatesWithDefaults)
        .eq('id', id);

      if (error) throw error;

      // Log da ação
      await supabase.rpc('log_building_action', {
        p_building_id: id,
        p_action_type: 'update',
        p_description: 'Prédio atualizado via gerenciamento completo',
        p_new_values: updatesWithDefaults
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

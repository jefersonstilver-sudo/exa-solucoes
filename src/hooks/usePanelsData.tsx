
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Basic panel interface (non-sensitive data)
interface Panel {
  id: string;
  code: string;
  building_id?: string;
  status: string;
  resolucao?: string;
  ultima_sync?: string;
  created_at: string;
  polegada?: string;
  orientacao?: string;
  sistema_operacional?: string;
  modelo?: string;
  marca?: string;
  localizacao?: string;
  buildings?: {
    id: string;
    nome: string;
    endereco: string;
    bairro: string;
  };
}

export const usePanelsData = () => {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    maintenance: 0
  });

  const fetchPanels = async () => {
    try {
      setLoading(true);
      
      // Use secure function to get basic panel data only
      const { data, error } = await supabase.rpc('get_panels_basic');

      if (error) {
        console.error('Erro ao buscar painéis:', error);
        if (error.message.includes('must be')) {
          toast.error('Acesso negado: Apenas administradores podem ver painéis');
        } else {
          toast.error('Erro ao carregar painéis');
        }
        return;
      }

      // Transform data to include buildings if needed
      const panelsWithBuildings = await Promise.all((data || []).map(async (panel: any) => {
        if (panel.building_id) {
          try {
            const { data: buildingData } = await supabase
              .from('buildings')
              .select('id, nome, endereco, bairro')
              .eq('id', panel.building_id)
              .single();
            
            return {
              ...panel,
              buildings: buildingData
            };
          } catch {
            return panel;
          }
        }
        return panel;
      }));

      setPanels(panelsWithBuildings);
      
      // Calcular estatísticas
      const total = panelsWithBuildings?.length || 0;
      const online = panelsWithBuildings?.filter(p => p.status === 'online').length || 0;
      const offline = panelsWithBuildings?.filter(p => p.status === 'offline').length || 0;
      const maintenance = panelsWithBuildings?.filter(p => p.status === 'maintenance').length || 0;

      setStats({ total, online, offline, maintenance });
      
    } catch (error) {
      console.error('Erro crítico ao carregar painéis:', error);
      toast.error('Erro crítico ao carregar painéis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanels();

    // Configurar inscrição em tempo real
    const channel = supabase
      .channel('panels-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'painels' 
        }, 
        (payload) => {
          console.log('Mudança nos painéis detectada:', payload);
          fetchPanels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const forceRefresh = async () => {
    await fetchPanels();
  };

  return { panels, stats, loading, refetch: forceRefresh };
};

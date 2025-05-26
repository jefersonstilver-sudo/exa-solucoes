
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Panel {
  id: string;
  code: string;
  building_id: string;
  status: string;
  resolucao: string;
  ultima_sync: string;
  created_at: string;
  polegada: string;
  orientacao: string;
  sistema_operacional: string;
  codigo_anydesk: string;
  senha_anydesk: string;
  modelo: string;
  versao_firmware: string;
  ip_interno: string;
  mac_address: string;
  observacoes: string;
  localizacao: string;
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
      
      const { data, error } = await supabase
        .from('painels')
        .select(`
          *,
          buildings (
            id,
            nome,
            endereco,
            bairro
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar painéis:', error);
        toast.error('Erro ao carregar painéis');
        return;
      }

      setPanels(data || []);
      
      // Calcular estatísticas
      const total = data?.length || 0;
      const online = data?.filter(p => p.status === 'online').length || 0;
      const offline = data?.filter(p => p.status === 'offline').length || 0;
      const maintenance = data?.filter(p => p.status === 'maintenance').length || 0;

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

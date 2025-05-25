
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
      console.log('🔍 [DEBUG] Iniciando busca de painéis...');
      
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
        console.error('❌ [ERROR] Erro ao buscar painéis:', error);
        toast.error('Erro ao carregar painéis');
        return;
      }

      console.log('📊 [DEBUG] Dados brutos recebidos do Supabase:', data);
      console.log('📊 [DEBUG] Quantidade de painéis:', data?.length);
      
      // Log detalhado dos primeiros 3 painéis para debug
      if (data && data.length > 0) {
        console.log('🔍 [DEBUG] Primeiros painéis (máx 3):');
        data.slice(0, 3).forEach((panel, index) => {
          console.log(`Panel ${index + 1}:`, {
            code: panel.code,
            polegada: panel.polegada,
            resolucao: panel.resolucao,
            orientacao: panel.orientacao,
            sistema_operacional: panel.sistema_operacional
          });
        });

        // Verificar se há painéis com configurações incorretas
        const incorrectPanels = data.filter(p => 
          p.polegada !== '22' || 
          p.resolucao !== '1080x1920' || 
          p.orientacao !== 'vertical' || 
          p.sistema_operacional !== 'linux'
        );
        
        if (incorrectPanels.length > 0) {
          console.warn('⚠️ [WARNING] Painéis com configurações incorretas encontrados:', incorrectPanels);
        } else {
          console.log('✅ [SUCCESS] Todos os painéis estão com configurações corretas');
        }
      }

      console.log('✅ [SUCCESS] Painéis carregados com sucesso');
      setPanels(data || []);
      
      // Calcular estatísticas
      const total = data?.length || 0;
      const online = data?.filter(p => p.status === 'online').length || 0;
      const offline = data?.filter(p => p.status === 'offline').length || 0;
      const maintenance = data?.filter(p => p.status === 'maintenance').length || 0;

      console.log('📈 [DEBUG] Estatísticas calculadas:', { total, online, offline, maintenance });
      setStats({ total, online, offline, maintenance });
      
    } catch (error) {
      console.error('💥 [CRITICAL] Erro crítico ao carregar painéis:', error);
      toast.error('Erro crítico ao carregar painéis');
    } finally {
      setLoading(false);
      console.log('🏁 [DEBUG] Busca de painéis finalizada');
    }
  };

  useEffect(() => {
    console.log('🚀 [DEBUG] Hook usePanelsData montado, iniciando fetch...');
    fetchPanels();

    // Configurar inscrição em tempo real
    console.log('📡 [DEBUG] Configurando real-time subscription...');
    const channel = supabase
      .channel('panels-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'painels' 
        }, 
        (payload) => {
          console.log('📺 [REALTIME] Mudança nos painéis detectada:', payload);
          console.log('🔄 [REALTIME] Recarregando dados...');
          fetchPanels();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [DEBUG] Removendo subscription...');
      supabase.removeChannel(channel);
    };
  }, []);

  // Force refresh function with explicit logging
  const forceRefresh = async () => {
    console.log('🔄 [FORCE REFRESH] Usuário solicitou refresh forçado');
    await fetchPanels();
  };

  return { panels, stats, loading, refetch: forceRefresh };
};

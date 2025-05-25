
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
  monthly_traffic: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

export const useBuildingsData = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalTraffic: 0
  });

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      console.log('🏢 Iniciando busca de prédios...');
      
      // Primeiro, verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        toast.error('Erro de autenticação');
        return;
      }

      if (!user) {
        console.error('❌ Usuário não autenticado');
        toast.error('Usuário não autenticado');
        return;
      }

      console.log('✅ Usuário autenticado:', user.email);

      // Buscar prédios
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar prédios:', error);
        console.error('❌ Detalhes do erro:', error.message, error.details, error.code);
        toast.error(`Erro ao carregar prédios: ${error.message}`);
        return;
      }

      console.log('✅ Dados retornados do Supabase:', data);
      console.log('✅ Total de prédios encontrados:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.log('⚠️ Nenhum prédio encontrado na base de dados');
        toast.info('Nenhum prédio encontrado na base de dados');
      } else {
        console.log('🎉 Prédios carregados com sucesso:', data.map(b => b.nome));
        toast.success(`${data.length} prédios carregados com sucesso`);
      }

      setBuildings(data || []);
      
      // Calcular estatísticas
      const total = data?.length || 0;
      const active = data?.filter(b => b.status === 'ativo').length || 0;
      const inactive = data?.filter(b => b.status === 'inativo').length || 0;
      const totalTraffic = data?.reduce((sum, building) => sum + (building.monthly_traffic || 0), 0) || 0;

      setStats({ total, active, inactive, totalTraffic });
      
    } catch (error) {
      console.error('💥 Erro crítico ao carregar prédios:', error);
      toast.error('Erro crítico ao carregar prédios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();

    // Configurar inscrição em tempo real
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

  return { buildings, stats, loading, refetch: fetchBuildings };
};

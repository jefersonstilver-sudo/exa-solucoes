
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
      console.log('🏢 Iniciando busca de prédios com novas políticas RLS...');
      
      // Verificar autenticação
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

      console.log('✅ Usuário autenticado:', user.email);

      // Tentar buscar prédios com a nova política RLS
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar prédios:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Detalhes:', error.details);
        
        // Fallback: tentar busca mais simples
        console.log('🔄 Tentando busca simplificada...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('buildings')
          .select('id, nome, endereco, bairro, status')
          .limit(10);
          
        if (fallbackError) {
          console.error('❌ Fallback também falhou:', fallbackError);
          toast.error(`Erro ao carregar prédios: ${error.message}`);
          return;
        }
        
        console.log('⚠️ Usando dados de fallback:', fallbackData);
        toast.warning('Dados carregados em modo simplificado');
        setBuildings(fallbackData || []);
      } else {
        console.log('✅ Dados carregados com sucesso:', data);
        console.log('✅ Total de prédios:', data?.length || 0);
        
        if (!data || data.length === 0) {
          console.log('⚠️ Nenhum prédio encontrado');
          toast.info('Nenhum prédio encontrado. Verifique as permissões.');
        } else {
          console.log('🎉 Prédios carregados:', data.map(b => `${b.nome} (${b.status})`));
          toast.success(`${data.length} prédios carregados com sucesso`);
        }

        setBuildings(data || []);
      }
      
      // Calcular estatísticas
      const buildingsList = data || [];
      const total = buildingsList.length;
      const active = buildingsList.filter(b => b.status === 'ativo').length;
      const inactive = buildingsList.filter(b => b.status === 'inativo').length;
      const totalTraffic = buildingsList.reduce((sum, building) => 
        sum + (building.monthly_traffic || 0), 0
      );

      setStats({ total, active, inactive, totalTraffic });
      
    } catch (error) {
      console.error('💥 Erro crítico ao carregar prédios:', error);
      toast.error('Erro crítico. Verifique sua conexão e tente novamente.');
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

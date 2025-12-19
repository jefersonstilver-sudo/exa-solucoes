import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HomeMetrics {
  totalBuildings: number;
  totalPeople: number;
  dailyViews: number;
}

export const useHomeMetrics = () => {
  return useQuery({
    queryKey: ['home-metrics'],
    queryFn: async (): Promise<HomeMetrics> => {
      // Buscar prédios ativos com dados de visualização
      const { data: buildings, error } = await supabase
        .from('buildings')
        .select('id, visualizacoes_mes, publico_estimado')
        .eq('status', 'ativo');

      if (error) {
        console.error('Erro ao buscar métricas:', error);
        throw error;
      }

      const totalBuildings = buildings?.length || 0;
      
      // Soma do público estimado de todos os prédios ativos
      const totalPeople = buildings?.reduce((sum, b) => sum + (b.publico_estimado || 0), 0) || 0;
      
      // Soma das visualizações mensais / 30 para ter por dia
      const monthlyViews = buildings?.reduce((sum, b) => sum + (b.visualizacoes_mes || 0), 0) || 0;
      const dailyViews = Math.round(monthlyViews / 30);

      return {
        totalBuildings,
        totalPeople,
        dailyViews,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
  });
};

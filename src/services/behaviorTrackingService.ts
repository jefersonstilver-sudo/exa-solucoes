import { supabase } from '@/integrations/supabase/client';

export interface UserBehaviorSummary {
  total_events: number;
  page_views: Array<{
    page: string;
    count: number;
    avg_time: number;
  }>;
  searches: Array<{
    search_term: string;
    filters?: Record<string, any>;
    timestamp: string;
  }>;
  buildings_clicked: Array<{
    id: string;
    name: string;
    neighborhood: string;
  }>;
  cart_interactions: Array<{
    type: string;
    building_id?: string;
    building_name?: string;
    timestamp: string;
  }>;
  map_interactions: Array<{
    building: any;
    timestamp: string;
  }>;
  time_by_page: Record<string, number>;
  first_visit: string;
  last_activity: string;
  total_sessions: number;
}

/**
 * Busca resumo agregado do comportamento de um usuário
 */
export const getUserBehaviorSummary = async (
  userId: string
): Promise<UserBehaviorSummary | null> => {
  try {
    console.log('📊 Buscando resumo de comportamento para:', userId);

    const { data, error } = await supabase.rpc('get_user_behavior_summary', {
      target_user_id: userId,
    });

    if (error) {
      console.error('❌ Erro ao buscar comportamento:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Nenhum dado de comportamento encontrado');
      return null;
    }

    const summary = data[0];
    console.log('✅ Resumo de comportamento carregado:', summary);

    return {
      total_events: summary.total_events || 0,
      page_views: (summary.page_views || []) as Array<{
        page: string;
        count: number;
        avg_time: number;
      }>,
      searches: (summary.searches || []) as Array<{
        search_term: string;
        filters?: Record<string, any>;
        timestamp: string;
      }>,
      buildings_clicked: (summary.buildings_clicked || []) as Array<{
        id: string;
        name: string;
        neighborhood: string;
      }>,
      cart_interactions: (summary.cart_interactions || []) as Array<{
        type: string;
        building_id?: string;
        building_name?: string;
        timestamp: string;
      }>,
      map_interactions: (summary.map_interactions || []) as Array<{
        building: any;
        timestamp: string;
      }>,
      time_by_page: (summary.time_by_page || {}) as Record<string, number>,
      first_visit: summary.first_visit,
      last_activity: summary.last_activity,
      total_sessions: summary.total_sessions || 0,
    };
  } catch (error) {
    console.error('💥 Erro crítico ao buscar comportamento:', error);
    return null;
  }
};

/**
 * Busca eventos brutos de comportamento do usuário
 */
export const getUserBehaviorEvents = async (
  userId: string,
  limit: number = 50
) => {
  try {
    const { data, error } = await supabase
      .from('user_behavior_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('💥 Erro crítico ao buscar eventos:', error);
    return [];
  }
};

/**
 * Formata tempo em segundos para formato legível
 */
export const formatTimeSpent = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

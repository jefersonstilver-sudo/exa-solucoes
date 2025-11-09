import { supabase } from '@/integrations/supabase/client';

export interface AIAnalysis {
  interest_score: number;
  interest_level: 'low' | 'medium' | 'high' | 'very_high';
  behavior_summary: string;
  main_interests: string[];
  conversion_probability: 'low' | 'medium' | 'high' | 'very_high';
  conversion_probability_percent: number;
  recommended_actions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  }>;
  next_best_action: string;
  churn_risk: 'low' | 'medium' | 'high';
  insights: string[];
  analyzed_at?: string;
  user_id?: string;
}

export interface UnifiedClientData {
  user: {
    id: string;
    email: string;
    role: string;
    cpf?: string;
    telefone?: string;
    avatar_url?: string;
    created_at: string;
    name?: string;
    phone?: string;
  };
  orders: {
    total_orders: number;
    total_spent: number;
    orders: Array<{
      id: string;
      status: string;
      valor_total: number;
      created_at: string;
      data_inicio?: string;
      data_fim?: string;
      lista_predios?: string[];
      plano_meses?: number;
    }>;
  };
  attempts: {
    total_attempts: number;
    total_abandoned_value: number;
    attempts: Array<{
      id: string;
      valor_total: number;
      created_at: string;
      predios_selecionados?: string[];
    }>;
  };
  behavior: {
    id: string;
    user_id: string;
    total_sessions: number;
    total_time_spent: number;
    pages_visited: Record<string, number>;
    last_visit?: string;
    buildings_viewed: Array<{
      building_id: string;
      time_spent: number;
      views_count: number;
    }>;
    videos_watched: Array<{
      video_id: string;
      watch_duration: number;
      completed: boolean;
    }>;
    cart_abandonments: number;
    checkout_starts: number;
    purchase_intent_score: number;
    ai_behavior_summary?: string;
    ai_interest_level?: string;
    ai_recommended_actions?: Array<any>;
    last_ai_analysis?: string;
  };
  notes: {
    total_notes: number;
    notes: Array<{
      id: string;
      note_type: string;
      content: string;
      is_important: boolean;
      created_at: string;
      created_by_name?: string;
    }>;
  };
}

/**
 * Busca dados unificados do cliente para CRM
 */
export const getUnifiedClientData = async (userId: string): Promise<UnifiedClientData | null> => {
  try {
    const { data, error } = await supabase.rpc('get_unified_client_data', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching unified client data:', error);
      throw error;
    }

    return data as unknown as UnifiedClientData;
  } catch (error) {
    console.error('Error in getUnifiedClientData:', error);
    throw error;
  }
};

/**
 * Executa análise comportamental com IA
 */
export const analyzeUserBehavior = async (userId: string): Promise<AIAnalysis> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-user-behavior', {
      body: { user_id: userId },
    });

    if (error) {
      console.error('Error analyzing user behavior:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    // Salvar análise no histórico
    const { data: { user } } = await supabase.auth.getUser();
    if (user && data.analysis) {
      await supabase.from('crm_ai_analysis_history').insert([{
        user_id: userId,
        analyzed_by: user.id,
        analysis_data: data.analysis,
        interest_score: data.analysis.interest_score || 0,
        interest_level: data.analysis.interest_level || 'low',
        conversion_probability: data.analysis.conversion_probability || 'low',
        churn_risk: data.analysis.churn_risk || 'low',
        recommended_actions: data.analysis.recommended_actions || [],
      }]);

      // Registrar ação no log
      await supabase.from('crm_action_logs').insert([{
        client_id: userId,
        performed_by: user.id,
        action_type: 'analyze_ai',
        action_details: { analysis_id: data.analysis.analyzed_at },
      }]);
    }

    return data.analysis as AIAnalysis;
  } catch (error) {
    console.error('Error in analyzeUserBehavior:', error);
    throw error;
  }
};

/**
 * Adiciona nota CRM para um cliente
 */
export const addCRMNote = async (
  clientId: string,
  noteType: 'call' | 'email' | 'meeting' | 'observation' | 'follow_up',
  content: string,
  isImportant: boolean = false
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase.from('client_crm_notes').insert({
      client_id: clientId,
      created_by: user.id,
      note_type: noteType,
      content,
      is_important: isImportant,
    });

    if (error) {
      console.error('Error adding CRM note:', error);
      throw error;
    }

    // Registrar ação no log
    await supabase.from('crm_action_logs').insert([{
      client_id: clientId,
      performed_by: user.id,
      action_type: 'add_note',
      action_details: { note_type: noteType, is_important: isImportant },
    }]);

    return { success: true };
  } catch (error) {
    console.error('Error in addCRMNote:', error);
    throw error;
  }
};

/**
 * Registra visualização de perfil do cliente
 */
export const logClientProfileView = async (clientId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('crm_action_logs').insert([{
      client_id: clientId,
      performed_by: user.id,
      action_type: 'view_profile',
      action_details: { timestamp: new Date().toISOString() },
    }]);
  } catch (error) {
    console.error('Error logging profile view:', error);
  }
};

/**
 * Busca todos os clientes com dados básicos para lista no CRM
 */
export const getAllClientsForCRM = async () => {
  try {
    // Buscar todos os usuários que são clients
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nome, cpf, telefone, data_criacao')
      .eq('role', 'client')
      .order('data_criacao', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Buscar analytics de cada usuário
    const usersWithAnalytics = await Promise.all(
      (users || []).map(async (user) => {
        const { data: analytics } = await supabase
          .from('client_behavior_analytics')
          .select('purchase_intent_score, ai_interest_level, last_visit, lifecycle_stage, days_until_renewal')
          .eq('user_id', user.id)
          .single();

        const { data: platformActivity } = await supabase
          .from('client_platform_activity')
          .select('total_logins, last_login, total_videos_uploaded, total_videos_swapped, platform_engagement_score')
          .eq('user_id', user.id)
          .single();

        const { data: orders } = await supabase
          .from('pedidos')
          .select('valor_total, created_at')
          .eq('client_id', user.id)
          .in('status', ['pago', 'ativo', 'pago_pendente_video', 'video_aprovado', 'video_enviado'])
          .order('created_at', { ascending: false });

        const { data: attempts } = await supabase
          .from('tentativas_compra')
          .select('id')
          .eq('id_user', user.id);

        const totalSpent = orders?.reduce((sum, o) => sum + (o.valor_total || 0), 0) || 0;
        const totalOrders = orders?.length || 0;
        const totalAttempts = attempts?.length || 0;
        const lastPurchaseDate = orders && orders.length > 0 ? orders[0].created_at : null;

        return {
          ...user,
          nome: user.nome,
          purchase_intent_score: analytics?.purchase_intent_score || 0,
          ai_interest_level: analytics?.ai_interest_level || 'low',
          last_visit: analytics?.last_visit,
          total_spent: totalSpent,
          total_orders: totalOrders,
          total_attempts: totalAttempts,
          last_purchase_date: lastPurchaseDate,
          // Novos dados de plataforma
          lifecycle_stage: analytics?.lifecycle_stage || 'prospect',
          days_until_renewal: analytics?.days_until_renewal,
          total_logins: platformActivity?.total_logins || 0,
          last_login: platformActivity?.last_login,
          total_videos_uploaded: platformActivity?.total_videos_uploaded || 0,
          total_videos_swapped: platformActivity?.total_videos_swapped || 0,
          platform_engagement_score: platformActivity?.platform_engagement_score || 0,
        };
      })
    );

    return usersWithAnalytics;
  } catch (error) {
    console.error('Error in getAllClientsForCRM:', error);
    throw error;
  }
};

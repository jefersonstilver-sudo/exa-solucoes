import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduleRule {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_all_day?: boolean;
}

export interface BuildingActiveVideo {
  video_id: string;
  video_name: string;
  video_url: string;
  video_duracao: number;
  pedido_id: string;
  client_email: string;
  client_name: string;
  valor_total: number;
  is_scheduled: boolean;
  priority_type: 'scheduled' | 'base';
  slot_position: number;
  schedule_rules?: ScheduleRule[];
  is_currently_active?: boolean;
  created_at?: string;
}

export interface UseBuildingActiveVideosResult {
  videos: BuildingActiveVideo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBuildingActiveVideos(buildingId: string): UseBuildingActiveVideosResult {
  const [videos, setVideos] = useState<BuildingActiveVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveVideos = async () => {
    if (!buildingId) {
      setVideos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🎬 [BUILDING ACTIVE VIDEOS] Buscando vídeos para prédio:', buildingId);

      // 1. Buscar pedidos ativos para este prédio
      // CORREÇÃO: Usar filtro correto para array de UUIDs
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select(`
          id,
          client_id,
          valor_total,
          status,
          data_inicio,
          data_fim,
          lista_predios
        `)
        .in('status', ['ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago'])
        .filter('lista_predios', 'cs', `{${buildingId}}`);

      if (pedidosError) {
        throw new Error(`Erro ao buscar pedidos: ${pedidosError.message}`);
      }

      if (!pedidos || pedidos.length === 0) {
        console.log('📭 [BUILDING ACTIVE VIDEOS] Nenhum pedido ativo encontrado para este prédio');
        setVideos([]);
        return;
      }

      // 2. Buscar TODOS os vídeos ATIVOS (aprovados) de TODOS os pedidos
      const pedidoIds = pedidos.map(p => p.id);
      
      console.log('🎬 [BUILDING ACTIVE VIDEOS] Buscando TODOS os vídeos ativos para', pedidoIds.length, 'pedidos');
      const startTime = performance.now();

      // Buscar todos os vídeos ativos de todos os pedidos (não apenas o atual em exibição)
      const { data: allVideosData, error: videosError } = await supabase
        .from('pedido_videos')
        .select(`
          pedido_id,
          video_id,
          slot_position,
          is_base_video,
          selected_for_display,
          is_active,
          created_at,
          videos!inner (
            id,
            nome,
            url,
            duracao
          )
        `)
        .in('pedido_id', pedidoIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error('❌ [BUILDING ACTIVE VIDEOS] Erro ao buscar vídeos:', videosError);
        setVideos([]);
        return;
      }

      const videosTime = performance.now();
      console.log(`✅ [BUILDING ACTIVE VIDEOS] ${allVideosData?.length || 0} vídeos ativos carregados em ${(videosTime - startTime).toFixed(0)}ms`);

      if (!allVideosData || allVideosData.length === 0) {
        console.log('📭 [BUILDING ACTIVE VIDEOS] Nenhum vídeo ativo encontrado');
        setVideos([]);
        return;
      }

      // 3. Extrair todos os IDs necessários
      const videoIds = [...new Set(allVideosData.map((v: any) => v.video_id).filter(Boolean))];
      const clientIds = [...new Set(pedidos.map(p => p.client_id))];

      // 4. Buscar dados de clientes e regras de programação em PARALELO
      const clientsDataPromise = supabase.from('users_with_role').select('id, email').in('id', clientIds);

      const parallelTime = performance.now();

      // 5. Criar maps para lookup O(1)
      const clientsData = await clientsDataPromise;
      const clientsMap = new Map(clientsData.data?.map(c => [c.id, c]) || []);

      console.log(`✅ [BUILDING ACTIVE VIDEOS] Dados de clientes carregados em ${(performance.now() - parallelTime).toFixed(0)}ms`);

      // 6. Buscar schedule rules para vídeos (para identificar se são agendados)
      // Buscar regras de programação para TODOS os vídeos
      let scheduleRulesMap = new Map<string, ScheduleRule[]>();
      
      if (videoIds.length > 0) {
        const { data: scheduleRulesData } = await supabase
          .from('campaign_schedule_rules')
          .select(`
            days_of_week,
            start_time,
            end_time,
            is_active,
            is_all_day,
            campaign_video_schedules!inner (
              video_id
            )
          `)
          .in('campaign_video_schedules.video_id', videoIds)
          .eq('is_active', true);
        
        // Agrupar rules por video_id
        scheduleRulesData?.forEach((rule: any) => {
          const videoId = rule.campaign_video_schedules?.video_id;
          if (!videoId) return;
          
          const existing = scheduleRulesMap.get(videoId) || [];
          existing.push({
            days_of_week: rule.days_of_week,
            start_time: rule.start_time,
            end_time: rule.end_time,
            is_active: rule.is_active,
            is_all_day: rule.is_all_day
          });
          scheduleRulesMap.set(videoId, existing);
        });
      }

      // 7. Verificar status atual baseado em horário
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.toTimeString().slice(0, 5);
      
      const isVideoActiveNow = (videoId: string, scheduleRules?: ScheduleRule[]) => {
        if (!scheduleRules || scheduleRules.length === 0) return true;
        
        return scheduleRules.some(rule => {
          if (!rule.days_of_week.includes(currentDay)) return false;
          if (rule.is_all_day) return true;
          return currentTime >= rule.start_time && currentTime <= rule.end_time;
        });
      };

      // 8. Montar resultado final com TODOS os vídeos ativos
      const activeVideos: BuildingActiveVideo[] = [];

      for (const pedidoVideo of allVideosData) {
        const pedido = pedidos.find(p => p.id === pedidoVideo.pedido_id);
        if (!pedido) continue;

        const videoData = (pedidoVideo as any).videos;
        if (!videoData) continue;

        const clientData = clientsMap.get(pedido.client_id);
        const clientEmail = clientData?.email || 'Email não encontrado';
        const clientName = clientEmail.split('@')[0] || 'Cliente';

        const scheduleRules = scheduleRulesMap.get(pedidoVideo.video_id);
        const isScheduled = scheduleRules && scheduleRules.length > 0;

        activeVideos.push({
          video_id: pedidoVideo.video_id,
          video_name: videoData.nome,
          video_url: videoData.url,
          video_duracao: videoData.duracao || 30,
          pedido_id: pedido.id,
          client_email: clientEmail,
          client_name: clientName,
          valor_total: pedido.valor_total || 0,
          is_scheduled: isScheduled,
          priority_type: (pedidoVideo.is_base_video ? 'base' : 'scheduled') as 'scheduled' | 'base',
          slot_position: pedidoVideo.slot_position || 1,
          schedule_rules: scheduleRules,
          is_currently_active: isVideoActiveNow(pedidoVideo.video_id, scheduleRules),
          created_at: (pedidoVideo as any).created_at
        });
      }

      // Ordenar: mais recentes primeiro (enviados por último)
      activeVideos.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Descendente (mais recente primeiro)
      });

      const endTime = performance.now();
      const totalTime = (endTime - startTime).toFixed(0);
      
      setVideos(activeVideos);
      console.log(`🎉 [BUILDING ACTIVE VIDEOS] Total de ${activeVideos.length} vídeos ativos encontrados em ${totalTime}ms (otimizado)`);

    } catch (error: any) {
      console.error('💥 [BUILDING ACTIVE VIDEOS] Erro geral:', error);
      setError(error.message || 'Erro ao carregar vídeos ativos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVideos();

    // 🔴 REALTIME: Subscrever mudanças em pedido_videos e videos
    console.log('🔴 [REALTIME] Iniciando subscriptions para prédio:', buildingId);
    
    const channel = supabase
      .channel(`building-videos-${buildingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedido_videos'
        },
        (payload) => {
          console.log('🔴 [REALTIME] Mudança detectada em pedido_videos:', payload);
          fetchActiveVideos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos'
        },
        (payload) => {
          console.log('🔴 [REALTIME] Mudança detectada em videos:', payload);
          fetchActiveVideos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('🔴 [REALTIME] Mudança detectada em pedidos:', payload);
          fetchActiveVideos();
        }
      )
      .subscribe();

    return () => {
      console.log('🔴 [REALTIME] Removendo subscriptions para prédio:', buildingId);
      supabase.removeChannel(channel);
    };
  }, [buildingId]);

  return {
    videos,
    loading,
    error,
    refetch: fetchActiveVideos
  };
}
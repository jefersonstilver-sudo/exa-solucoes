import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from '@/utils/debounce';

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
  
  // Cache para evitar refetch desnecessário
  const lastCheckRef = useRef({ videoIds: '', timestamp: 0 });
  const CACHE_TTL = 3000; // 3 segundos

  const fetchActiveVideos = async () => {
    if (!buildingId) {
      setVideos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {

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
        setVideos([]);
        return;
      }

      // 2. ✅ CORREÇÃO: Buscar apenas 1 vídeo por pedido (vídeo em exibição)
      const pedidoIds = pedidos.map(p => p.id);
      const startTime = performance.now();

      // Usar RPC para buscar apenas vídeos em exibição (1 por pedido)
      const { data: currentVideosData, error: currentVideosError } = await supabase
        .rpc('get_current_display_videos_batch', { 
          p_pedido_ids: pedidoIds 
        });

      if (currentVideosError) {
        setVideos([]);
        return;
      }

      // Filtrar apenas vídeos válidos (com video_id)
      const validVideos = currentVideosData?.filter((v: any) => v.video_id !== null) || [];

      if (validVideos.length === 0) {
        setVideos([]);
        return;
      }

      // Buscar detalhes completos dos vídeos
      const videoIds = validVideos.map((v: any) => v.video_id);
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
        .in('video_id', videoIds)
        .in('pedido_id', pedidoIds);

      if (videosError || !allVideosData || allVideosData.length === 0) {
        setVideos([]);
        return;
      }

      // 3. Extrair IDs de clientes
      const clientIds = [...new Set(pedidos.map(p => p.client_id))];

      // 4. Buscar dados de clientes
      const clientsData = await supabase.from('users_with_role').select('id, email').in('id', clientIds);
      const clientsMap = new Map(clientsData.data?.map(c => [c.id, c]) || []);

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

      // 7. Verificar status atual baseado em horário (OTIMIZADO)
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.toTimeString().slice(0, 5);
      
      const isVideoActiveNow = (scheduleRules?: ScheduleRule[]): boolean => {
        // SEM PROGRAMAÇÃO = SEMPRE ATIVO
        if (!scheduleRules || scheduleRules.length === 0) return true;
        
        // COM PROGRAMAÇÃO = VERIFICAR HORÁRIO/DIA
        return scheduleRules.some(rule => {
          if (!rule.days_of_week.includes(currentDay)) return false;
          if (rule.is_all_day) return true;
          return currentTime >= rule.start_time && currentTime <= rule.end_time;
        });
      };

      // 8. Montar resultado final
      const activeVideos: BuildingActiveVideo[] = [];
      let permanentCount = 0;
      let scheduledActive = 0;
      let scheduledInactive = 0;

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
        const isCurrentlyActive = isVideoActiveNow(scheduleRules);
        
        if (!isScheduled) permanentCount++;
        else if (isCurrentlyActive) scheduledActive++;
        else scheduledInactive++;

        const videoInfo = {
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
          is_currently_active: isCurrentlyActive,
          created_at: (pedidoVideo as any).created_at
        };

        activeVideos.push(videoInfo);
      }

      // FILTRAR APENAS VÍDEOS EM EXIBIÇÃO AGORA
      const videosEmExibicao = activeVideos.filter(v => v.is_currently_active === true);
      
      // Verificar cache para evitar logs repetidos
      const currentHash = videosEmExibicao.map(v => v.video_id).sort().join(',');
      const isChanged = currentHash !== lastCheckRef.current.videoIds;
      
      if (isChanged) {
        const totalDuration = videosEmExibicao.reduce((acc, v) => acc + v.video_duracao, 0);
        console.log(`🎬 [VIDEOS] ${videosEmExibicao.length} vídeos carregados (${totalDuration}s total) - ${permanentCount} permanentes${scheduledActive > 0 ? `, ${scheduledActive} agendados ativos` : ''}${scheduledInactive > 0 ? `, ${scheduledInactive} aguardando` : ''}`);
        videosEmExibicao.forEach(v => console.log(`  → "${v.video_name}" (${v.video_duracao}s)`));
        lastCheckRef.current = { videoIds: currentHash, timestamp: Date.now() };
      }
      
      // Ordenar: mais recentes primeiro (enviados por último)
      videosEmExibicao.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Descendente (mais recente primeiro)
      });

      setVideos(videosEmExibicao);

    } catch (error: any) {
      console.error('❌ [VIDEOS] Erro:', error.message);
      setError(error.message || 'Erro ao carregar vídeos ativos');
    } finally {
      setLoading(false);
    }
  };
  
  // Debounce para refetch via realtime
  const debouncedRefetch = useMemo(() => debounce(() => {
    fetchActiveVideos();
  }, 2000), [buildingId]);

  useEffect(() => {
    fetchActiveVideos();

    // REALTIME: Apenas 1 channel para pedido_videos (suficiente)
    const channel = supabase
      .channel(`building-videos-${buildingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedido_videos'
        },
        () => {
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [buildingId, debouncedRefetch]);

  return {
    videos,
    loading,
    error,
    refetch: fetchActiveVideos
  };
}
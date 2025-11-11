import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

  // ✅ CORREÇÃO 2: Estabilizar fetchActiveVideos com useCallback
  const fetchActiveVideos = useCallback(async () => {
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

      // 2. ✅ Buscar TODOS os vídeos em exibição (selected_for_display = true)
      const pedidoIds = pedidos.map(p => p.id);
      
      console.log(`🔍 [VIDEOS] Buscando vídeos para ${pedidoIds.length} pedidos ativos`);

      // Buscar TODOS os vídeos em exibição diretamente
      const { data: allVideosData, error: videosError } = await supabase
        .from('pedido_videos')
        .select(`
          pedido_id,
          video_id,
          slot_position,
          is_base_video,
          selected_for_display,
          is_active,
          approval_status,
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
        .eq('selected_for_display', true)
        .eq('approval_status', 'approved');

      if (videosError) {
        console.error('❌ [VIDEOS] Erro ao buscar vídeos:', videosError);
        setVideos([]);
        return;
      }

      if (!allVideosData || allVideosData.length === 0) {
        console.log('⚠️ [VIDEOS] Nenhum vídeo em exibição encontrado');
        setVideos([]);
        return;
      }

      console.log(`✅ [VIDEOS] ${allVideosData.length} vídeos em exibição encontrados`);
      
      // Validar URLs e IDs
      allVideosData.forEach((v: any) => {
        if (!v.videos?.url || !v.videos.url.startsWith('http')) {
          console.error('❌ [VIDEOS] URL inválida:', v);
        }
        
        if (!v.video_id || v.video_id === ':video_id') {
          console.error('❌ [VIDEOS] Video ID inválido:', v);
        }
      });

      // 3. Extrair IDs de clientes
      const clientIds = [...new Set(pedidos.map(p => p.client_id))];

      // 4. Buscar dados de clientes
      const clientsData = await supabase.from('users_with_role').select('id, email').in('id', clientIds);
      const clientsMap = new Map(clientsData.data?.map(c => [c.id, c]) || []);

      // 6. Buscar schedule rules para vídeos (para identificar se são agendados)
      const videoIds = allVideosData.map(v => v.video_id);
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

      // 7. Backend já gerencia o status - não precisamos calcular aqui

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
        
        if (!isScheduled) permanentCount++;
        else scheduledActive++;

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
          created_at: (pedidoVideo as any).created_at
        };

        activeVideos.push(videoInfo);
      }

      // Backend já retorna apenas vídeos em exibição (selected_for_display = true)
      // Verificar cache para evitar logs repetidos
      const currentHash = activeVideos.map(v => v.video_id).sort().join(',');
      const isChanged = currentHash !== lastCheckRef.current.videoIds;
      
      if (isChanged) {
        const totalDuration = activeVideos.reduce((acc, v) => acc + v.video_duracao, 0);
        console.log(`🎬 [VIDEOS] ${activeVideos.length} vídeos carregados (${totalDuration}s total) - ${permanentCount} permanentes${scheduledActive > 0 ? `, ${scheduledActive} agendados` : ''}`);
        activeVideos.forEach(v => console.log(`  → "${v.video_name}" (${v.video_duracao}s)`));
        lastCheckRef.current = { videoIds: currentHash, timestamp: Date.now() };
      }
      
      // Ordenar: mais recentes primeiro (enviados por último)
      activeVideos.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Descendente (mais recente primeiro)
      });

      setVideos(activeVideos);

    } catch (error: any) {
      console.error('❌ [VIDEOS] Erro:', error.message);
      setError(error.message || 'Erro ao carregar vídeos ativos');
    } finally {
      setLoading(false);
    }
  }, [buildingId]); // ✅ Apenas buildingId como dependência
  
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
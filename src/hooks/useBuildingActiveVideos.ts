import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from '@/utils/debounce';
import { pollingCoordinator } from '@/utils/pollingCoordinator';

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
  isUpdating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBuildingActiveVideos(buildingId: string): UseBuildingActiveVideosResult {
  const [videos, setVideos] = useState<BuildingActiveVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ⚡ Cache otimizado para reduzir queries (aumentado de 3s para 30s)
  const lastCheckRef = useRef({ videoIds: '', timestamp: 0 });
  const CACHE_TTL = 30000; // 30 segundos - reduzir sobrecarga

  // ✅ CORREÇÃO 2: Estabilizar fetchActiveVideos com useCallback
  const fetchActiveVideos = useCallback(async () => {
    if (!buildingId) {
      setVideos([]);
      return;
    }

    setLoading(true);
    setError(null);

    // ⚡ Performance tracking
    const perfStart = performance.now();

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

      // 2. ✅ Buscar apenas o vídeo em exibição atual para cada pedido
      const pedidoIds = pedidos.map(p => p.id);
      
      console.log(`🔍 [VIDEOS] Buscando vídeos em exibição para ${pedidoIds.length} pedidos ativos`);

      // ✅ CRÍTICO: Buscar apenas o vídeo QUE DEVE ESTAR EM EXIBIÇÃO AGORA via RPC
      // Esta RPC considera agendamentos ativos e retorna o vídeo correto para cada pedido
      const videoPromises = pedidoIds.map(async (pedidoId) => {
        const { data: currentVideoData, error: rpcError } = await supabase.rpc('get_current_display_video', {
          p_pedido_id: pedidoId
        });

        if (rpcError) {
          console.error(`❌ [VIDEOS] Erro RPC para pedido ${pedidoId}:`, rpcError);
          return null;
        }

        if (!currentVideoData || currentVideoData.length === 0) {
          console.log(`⚠️ [VIDEOS] Nenhum vídeo em exibição para pedido ${pedidoId}`);
          return null;
        }

        const videoInfo = currentVideoData[0];
        console.log(`🎯 [VIDEOS] Pedido ${pedidoId}: Vídeo em exibição: ${videoInfo.video_id} (${videoInfo.priority_type})`);
        
        // Buscar dados completos do vídeo
        const { data: videoData, error: videoError } = await supabase
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
          .eq('pedido_id', pedidoId)
          .eq('video_id', videoInfo.video_id)
          .eq('approval_status', 'approved')
          .single();

        if (videoError || !videoData) {
          console.error(`❌ [VIDEOS] Erro ao buscar dados completos do vídeo ${videoInfo.video_id}:`, videoError);
          return null;
        }

        // ✅ Validação extra: Garantir que o vídeo é realmente válido
        if (!videoData.videos?.url) {
          console.error(`❌ [VIDEOS] Vídeo ${videoInfo.video_id} sem URL válida`);
          return null;
        }

        return videoData;
      });

      const allVideosData = (await Promise.all(videoPromises)).filter(v => v !== null);
      const videosError = null;

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

      // ⚡ Log de performance
      const duration = Math.round(performance.now() - perfStart);
      if (duration > 2000) {
        console.warn(`⚠️ [VIDEOS] Query LENTA: ${duration}ms para ${activeVideos.length} vídeos`);
      } else {
        console.log(`✅ [VIDEOS] Query OK: ${duration}ms para ${activeVideos.length} vídeos`);
      }

    } catch (error: any) {
      console.error('❌ [VIDEOS] Erro:', error.message);
      setError(error.message || 'Erro ao carregar vídeos ativos');
    } finally {
      setLoading(false);
    }
  }, [buildingId]); // ✅ Apenas buildingId como dependência
  
  // Debounced refetch para evitar múltiplas chamadas
  const debouncedRefetch = useMemo(() => debounce(() => {
    console.log('🔄 [VIDEOS] Iniciando atualização via realtime...');
    setIsUpdating(true);
    fetchActiveVideos().finally(() => {
      setIsUpdating(false);
      console.log('✅ [VIDEOS] Atualização realtime concluída');
    });
  }, 2000), [fetchActiveVideos]);

  // ✅ REALTIME MELHORADO: Escutar mudanças relevantes em pedido_videos e pedidos
  useEffect(() => {
    fetchActiveVideos();

    // Cache de pedido IDs para filtro rápido
    let cachedPedidoIds: string[] = [];
    
    // ⚡ Atualizar cache de pedido IDs a cada 5 minutos (reduzido de 1 min)
    const updateCache = async () => {
      const key = `building-videos-cache-${buildingId}`;
      if (pollingCoordinator.canFetch(key)) {
        const { data } = await supabase
          .from('pedidos')
          .select('id')
          .in('status', ['ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago'])
          .filter('lista_predios', 'cs', `{${buildingId}}`);
        
        cachedPedidoIds = data?.map(p => p.id) || [];
        console.log('📦 [VIDEOS] Cache atualizado:', cachedPedidoIds.length, 'pedidos ativos');
      }
    };

    updateCache();
    const cacheInterval = setInterval(updateCache, 300000); // 5 minutos (antes: 1 min)

    const channel = supabase
      .channel(`building-videos-${buildingId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pedido_videos'
      }, (payload: any) => {
        // FILTRO: Só reagir se mudança é de pedido deste prédio
        const pedidoId = payload.new?.pedido_id || payload.old?.pedido_id;
        if (cachedPedidoIds.includes(pedidoId)) {
          console.log('📡 [VIDEOS REALTIME] Mudança relevante detectada:', {
            event: payload.eventType,
            videoId: payload.new?.video_id?.slice(0, 8) + '...' || 'N/A',
            pedidoId: pedidoId?.slice(0, 8) + '...',
            buildingId: buildingId.slice(0, 8) + '...',
            timestamp: new Date().toLocaleTimeString('pt-BR')
          });
          
          // ⚡ Usar polling coordinator para evitar refetch excessivo
          const key = `building-videos-realtime-${buildingId}`;
          if (pollingCoordinator.canFetch(key)) {
            debouncedRefetch();
          }
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pedidos'
      }, (payload: any) => {
        // Novo pedido para este prédio
        if (payload.new?.lista_predios?.includes(buildingId)) {
          console.log('🆕 [VIDEOS REALTIME] Novo pedido para este prédio:', {
            pedidoId: payload.new?.id?.slice(0, 8) + '...',
            buildingId: buildingId.slice(0, 8) + '...',
            timestamp: new Date().toLocaleTimeString('pt-BR')
          });
          updateCache(); // Atualizar cache imediatamente
          debouncedRefetch();
        }
      })
      .subscribe();

    return () => {
      clearInterval(cacheInterval);
      supabase.removeChannel(channel);
      console.log('🔌 [VIDEOS] Realtime desconectado');
    };
  }, [buildingId, debouncedRefetch, fetchActiveVideos]);

  return {
    videos,
    loading,
    isUpdating,
    error,
    refetch: fetchActiveVideos
  };
}
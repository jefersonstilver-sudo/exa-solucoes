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
        .contains('lista_predios', [buildingId])
        .in('status', ['ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago']);

      if (pedidosError) {
        throw new Error(`Erro ao buscar pedidos: ${pedidosError.message}`);
      }

      if (!pedidos || pedidos.length === 0) {
        console.log('📭 [BUILDING ACTIVE VIDEOS] Nenhum pedido ativo encontrado para este prédio');
        setVideos([]);
        return;
      }

      // ⚡ OTIMIZAÇÃO 3 (FASE 1): Buscar vídeos com RPC batch (1 query ao invés de N)
      const pedidoIds = pedidos.map(p => p.id);
      
      console.log('⚡ [BUILDING ACTIVE VIDEOS] Buscando vídeos para', pedidoIds.length, 'pedidos via RPC batch');
      const startTime = performance.now();

      // 2. Buscar vídeos atuais para TODOS os pedidos em uma única query
      const { data: currentVideosData, error: batchError } = await supabase
        .rpc('get_current_display_videos_batch', { 
          p_pedido_ids: pedidoIds 
        });

      if (batchError) {
        console.error('❌ [BUILDING ACTIVE VIDEOS] Erro ao buscar vídeos (batch):', batchError);
        setVideos([]);
        return;
      }

      const batchTime = performance.now();
      console.log(`✅ [BUILDING ACTIVE VIDEOS] ${currentVideosData?.length || 0} vídeos carregados via RPC batch em ${(batchTime - startTime).toFixed(0)}ms (OTIMIZADO)`);

      if (!currentVideosData || currentVideosData.length === 0) {
        console.log('📭 [BUILDING ACTIVE VIDEOS] Nenhum vídeo em exibição encontrado');
        setVideos([]);
        return;
      }

      // 3. Extrair todos os IDs necessários
      const videoIds = [...new Set(currentVideosData.map(v => v.video_id).filter(Boolean))];
      const clientIds = [...new Set(pedidos.map(p => p.client_id))];

      // 4. Buscar dados de vídeos e clientes em PARALELO
      // Using users_with_role view for secure role reading
      const [videosData, clientsData, pedidoVideosData] = await Promise.all([
        supabase.from('videos').select('id, nome, url, duracao').in('id', videoIds),
        supabase.from('users_with_role').select('id, email').in('id', clientIds),
        supabase.from('pedido_videos').select('pedido_id, video_id, slot_position').in('pedido_id', pedidoIds)
      ]);

      const parallelTime = performance.now();
      console.log(`✅ [BUILDING ACTIVE VIDEOS] Queries paralelas concluídas em ${(parallelTime - batchTime).toFixed(0)}ms`);

      // 5. Criar maps para lookup O(1)
      const videosMap = new Map(videosData.data?.map(v => [v.id, v]) || []);
      const clientsMap = new Map(clientsData.data?.map(c => [c.id, c]) || []);
      const pedidoVideosMap = new Map(
        pedidoVideosData.data?.map(pv => [`${pv.pedido_id}_${pv.video_id}`, pv]) || []
      );

      // 6. Buscar schedule rules para vídeos agendados
      const scheduledVideoIds = currentVideosData
        .filter(v => v.is_scheduled)
        .map(v => v.video_id);
      
      let scheduleRulesMap = new Map<string, ScheduleRule[]>();
      
      if (scheduledVideoIds.length > 0) {
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
          .in('campaign_video_schedules.video_id', scheduledVideoIds)
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

      // 8. Montar resultado final
      const activeVideos: BuildingActiveVideo[] = [];

      for (const videoInfo of currentVideosData) {
        const pedido = pedidos.find(p => p.id === videoInfo.pedido_id);
        if (!pedido) continue;

        const videoData = videosMap.get(videoInfo.video_id);
        if (!videoData) continue;

        const clientData = clientsMap.get(pedido.client_id);
        const clientEmail = clientData?.email || 'Email não encontrado';
        const clientName = clientEmail.split('@')[0] || 'Cliente';

        const pedidoVideo = pedidoVideosMap.get(`${pedido.id}_${videoInfo.video_id}`);
        const scheduleRules = scheduleRulesMap.get(videoInfo.video_id);

        activeVideos.push({
          video_id: videoInfo.video_id,
          video_name: videoData.nome,
          video_url: videoData.url,
          video_duracao: videoData.duracao || 30,
          pedido_id: pedido.id,
          client_email: clientEmail,
          client_name: clientName,
          valor_total: pedido.valor_total || 0,
          is_scheduled: videoInfo.is_scheduled || false,
          priority_type: (videoInfo.priority_type === 'scheduled' ? 'scheduled' : 'base') as 'scheduled' | 'base',
          slot_position: pedidoVideo?.slot_position || 1,
          schedule_rules: scheduleRules,
          is_currently_active: isVideoActiveNow(videoInfo.video_id, scheduleRules)
        });
      }

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
  }, [buildingId]);

  return {
    videos,
    loading,
    error,
    refetch: fetchActiveVideos
  };
}
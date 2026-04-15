import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { min } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface BuildingInfo {
  id: string;
  nome: string;
  bairro: string;
  endereco: string;
  quantidadeTelas: number;
  publicoEstimado: number;
  codigoPredio: string;
}

export interface VideoInfo {
  id: string;
  nome: string;
  url: string;
  duracao: number;
  approvalStatus: string;
  horasExibidas: number;
  isActive: boolean;
  selectedForDisplay: boolean;
  scheduleInfo: string; // "24/7", "Agendado: Sex 13:00-13:02", "Inativo"
}

export interface VideoTimelinePoint {
  data: string;
  videosAtivos: {
    id: string;
    nome: string;
    horasExibidas: number;
    color: string;
  }[];
}

export interface CampaignReport {
  pedidoId: string;
  nomePedido: string;
  tipoProduto: string;
  clientName: string;
  clientEmail: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  diasAtivos: number;
  diasRestantes: number;
  progress: number;
  videos: VideoInfo[];
  predios: BuildingInfo[];
  totalTelas: number;
  totalExibicoes: number;
  totalHoras: number;
  prediosComExibicaoReal: number;
  isRealData: boolean;
  chartData: {
    videoTimeline: VideoTimelinePoint[];
  };
}

export interface CampaignSummary {
  totalVideosAtivos: number;
  totalVideosExibidos: number;
  totalExibicoes: number;
  totalPrediosAtivos: number;
}

interface ScheduleRule {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  is_active: boolean;
}

// Calcular minutos de exibição por semana baseado nas regras de agendamento
const calculateScheduledMinutesPerWeek = (rules: ScheduleRule[]): number => {
  if (!rules || rules.length === 0) return 0;
  
  let totalMinutesPerWeek = 0;
  
  for (const rule of rules) {
    if (!rule.is_active) continue;
    
    if (rule.is_all_day) {
      // 24 horas * 60 min * dias da semana
      totalMinutesPerWeek += 24 * 60 * (rule.days_of_week?.length || 0);
    } else if (rule.start_time && rule.end_time) {
      // Calcular duração do período
      const [startH, startM] = rule.start_time.split(':').map(Number);
      const [endH, endM] = rule.end_time.split(':').map(Number);
      const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      
      if (durationMinutes > 0) {
        totalMinutesPerWeek += durationMinutes * (rule.days_of_week?.length || 0);
      }
    }
  }
  
  return totalMinutesPerWeek;
};

// Formatar descrição do agendamento
const formatScheduleInfo = (
  isActive: boolean, 
  selectedForDisplay: boolean, 
  rules: ScheduleRule[]
): string => {
  const activeRules = (rules || []).filter(r => r.is_active);
  
  // Se tem regras de agendamento ativas, mostrar o agendamento independente de is_active
  if (activeRules.length > 0) {
    const rule = activeRules[0];
    
    if (rule.is_all_day) {
      const days = rule.days_of_week?.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ');
      return `Agendado: ${days} (dia todo)`;
    }
    
    if (rule.start_time && rule.end_time) {
      const days = rule.days_of_week?.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ');
      return `Agendado: ${days} ${rule.start_time.substring(0, 5)}-${rule.end_time.substring(0, 5)}`;
    }
  }
  
  // Sem regras de agendamento
  if (isActive && selectedForDisplay) {
    return '24/7';
  }
  
  return 'Inativo';
};


export const useVideoReportData = (clientId?: string, dateRange?: DateRange) => {
  const [campaigns, setCampaigns] = useState<CampaignReport[]>([]);
  const [summary, setSummary] = useState<CampaignSummary>({
    totalVideosAtivos: 0,
    totalVideosExibidos: 0,
    totalExibicoes: 0,
    totalPrediosAtivos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📊 [CAMPAIGN REPORT] Iniciando busca de dados para cliente:', clientId);

      // Buscar pedidos ativos do cliente
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['ativo', 'pendente', 'pago_pendente_video']);

      if (pedidosError) throw pedidosError;
      if (!pedidos || pedidos.length === 0) {
        console.log('📊 [CAMPAIGN REPORT] Nenhum pedido encontrado');
        setLoading(false);
        return;
      }

      const pedidoIds = pedidos.map(p => p.id);

      // Buscar vídeos dos pedidos com status
      const { data: pedidoVideos, error: videosError } = await supabase
        .from('pedido_videos')
        .select(`
          *,
          videos (
            id,
            nome,
            url,
            duracao
          )
        `)
        .in('pedido_id', pedidoIds);

      if (videosError) throw videosError;

      // Buscar agendamentos de vídeos
      const videoIds = (pedidoVideos || []).map(pv => pv.video_id).filter(Boolean);
      
      const { data: scheduleData } = await supabase
        .from('campaign_video_schedules')
        .select(`
          video_id,
          campaign_schedule_rules (
            days_of_week,
            start_time,
            end_time,
            is_all_day,
            is_active
          )
        `)
        .in('video_id', videoIds);

      // Mapear agendamentos por video_id
      const schedulesByVideoId = new Map<string, ScheduleRule[]>();
      (scheduleData || []).forEach(schedule => {
        const rules = schedule.campaign_schedule_rules as ScheduleRule[] | null;
        if (rules && rules.length > 0) {
          schedulesByVideoId.set(schedule.video_id, rules);
        }
      });

      // Buscar dados do cliente
      const { data: clientData } = await supabase
        .from('users')
        .select('email')
        .eq('id', clientId)
        .single();

      // Processar dados por PEDIDO (campanha)
      const campaignReports: CampaignReport[] = [];
      const uniqueBuildingsSet = new Set<string>();
      let totalExhibitions = 0;
      let totalVideosAtivos = 0;
      let totalVideosExibidos = 0;

      // Buscar logs reais de playback para todos os vídeos do cliente
      const allVideoIds = (pedidoVideos || []).map(pv => pv.video_id).filter(Boolean);
      const allPedidoIds = pedidos.map(p => p.id);
      
      let playbackLogs: any[] = [];
      if (allVideoIds.length > 0) {
        const { data: logs } = await supabase
          .from('video_playback_logs')
          .select('video_id, building_id, pedido_id, duration_seconds, started_at')
          .in('video_id', allVideoIds)
          .gte('started_at', dateRange?.start?.toISOString() || new Date(0).toISOString())
          .lte('started_at', dateRange?.end?.toISOString() || new Date().toISOString());
        playbackLogs = logs || [];
      }

      for (const pedido of pedidos) {
        const videosFromPedido = (pedidoVideos || []).filter(pv => pv.pedido_id === pedido.id);
        if (videosFromPedido.length === 0) continue;

        const listaPredios = pedido.lista_predios || [];
        
        // Buscar dados dos prédios
        const { data: buildings } = await supabase
          .from('buildings')
          .select('*')
          .in('id', listaPredios);

        const buildingInfos: BuildingInfo[] = (buildings || []).map(b => ({
          id: b.id,
          nome: b.nome,
          bairro: b.bairro,
          endereco: b.endereco,
          quantidadeTelas: b.quantidade_telas || 1,
          publicoEstimado: b.publico_estimado || 100,
          codigoPredio: b.codigo_predio || '',
        }));

        // Cálculos de tempo
        const dataInicio = new Date(pedido.data_inicio);
        const dataFim = new Date(pedido.data_fim);
        const hoje = new Date();
        
        // Data máxima do gráfico (hoje ou data_fim)
        const dataMaxima = min([hoje, dataFim]);
        
        const diasAtivos = Math.max(0, Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
        const diasRestantes = Math.max(0, Math.floor((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));
        const totalDias = Math.floor((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
        const progress = totalDias > 0 ? Math.min(100, (diasAtivos / totalDias) * 100) : 0;

        // Métricas do pedido
        const totalTelas = buildingInfos.reduce((sum, b) => sum + b.quantidadeTelas, 0);

        // ⚡ ESTIMATIVA: Buscar TODOS os vídeos ativos em cada prédio (de todos os pedidos)
        // para calcular o ciclo total de playlist por prédio
        const buildingPlaylistInfo = new Map<string, { totalCycleDuration: number; screenCount: number }>();
        
        for (const building of buildingInfos) {
          // Buscar todos os pedidos ativos que incluem este prédio
          const { data: allPedidosForBuilding } = await supabase
            .from('pedidos')
            .select('id')
            .contains('lista_predios', [building.id])
            .in('status', ['ativo', 'video_aprovado', 'video_enviado'])
            .gte('data_fim', new Date().toISOString().split('T')[0]);

          const allPedidoIdsForBuilding = (allPedidosForBuilding || []).map(p => p.id);

          if (allPedidoIdsForBuilding.length > 0) {
            // Buscar todos os vídeos aprovados neste prédio (ativos OU com agendamento)
            const { data: allActiveVideos } = await supabase
              .from('pedido_videos')
              .select('video_id, is_active, selected_for_display, videos(duracao)')
              .in('pedido_id', allPedidoIdsForBuilding)
              .eq('approval_status', 'approved');

            // Filtrar: apenas vídeos ativos+selecionados OU com agendamento ativo
            const relevantVideos = (allActiveVideos || []).filter(v => {
              const isActiveAndSelected = v.is_active && v.selected_for_display;
              const hasSchedule = schedulesByVideoId.has(v.video_id) && 
                (schedulesByVideoId.get(v.video_id) || []).some(r => r.is_active);
              return isActiveAndSelected || hasSchedule;
            });

            const totalCycleDuration = relevantVideos.reduce(
              (sum, v) => sum + ((v.videos as any)?.duracao || 10), 0
            );

            buildingPlaylistInfo.set(building.id, {
              totalCycleDuration: Math.max(totalCycleDuration, 1), // evitar divisão por zero
              screenCount: building.quantidadeTelas,
            });
          } else {
            buildingPlaylistInfo.set(building.id, { totalCycleDuration: 1, screenCount: building.quantidadeTelas });
          }
        }

        // Processar vídeos com cálculo ESTIMADO de horas
        const videoInfos: VideoInfo[] = videosFromPedido.map(pv => {
          const duracaoSegundos = pv.videos?.duracao || 10;
          const isActive = pv.is_active ?? true;
          const selectedForDisplay = pv.selected_for_display ?? true;
          const approvalStatus = pv.approval_status || 'pending';
          const scheduleRules = schedulesByVideoId.get(pv.video_id) || [];

          // Tentar usar dados reais de playback para este vídeo
          const videoLogs = playbackLogs.filter(l => l.video_id === pv.video_id);
          let horasExibidas: number;

          const hasActiveSchedule = scheduleRules.some(r => r.is_active);
          const isShowingOrScheduled = (isActive && selectedForDisplay) || hasActiveSchedule;

          if (videoLogs.length > 0) {
            // Dados reais: somar duração registrada
            horasExibidas = videoLogs.reduce((sum: number, l: any) => sum + (Number(l.duration_seconds) || 0), 0) / 3600;
          } else if (isShowingOrScheduled && approvalStatus === 'approved') {
            // ⚡ ESTIMATIVA: Calcular baseado no status do sistema
            const approvedAt = pv.approved_at ? new Date(pv.approved_at) : dataInicio;
            const effectiveStart = new Date(Math.max(approvedAt.getTime(), dataInicio.getTime()));
            const effectiveEnd = dateRange?.end ? new Date(Math.min(hoje.getTime(), dateRange.end.getTime())) : hoje;
            const activeSeconds = Math.max(0, (effectiveEnd.getTime() - effectiveStart.getTime()) / 1000);

            // Fator de agendamento (se tem regras, reduz proporcionalmente)
            let scheduleFactor = 1; // 24/7 por padrão
            const activeRules = scheduleRules.filter(r => r.is_active);
            if (activeRules.length > 0) {
              const scheduledMinutesPerWeek = calculateScheduledMinutesPerWeek(activeRules);
              const totalMinutesPerWeek = 7 * 24 * 60; // 10080
              scheduleFactor = scheduledMinutesPerWeek / totalMinutesPerWeek;
            }

            // Somar horas estimadas de todos os prédios onde o vídeo roda
            let totalEstimatedHours = 0;
            for (const building of buildingInfos) {
              const playlistInfo = buildingPlaylistInfo.get(building.id);
              if (!playlistInfo) continue;

              const shareOfRotation = duracaoSegundos / playlistInfo.totalCycleDuration;
              const estimatedHours = (activeSeconds / 3600) * shareOfRotation * playlistInfo.screenCount * scheduleFactor;
              totalEstimatedHours += estimatedHours;
            }

            horasExibidas = totalEstimatedHours;
          } else {
            horasExibidas = 0;
          }

          const scheduleInfo = formatScheduleInfo(isActive, selectedForDisplay, scheduleRules);

          return {
            id: pv.videos?.id || pv.video_id,
            nome: pv.videos?.nome || 'Vídeo sem título',
            url: pv.videos?.url || '',
            duracao: duracaoSegundos,
            approvalStatus,
            horasExibidas,
            isActive,
            selectedForDisplay,
            scheduleInfo,
          };
        });

        // Gerar timeline de vídeos com HORAS ACUMULADAS
        const videoTimeline: VideoTimelinePoint[] = [];
        const videoColors = ['#9C1E1E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
        let colorIndex = 0;
        const videoColorMap = new Map<string, string>();
        
        // Mapa para acumular horas progressivamente por vídeo
        const acumuladoPorVideo = new Map<string, number>();
        
        // Calcular horas por dia para cada vídeo
        const horasPorDiaPorVideo = new Map<string, number>();
        videoInfos.forEach(video => {
          if (!video.isActive || !video.selectedForDisplay || video.approvalStatus !== 'approved') {
            horasPorDiaPorVideo.set(video.id, 0);
          } else {
            const diasParaCalculo = Math.max(1, diasAtivos);
            horasPorDiaPorVideo.set(video.id, video.horasExibidas / diasParaCalculo);
          }
          acumuladoPorVideo.set(video.id, 0);
        });
        
        for (let date = new Date(dataInicio); date <= dataMaxima; date.setDate(date.getDate() + 1)) {
          const dateStr = date.toISOString().split('T')[0];
          
          const videosAtivos = videoInfos.map(video => {
            if (!videoColorMap.has(video.id)) {
              videoColorMap.set(video.id, videoColors[colorIndex % videoColors.length]);
              colorIndex++;
            }
            
            const horasDia = horasPorDiaPorVideo.get(video.id) || 0;
            const acumuladoAnterior = acumuladoPorVideo.get(video.id) || 0;
            const novoAcumulado = acumuladoAnterior + horasDia;
            acumuladoPorVideo.set(video.id, novoAcumulado);
            
            return {
              id: video.id,
              nome: video.nome,
              horasExibidas: novoAcumulado,
              color: videoColorMap.get(video.id)!,
            };
          });
          
          videoTimeline.push({
            data: dateStr,
            videosAtivos,
          });
        }

        // Buscar dados REAIS de playback para este pedido
        const pedidoLogs = playbackLogs.filter(l => 
          videosFromPedido.some(pv => pv.video_id === l.video_id)
        );
        const hasRealData = pedidoLogs.length > 0;

        // Métricas reais ou estimadas
        let totalExibicoesCalc: number;
        let totalHorasCalc: number;
        let prediosComExibicaoReal = 0;

        if (hasRealData) {
          totalExibicoesCalc = pedidoLogs.length;
          totalHorasCalc = pedidoLogs.reduce((sum: number, l: any) => sum + (Number(l.duration_seconds) || 0), 0) / 3600;
          const uniqueBuildings = new Set(pedidoLogs.map((l: any) => l.building_id));
          prediosComExibicaoReal = uniqueBuildings.size;
        } else {
          // ⚡ ESTIMATIVA: Calcular total de exibições estimadas
          totalHorasCalc = videoInfos.reduce((sum, v) => sum + v.horasExibidas, 0);
          
          // Calcular exibições estimadas: para cada prédio, quantas vezes o ciclo completo rodou
          let estimatedExhibitions = 0;
          for (const video of videoInfos) {
            if (!video.isActive || !video.selectedForDisplay || video.approvalStatus !== 'approved') continue;
            
            const pv = videosFromPedido.find(p => (p.videos?.id || p.video_id) === video.id);
            const approvedAt = pv?.approved_at ? new Date(pv.approved_at) : dataInicio;
            const effectiveStart = new Date(Math.max(approvedAt.getTime(), dataInicio.getTime()));
            const activeSeconds = Math.max(0, (hoje.getTime() - effectiveStart.getTime()) / 1000);

            // Fator de agendamento
            const scheduleRules = schedulesByVideoId.get(video.id) || [];
            const activeRules = scheduleRules.filter(r => r.is_active);
            let scheduleFactor = 1;
            if (activeRules.length > 0) {
              const scheduledMinutesPerWeek = calculateScheduledMinutesPerWeek(activeRules);
              scheduleFactor = scheduledMinutesPerWeek / (7 * 24 * 60);
            }

            for (const building of buildingInfos) {
              const playlistInfo = buildingPlaylistInfo.get(building.id);
              if (!playlistInfo || playlistInfo.totalCycleDuration <= 0) continue;
              
              const exhibitions = Math.floor((activeSeconds * scheduleFactor) / playlistInfo.totalCycleDuration) * playlistInfo.screenCount;
              estimatedExhibitions += exhibitions;
            }
          }
          
          totalExibicoesCalc = estimatedExhibitions;
          prediosComExibicaoReal = buildingInfos.length; // todos os prédios contam na estimativa
        }

        buildingInfos.forEach(b => uniqueBuildingsSet.add(b.id));
        totalExhibitions += totalExibicoesCalc;
        totalVideosAtivos += videoInfos.filter(v => v.isActive && v.selectedForDisplay && v.approvalStatus === 'approved').length;
        totalVideosExibidos += videoInfos.length;

        campaignReports.push({
          pedidoId: pedido.id,
          nomePedido: (pedido as any).nome_pedido || `Pedido #${pedido.id.substring(0, 8)}`,
          tipoProduto: (pedido as any).tipo_produto || 'horizontal',
          clientName: clientData?.email?.split('@')[0] || 'Cliente',
          clientEmail: clientData?.email || 'Email não encontrado',
          dataInicio: pedido.data_inicio,
          dataFim: pedido.data_fim,
          status: pedido.status,
          diasAtivos,
          diasRestantes,
          progress,
          videos: videoInfos,
          predios: buildingInfos,
          totalTelas,
          totalExibicoes: totalExibicoesCalc,
          totalHoras: totalHorasCalc,
          prediosComExibicaoReal,
          isRealData: hasRealData,
          chartData: {
            videoTimeline,
          },
        });
      }

      setCampaigns(campaignReports);
      setSummary({
        totalVideosAtivos,
        totalVideosExibidos,
        totalExibicoes: totalExhibitions,
        totalPrediosAtivos: uniqueBuildingsSet.size,
      });

      console.log('✅ [CAMPAIGN REPORT] Processadas', campaignReports.length, 'campanhas');

    } catch (error: any) {
      console.error('💥 [CAMPAIGN REPORT] Erro:', error);
      setError(error.message || 'Erro ao carregar relatório de campanhas');
      toast.error('Erro ao carregar relatório de campanhas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchData();
    }

    // Real-time subscriptions
    const channel = supabase
      .channel('campaign-report-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedido_videos' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, dateRange]);

  return { campaigns, summary, loading, error, refetch: fetchData };
};

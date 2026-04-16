import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  visualizacoesMes: number;
}

export interface VideoInfo {
  id: string;
  nome: string;
  url: string;
  duracao: number;
  approvalStatus: string;
  horasExibidas: number;
  exibicoes: number;
  isActive: boolean;
  selectedForDisplay: boolean;
  scheduleInfo: string;
}

export interface VideoTimelinePoint {
  data: string;
  videosAtivos: {
    id: string;
    nome: string;
    horasExibidas: number;
    exibicoes: number;
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
  filteredStartDate: string;
  filteredEndDate: string;
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

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Fraction of a day (0-1) covered by a set of schedule rules for a given dayOfWeek */
const scheduleCoverageForDay = (rules: ScheduleRule[], dayOfWeek: number): number => {
  const activeRules = (rules || []).filter(r => r.is_active);
  if (activeRules.length === 0) return 0;

  let coveredMinutes = 0;
  for (const rule of activeRules) {
    if (!(rule.days_of_week || []).includes(dayOfWeek)) continue;
    if (rule.is_all_day) return 1; // full day
    if (rule.start_time && rule.end_time) {
      const [sh, sm] = rule.start_time.split(':').map(Number);
      const [eh, em] = rule.end_time.split(':').map(Number);
      coveredMinutes += Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }
  }
  return Math.min(1, coveredMinutes / 1440);
};

/** Format schedule info label */
const formatScheduleInfo = (
  isActive: boolean,
  selectedForDisplay: boolean,
  rules: ScheduleRule[],
  allPedidoRules?: { videoId: string; rules: ScheduleRule[] }[]
): string => {
  const activeRules = (rules || []).filter(r => r.is_active);

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

  if (isActive && selectedForDisplay) {
    if (allPedidoRules && allPedidoRules.length > 0) {
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const daysWithAllDaySchedule = new Set<number>();
      for (const vr of allPedidoRules) {
        for (const rule of vr.rules) {
          if (!rule.is_active) continue;
          if (rule.is_all_day) rule.days_of_week.forEach(d => daysWithAllDaySchedule.add(d));
        }
      }
      const fallbackDays: number[] = [];
      for (let d = 0; d < 7; d++) {
        if (!daysWithAllDaySchedule.has(d)) fallbackDays.push(d);
      }
      if (fallbackDays.length === 7) return '24/7';
      if (fallbackDays.length === 0) return 'Inativo';
      return `Base: ${fallbackDays.map(d => dayNames[d]).join(', ')}`;
    }
    return '24/7';
  }

  return 'Inativo';
};

// ─── Main hook ──────────────────────────────────────────────────────────────

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
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📊 [CAMPAIGN REPORT] Iniciando busca para cliente:', clientId);

      // 1) Fetch active orders
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

      // 2) Fetch videos
      const { data: pedidoVideos, error: videosError } = await supabase
        .from('pedido_videos')
        .select(`*, videos (id, nome, url, duracao)`)
        .in('pedido_id', pedidoIds);
      if (videosError) throw videosError;

      // 3) Fetch schedules
      const videoIds = (pedidoVideos || []).map(pv => pv.video_id).filter(Boolean);
      const { data: scheduleData } = await supabase
        .from('campaign_video_schedules')
        .select(`video_id, campaign_schedule_rules (days_of_week, start_time, end_time, is_all_day, is_active)`)
        .in('video_id', videoIds);

      const schedulesByVideoId = new Map<string, ScheduleRule[]>();
      (scheduleData || []).forEach(s => {
        const rules = s.campaign_schedule_rules as ScheduleRule[] | null;
        if (rules && rules.length > 0) schedulesByVideoId.set(s.video_id, rules);
      });

      // 4) Fetch exhibition config (for fallback calculation)
      const { data: configData } = await supabase
        .from('configuracoes_exibicao')
        .select('horas_operacao_dia, dias_mes')
        .limit(1)
        .single();

      const horasOperacaoDia = configData?.horas_operacao_dia || 18;
      const diasMes = configData?.dias_mes || 30;

      // 5) Fetch product info to get duracao_video_segundos and max_clientes_por_painel
      const { data: produtos } = await supabase
        .from('produtos_exa')
        .select('codigo, duracao_video_segundos, max_clientes_por_painel')
        .eq('ativo', true);

      const produtoMap = new Map<string, { duracao: number; maxClientes: number }>();
      (produtos || []).forEach(p => {
        produtoMap.set(p.codigo, {
          duracao: p.duracao_video_segundos || 10,
          maxClientes: p.max_clientes_por_painel || 10,
        });
      });

      // 6) Client info
      const { data: clientData } = await supabase
        .from('users')
        .select('email')
        .eq('id', clientId)
        .single();

      // ─── Process each order ───────────────────────────────────────────
      const campaignReports: CampaignReport[] = [];
      const uniqueBuildingsSet = new Set<string>();
      let totalExhibitions = 0;
      let totalVideosAtivos = 0;
      let totalVideosExibidos = 0;

      for (const pedido of pedidos) {
        const videosFromPedido = (pedidoVideos || []).filter(pv => pv.pedido_id === pedido.id);
        if (videosFromPedido.length === 0) continue;

        const listaPredios = pedido.lista_predios || [];
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
          visualizacoesMes: b.visualizacoes_mes || 0,
        }));

        // Time calculations — include TODAY
        const dataInicio = new Date(pedido.data_inicio);
        const dataFim = new Date(pedido.data_fim);
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);

        const dataMaxima = new Date(Math.min(hoje.getTime(), dataFim.getTime()));

        const filteredStart = dateRange?.start
          ? new Date(Math.max(dataInicio.getTime(), dateRange.start.getTime()))
          : dataInicio;
        const filteredEnd = dateRange?.end
          ? new Date(Math.min(dataMaxima.getTime(), dateRange.end.getTime()))
          : dataMaxima;

        const diasAtivos = Math.max(1, Math.floor((filteredEnd.getTime() - filteredStart.getTime()) / (1000 * 60 * 60 * 24)));
        const diasRestantes = Math.max(0, Math.floor((dataFim.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        const totalDias = Math.max(1, Math.floor((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
        const progress = Math.min(100, (diasAtivos / totalDias) * 100);

        const totalTelas = buildingInfos.reduce((sum, b) => sum + b.quantidadeTelas, 0);

        // ─── Determine product type for this order ──────────────────────
        const tipoProduto: string = (pedido as any).tipo_produto || 'horizontal';
        const produtoCodigo = tipoProduto.toLowerCase().includes('vertical') ? 'vertical_premium' : 'horizontal';
        const produto = produtoMap.get(produtoCodigo) || { duracao: 10, maxClientes: 10 };

        // ─── Calculate daily exhibitions per building (operational) ─────
        // Formula: exhibitions_per_day_per_screen = (horas_operacao * 3600) / (duracao_video * max_clientes)
        // This is the number of times ONE video plays per day on ONE screen
        const exibicoesPorDiaPorTela = Math.floor(
          (horasOperacaoDia * 3600) / (produto.duracao * produto.maxClientes)
        );

        // ─── Determine which videos are "eligible" (approved + active or scheduled) ──
        const eligibleVideos: {
          videoId: string;
          nome: string;
          duracao: number;
          isBase: boolean;
          rules: ScheduleRule[];
          approvalStatus: string;
          isActive: boolean;
          selectedForDisplay: boolean;
        }[] = [];

        for (const pv of videosFromPedido) {
          const rules = schedulesByVideoId.get(pv.video_id) || [];
          const activeRules = rules.filter(r => r.is_active);
          const isBase = (pv.is_active && pv.selected_for_display && activeRules.length === 0);

          eligibleVideos.push({
            videoId: pv.videos?.id || pv.video_id,
            nome: pv.videos?.nome || 'Vídeo sem título',
            duracao: pv.videos?.duracao || 10,
            isBase,
            rules,
            approvalStatus: pv.approval_status || 'pending',
            isActive: pv.is_active ?? true,
            selectedForDisplay: pv.selected_for_display ?? true,
          });
        }

        // ─── Calculate coverage per video per day-of-week ──────────────
        // coverageMap: videoId -> dayOfWeek -> fraction (0-1)
        const coverageMap = new Map<string, Map<number, number>>();

        // First pass: scheduled videos
        for (const v of eligibleVideos) {
          if (v.approvalStatus !== 'approved') continue;
          const activeRules = v.rules.filter(r => r.is_active);
          if (activeRules.length === 0) continue;

          const dayMap = new Map<number, number>();
          for (let d = 0; d < 7; d++) {
            dayMap.set(d, scheduleCoverageForDay(activeRules, d));
          }
          coverageMap.set(v.videoId, dayMap);
        }

        // Second pass: base video gets remaining coverage
        const baseVideo = eligibleVideos.find(v =>
          v.approvalStatus === 'approved' &&
          v.isActive &&
          v.selectedForDisplay &&
          v.rules.filter(r => r.is_active).length === 0
        );

        if (baseVideo) {
          const baseDayMap = new Map<number, number>();
          for (let d = 0; d < 7; d++) {
            let scheduledFraction = 0;
            for (const [, dayMap] of coverageMap) {
              scheduledFraction += dayMap.get(d) || 0;
            }
            baseDayMap.set(d, Math.max(0, 1 - scheduledFraction));
          }
          coverageMap.set(baseVideo.videoId, baseDayMap);
        }

        // ─── Calculate exhibitions per video across filtered period ─────
        const videoExhibitions = new Map<string, number>();
        const videoHours = new Map<string, number>();

        // Also for timeline (day-by-day)
        const videoTimeline: VideoTimelinePoint[] = [];
        const videoColors = ['#9C1E1E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
        let colorIndex = 0;
        const videoColorMap = new Map<string, string>();

        for (let date = new Date(filteredStart); date <= filteredEnd; date.setDate(date.getDate() + 1)) {
          const dateStr = date.toISOString().split('T')[0];
          const dayOfWeek = date.getDay();

          const dayVideoPoints: VideoTimelinePoint['videosAtivos'] = [];

          for (const v of eligibleVideos) {
            if (!videoColorMap.has(v.videoId)) {
              videoColorMap.set(v.videoId, videoColors[colorIndex % videoColors.length]);
              colorIndex++;
            }

            const coverage = coverageMap.get(v.videoId)?.get(dayOfWeek) || 0;
            if (coverage <= 0 && v.approvalStatus !== 'approved') continue;

            // Exhibitions for this video on this day = exibicoesPorDiaPorTela * coverage * totalTelas
            const dayExibicoes = Math.round(exibicoesPorDiaPorTela * coverage * totalTelas);
            const dayHoras = (dayExibicoes * v.duracao) / 3600;

            videoExhibitions.set(v.videoId, (videoExhibitions.get(v.videoId) || 0) + dayExibicoes);
            videoHours.set(v.videoId, (videoHours.get(v.videoId) || 0) + dayHoras);

            dayVideoPoints.push({
              id: v.videoId,
              nome: v.nome,
              horasExibidas: dayHoras,
              exibicoes: dayExibicoes,
              color: videoColorMap.get(v.videoId)!,
            });
          }

          videoTimeline.push({ data: dateStr, videosAtivos: dayVideoPoints });
        }

        // ─── Build VideoInfo array ──────────────────────────────────────
        const videoInfos: VideoInfo[] = videosFromPedido.map(pv => {
          const videoId = pv.videos?.id || pv.video_id;
          const rules = schedulesByVideoId.get(pv.video_id) || [];
          const isActive = pv.is_active ?? true;
          const selectedForDisplay = pv.selected_for_display ?? true;
          const approvalStatus = pv.approval_status || 'pending';

          const allPedidoRules = videosFromPedido
            .filter(other => other.video_id !== pv.video_id)
            .map(other => ({ videoId: other.video_id, rules: schedulesByVideoId.get(other.video_id) || [] }))
            .filter(vr => vr.rules.length > 0);

          const scheduleInfo = formatScheduleInfo(isActive, selectedForDisplay, rules, allPedidoRules);

          return {
            id: videoId,
            nome: pv.videos?.nome || 'Vídeo sem título',
            url: pv.videos?.url || '',
            duracao: pv.videos?.duracao || 10,
            approvalStatus,
            horasExibidas: videoHours.get(videoId) || 0,
            exibicoes: videoExhibitions.get(videoId) || 0,
            isActive,
            selectedForDisplay,
            scheduleInfo,
          };
        });

        // ─── Totals ─────────────────────────────────────────────────────
        const totalExibicoesCalc = videoInfos.reduce((sum, v) => sum + v.exibicoes, 0);
        const totalHorasCalc = videoInfos.reduce((sum, v) => sum + v.horasExibidas, 0);

        buildingInfos.forEach(b => uniqueBuildingsSet.add(b.id));
        totalExhibitions += totalExibicoesCalc;
        totalVideosAtivos += videoInfos.filter(v => {
          const vRules = schedulesByVideoId.get(v.id) || [];
          const vHasSchedule = vRules.some(r => r.is_active);
          return ((v.isActive && v.selectedForDisplay) || vHasSchedule) && v.approvalStatus === 'approved';
        }).length;
        totalVideosExibidos += videoInfos.length;

        campaignReports.push({
          pedidoId: pedido.id,
          nomePedido: (pedido as any).nome_pedido || `Pedido #${pedido.id.substring(0, 8)}`,
          tipoProduto,
          clientName: clientData?.email?.split('@')[0] || 'Cliente',
          clientEmail: clientData?.email || 'Email não encontrado',
          dataInicio: pedido.data_inicio,
          dataFim: pedido.data_fim,
          filteredStartDate: filteredStart.toISOString(),
          filteredEndDate: filteredEnd.toISOString(),
          status: pedido.status,
          diasAtivos,
          diasRestantes,
          progress,
          videos: videoInfos,
          predios: buildingInfos,
          totalTelas,
          totalExibicoes: totalExibicoesCalc,
          totalHoras: totalHorasCalc,
          prediosComExibicaoReal: buildingInfos.length,
          isRealData: true, // always true now — operational data
          chartData: { videoTimeline },
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
    if (clientId) fetchData();

    // Real-time subscriptions
    const channel = supabase
      .channel('campaign-report-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_videos' }, () => fetchData())
      .subscribe();

    // Refresh every 60s to keep numbers climbing
    refreshTimerRef.current = setInterval(fetchData, 60_000);

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [clientId, dateRange]);

  return { campaigns, summary, loading, error, refetch: fetchData };
};

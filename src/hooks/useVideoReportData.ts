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
  rules: ScheduleRule[],
  allPedidoRules?: { videoId: string; rules: ScheduleRule[] }[]
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
  
  // Sem regras de agendamento — é vídeo base (fallback)
  if (isActive && selectedForDisplay) {
    // Calcular dias de fallback baseado nos agendamentos de outros vídeos do mesmo pedido
    if (allPedidoRules && allPedidoRules.length > 0) {
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const daysWithAllDaySchedule = new Set<number>();
      
      for (const vr of allPedidoRules) {
        for (const rule of vr.rules) {
          if (!rule.is_active) continue;
          if (rule.is_all_day) {
            rule.days_of_week.forEach(d => daysWithAllDaySchedule.add(d));
          }
        }
      }
      
      // Dias livres (sem cobertura dia todo) = dias do fallback
      const fallbackDays: number[] = [];
      for (let d = 0; d < 7; d++) {
        if (!daysWithAllDaySchedule.has(d)) {
          fallbackDays.push(d);
        }
      }
      
      if (fallbackDays.length === 7) {
        return '24/7';
      }
      if (fallbackDays.length === 0) {
        return 'Inativo';
      }
      return `Base: ${fallbackDays.map(d => dayNames[d]).join(', ')}`;
    }
    
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
        
        // Clampar ao dateRange para métricas filtradas
        const filteredStart = dateRange?.start 
          ? new Date(Math.max(dataInicio.getTime(), dateRange.start.getTime()))
          : dataInicio;
        const filteredEnd = dateRange?.end 
          ? new Date(Math.min(dataMaxima.getTime(), dateRange.end.getTime()))
          : dataMaxima;
        
        const diasAtivos = Math.max(1, Math.floor((filteredEnd.getTime() - filteredStart.getTime()) / (1000 * 60 * 60 * 24)));
        const diasRestantes = Math.max(0, Math.floor((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));
        const totalDias = Math.floor((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
        const progress = totalDias > 0 ? Math.min(100, (diasAtivos / totalDias) * 100) : 0;

        // Métricas do pedido
        const totalTelas = buildingInfos.reduce((sum, b) => sum + b.quantidadeTelas, 0);

        // ⚡ ESTIMATIVA: Buscar TODOS os vídeos aprovados em cada prédio para calcular composição diária
        // Estrutura: buildingId -> dayOfWeek -> { videos com duração, totalCycleDuration }
        const buildingDailyPlaylist = new Map<string, Map<number, { videos: { videoId: string; duracao: number }[]; totalCycle: number }>>();
        
        for (const building of buildingInfos) {
          const { data: allPedidosForBuilding } = await supabase
            .from('pedidos')
            .select('id')
            .contains('lista_predios', [building.id])
            .in('status', ['ativo', 'video_aprovado', 'video_enviado'])
            .gte('data_fim', new Date().toISOString().split('T')[0]);

          const allPedidoIdsForBuilding = (allPedidosForBuilding || []).map(p => p.id);

          // Inicializar 7 dias da semana
          const dailyMap = new Map<number, { videos: { videoId: string; duracao: number }[]; totalCycle: number }>();
          for (let day = 0; day < 7; day++) {
            dailyMap.set(day, { videos: [], totalCycle: 0 });
          }

          if (allPedidoIdsForBuilding.length > 0) {
            const { data: allActiveVideos } = await supabase
              .from('pedido_videos')
              .select('video_id, is_active, selected_for_display, videos(duracao)')
              .in('pedido_id', allPedidoIdsForBuilding)
              .eq('approval_status', 'approved');

            for (const v of (allActiveVideos || [])) {
              const dur = (v.videos as any)?.duracao || 10;
              const isActiveAndSelected = v.is_active && v.selected_for_display;
              const vRules = schedulesByVideoId.get(v.video_id) || [];
              const activeVRules = vRules.filter(r => r.is_active);
              const hasSchedule = activeVRules.length > 0;

              if (!isActiveAndSelected && !hasSchedule) continue;

              if (hasSchedule) {
                // Adicionar vídeo apenas nos dias agendados
                const scheduledDays = new Set<number>();
                for (const rule of activeVRules) {
                  for (const d of (rule.days_of_week || [])) {
                    scheduledDays.add(d);
                  }
                }
                for (const day of scheduledDays) {
                  const dayData = dailyMap.get(day)!;
                  dayData.videos.push({ videoId: v.video_id, duracao: dur });
                  dayData.totalCycle += dur;
                }
              } else if (isActiveAndSelected) {
                // 24/7 — adicionar em todos os dias
                for (let day = 0; day < 7; day++) {
                  const dayData = dailyMap.get(day)!;
                  dayData.videos.push({ videoId: v.video_id, duracao: dur });
                  dayData.totalCycle += dur;
                }
              }
            }
          }

          buildingDailyPlaylist.set(building.id, dailyMap);
        }

        // Processar vídeos com cálculo ESTIMADO de horas POR DIA DA SEMANA
        const videoInfos: VideoInfo[] = videosFromPedido.map(pv => {
          const duracaoSegundos = pv.videos?.duracao || 10;
          const isActive = pv.is_active ?? true;
          const selectedForDisplay = pv.selected_for_display ?? true;
          const approvalStatus = pv.approval_status || 'pending';
          const scheduleRules = schedulesByVideoId.get(pv.video_id) || [];

          const videoLogs = playbackLogs.filter(l => l.video_id === pv.video_id);
          let horasExibidas: number;

          const hasActiveSchedule = scheduleRules.some(r => r.is_active);
          const isShowingOrScheduled = (isActive && selectedForDisplay) || hasActiveSchedule;

          if (videoLogs.length > 0) {
            horasExibidas = videoLogs.reduce((sum: number, l: any) => sum + (Number(l.duration_seconds) || 0), 0) / 3600;
          } else if (isShowingOrScheduled && approvalStatus === 'approved') {
            const approvedAt = pv.approved_at ? new Date(pv.approved_at) : dataInicio;
            const effectiveStart = new Date(Math.max(
              approvedAt.getTime(), 
              dataInicio.getTime(),
              dateRange?.start ? dateRange.start.getTime() : 0
            ));
            const effectiveEnd = new Date(Math.min(
              hoje.getTime(), 
              dataFim.getTime(),
              dateRange?.end ? dateRange.end.getTime() : hoje.getTime()
            ));
            const totalActiveMs = Math.max(0, effectiveEnd.getTime() - effectiveStart.getTime());
            const totalWeeks = totalActiveMs / (7 * 24 * 60 * 60 * 1000);

            // Calcular horas por semana somando contribuição de cada dia
            let hoursPerWeek = 0;
            const activeRules = scheduleRules.filter(r => r.is_active);

            for (const building of buildingInfos) {
              const dailyMap = buildingDailyPlaylist.get(building.id);
              if (!dailyMap) continue;
              const screens = building.quantidadeTelas;

              for (let day = 0; day < 7; day++) {
                const dayData = dailyMap.get(day)!;
                if (dayData.totalCycle <= 0) continue;
                
                // Verificar se este vídeo roda neste dia
                const isInDay = dayData.videos.some(v => v.videoId === pv.video_id);
                if (!isInDay) continue;

                const shareOfRotation = duracaoSegundos / dayData.totalCycle;

                // Horas de exibição neste dia
                let hoursThisDay = 24; // padrão 24/7
                if (activeRules.length > 0) {
                  // Calcular horas agendadas para este dia específico
                  let minutesThisDay = 0;
                  for (const rule of activeRules) {
                    if (!(rule.days_of_week || []).includes(day)) continue;
                    if (rule.is_all_day) {
                      minutesThisDay += 24 * 60;
                    } else if (rule.start_time && rule.end_time) {
                      const [sh, sm] = rule.start_time.split(':').map(Number);
                      const [eh, em] = rule.end_time.split(':').map(Number);
                      minutesThisDay += Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
                    }
                  }
                  hoursThisDay = minutesThisDay / 60;
                }

                hoursPerWeek += hoursThisDay * shareOfRotation * screens;
              }
            }

            horasExibidas = hoursPerWeek * totalWeeks;
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
          const videoScheduleRules = schedulesByVideoId.get(video.id) || [];
          const hasActiveSchedule = videoScheduleRules.some(r => r.is_active);
          const isShowingOrScheduled = (video.isActive && video.selectedForDisplay) || hasActiveSchedule;
          
          if (!isShowingOrScheduled || video.approvalStatus !== 'approved') {
            horasPorDiaPorVideo.set(video.id, 0);
          } else {
            const diasParaCalculo = Math.max(1, diasAtivos);
            horasPorDiaPorVideo.set(video.id, video.horasExibidas / diasParaCalculo);
          }
          acumuladoPorVideo.set(video.id, 0);
        });
        
        // Iterar apenas no período filtrado
        const timelineStart = dateRange?.start 
          ? new Date(Math.max(dataInicio.getTime(), dateRange.start.getTime()))
          : dataInicio;
        const timelineEnd = dateRange?.end 
          ? new Date(Math.min(dataMaxima.getTime(), dateRange.end.getTime()))
          : dataMaxima;
        
        for (let date = new Date(timelineStart); date <= timelineEnd; date.setDate(date.getDate() + 1)) {
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
            const videoSchedRules = schedulesByVideoId.get(video.id) || [];
            const hasActiveScheduleForVideo = videoSchedRules.some(r => r.is_active);
            const isShowingOrScheduledForVideo = (video.isActive && video.selectedForDisplay) || hasActiveScheduleForVideo;
            if (!isShowingOrScheduledForVideo || video.approvalStatus !== 'approved') continue;
            
            const pv = videosFromPedido.find(p => (p.videos?.id || p.video_id) === video.id);
            const approvedAt = pv?.approved_at ? new Date(pv.approved_at) : dataInicio;
            const effectiveStartExh = new Date(Math.max(
              approvedAt.getTime(), 
              dataInicio.getTime(),
              dateRange?.start ? dateRange.start.getTime() : 0
            ));
            const effectiveEndExh = new Date(Math.min(
              hoje.getTime(),
              dataFim.getTime(),
              dateRange?.end ? dateRange.end.getTime() : hoje.getTime()
            ));
            const activeSeconds = Math.max(0, (effectiveEndExh.getTime() - effectiveStartExh.getTime()) / 1000);

            const activeRulesForExh = videoSchedRules.filter(r => r.is_active);
            let scheduleFactor = 1;
            if (activeRulesForExh.length > 0) {
              const scheduledMinutesPerWeek = calculateScheduledMinutesPerWeek(activeRulesForExh);
              scheduleFactor = scheduledMinutesPerWeek / (7 * 24 * 60);
            }

            for (const building of buildingInfos) {
              const dailyMap = buildingDailyPlaylist.get(building.id);
              if (!dailyMap) continue;
              
              // Calcular ciclo médio ponderado por dia
              let totalCycleWeighted = 0;
              let daysActive = 0;
              for (let day = 0; day < 7; day++) {
                const dayData = dailyMap.get(day)!;
                const isInDay = dayData.videos.some(v => v.videoId === video.id);
                if (isInDay && dayData.totalCycle > 0) {
                  totalCycleWeighted += dayData.totalCycle;
                  daysActive++;
                }
              }
              if (daysActive === 0) continue;
              const avgCycle = totalCycleWeighted / daysActive;
              
              const exhibitions = Math.floor((activeSeconds * scheduleFactor) / avgCycle) * building.quantidadeTelas;
              estimatedExhibitions += exhibitions;
            }
          }
          
          totalExibicoesCalc = estimatedExhibitions;
          prediosComExibicaoReal = buildingInfos.length; // todos os prédios contam na estimativa
        }

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

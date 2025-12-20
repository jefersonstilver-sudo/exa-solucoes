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

      // Buscar vídeos dos pedidos
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

        // Processar vídeos com cálculo de horas (multiplicando pelos dias ativos)
        const diasAtivosParaCalculo = Math.max(1, diasAtivos);
        const videoInfos: VideoInfo[] = videosFromPedido.map(pv => {
          const duracaoSegundos = pv.videos?.duracao || 30;
          // Exibições estimadas = telas × 245 exibições/dia × dias ativos
          const exibicoesPorDia = totalTelas * 245;
          const exibicoesTotais = exibicoesPorDia * diasAtivosParaCalculo;
          // Horas = (exibições totais × duração em segundos) / 3600
          const horasExibidas = (exibicoesTotais * duracaoSegundos) / 3600;

          return {
            id: pv.videos?.id || pv.video_id,
            nome: pv.videos?.nome || 'Vídeo sem título',
            url: pv.videos?.url || '',
            duracao: duracaoSegundos,
            approvalStatus: pv.approval_status || 'pending',
            horasExibidas: horasExibidas,
          };
        });

        // Gerar timeline de vídeos com HORAS (até hoje ou data_fim)
        const videoTimeline: VideoTimelinePoint[] = [];
        const videoColors = ['#9C1E1E', '#E74C3C', '#C0392B', '#A93226', '#922B21', '#7B241C'];
        let colorIndex = 0;
        const videoColorMap = new Map<string, string>();
        
        for (let date = new Date(dataInicio); date <= dataMaxima; date.setDate(date.getDate() + 1)) {
          const dateStr = date.toISOString().split('T')[0];
          
          const videosAtivos = videoInfos.map(video => {
            if (!videoColorMap.has(video.id)) {
              videoColorMap.set(video.id, videoColors[colorIndex % videoColors.length]);
              colorIndex++;
            }
            
            return {
              id: video.id,
              nome: video.nome,
              horasExibidas: video.horasExibidas,
              color: videoColorMap.get(video.id)!,
            };
          });
          
          videoTimeline.push({
            data: dateStr,
            videosAtivos,
          });
        }

        const totalExibicoesEstimadas = totalTelas * 245 * Math.max(1, diasAtivos);
        const totalHoras = videoInfos.reduce((sum, v) => sum + v.horasExibidas, 0);

        buildingInfos.forEach(b => uniqueBuildingsSet.add(b.id));
        totalExhibitions += totalExibicoesEstimadas;
        totalVideosAtivos += videoInfos.filter(v => v.approvalStatus === 'approved').length;
        totalVideosExibidos += videoInfos.length;

        campaignReports.push({
          pedidoId: pedido.id,
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
          totalExibicoes: totalExibicoesEstimadas,
          totalHoras,
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

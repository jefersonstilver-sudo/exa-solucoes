import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

export interface WeeklyExhibition {
  semana: string;
  exibicoes: number;
  projecao?: number;
}

export interface BuildingReach {
  nome: string;
  alcance: number;
  telas: number;
}

export interface CampaignReport {
  pedidoId: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  diasAtivos: number;
  diasRestantes: number;
  progresso: number;
  videos: VideoInfo[];
  buildings: BuildingInfo[];
  totalTelas: number;
  exibicoesEstimadas: number;
  publicoImpactado: number;
  chartData: {
    weeklyExhibitions: WeeklyExhibition[];
    buildingReach: BuildingReach[];
  };
}

export interface CampaignSummary {
  totalVideosAtivos: number;
  totalExibicoes: number;
  totalPublicoImpactado: number;
  totalPrediosAtivos: number;
}

export const useVideoReportData = (clientId?: string) => {
  const [campaigns, setCampaigns] = useState<CampaignReport[]>([]);
  const [summary, setSummary] = useState<CampaignSummary>({
    totalVideosAtivos: 0,
    totalExibicoes: 0,
    totalPublicoImpactado: 0,
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

      // Processar dados por PEDIDO (campanha)
      const campaignReports: CampaignReport[] = [];
      const uniqueBuildingsSet = new Set<string>();
      let totalExhibitions = 0;
      let totalAudience = 0;
      let totalVideosAtivos = 0;

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
        
        const diasAtivos = Math.max(0, Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
        const diasRestantes = Math.max(0, Math.floor((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));
        const totalDias = Math.floor((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
        const progresso = totalDias > 0 ? Math.min(100, (diasAtivos / totalDias) * 100) : 0;

        // Métricas do pedido
        const totalTelas = buildingInfos.reduce((sum, b) => sum + b.quantidadeTelas, 0);
        const exibicoesEstimadas = totalTelas * 245 * Math.max(1, diasAtivos);
        const publicoImpactado = buildingInfos.reduce((sum, b) => sum + b.publicoEstimado, 0) * Math.max(1, diasAtivos);

        // Dados para gráficos
        const weeklyExhibitions: WeeklyExhibition[] = [];
        const weeksActive = Math.ceil(diasAtivos / 7);
        const weeksTotal = Math.ceil(totalDias / 7);
        
        for (let i = 0; i < weeksTotal; i++) {
          const isActive = i < weeksActive;
          weeklyExhibitions.push({
            semana: `S${i + 1}`,
            exibicoes: isActive ? totalTelas * 245 * 7 : 0,
            projecao: !isActive ? totalTelas * 245 * 7 : undefined,
          });
        }

        const buildingReach: BuildingReach[] = buildingInfos.map(b => ({
          nome: b.nome,
          alcance: b.publicoEstimado * Math.max(1, diasAtivos),
          telas: b.quantidadeTelas,
        }));

        // Mapear vídeos
        const videoInfos: VideoInfo[] = videosFromPedido.map(pv => ({
          id: pv.videos?.id || pv.video_id,
          nome: pv.videos?.nome || 'Vídeo sem título',
          url: pv.videos?.url || '',
          duracao: pv.videos?.duracao || 0,
          approvalStatus: pv.approval_status || 'pending',
        }));

        buildingInfos.forEach(b => uniqueBuildingsSet.add(b.id));
        totalExhibitions += exibicoesEstimadas;
        totalAudience += publicoImpactado;
        totalVideosAtivos += videoInfos.filter(v => v.approvalStatus === 'approved').length;

        campaignReports.push({
          pedidoId: pedido.id,
          dataInicio: pedido.data_inicio,
          dataFim: pedido.data_fim,
          status: pedido.status,
          diasAtivos,
          diasRestantes,
          progresso,
          videos: videoInfos,
          buildings: buildingInfos,
          totalTelas,
          exibicoesEstimadas,
          publicoImpactado,
          chartData: {
            weeklyExhibitions,
            buildingReach,
          },
        });
      }

      setCampaigns(campaignReports);
      setSummary({
        totalVideosAtivos,
        totalExibicoes: totalExhibitions,
        totalPublicoImpactado: totalAudience,
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
  }, [clientId]);

  return { campaigns, summary, loading, error, refetch: fetchData };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BuildingInfo {
  id: string;
  nome: string;
  bairro: string;
  endereco: string;
  codigo_predio: string;
  quantidade_telas: number | null;
  publico_estimado: number | null;
}

export interface VideoReport {
  id: string;
  nome: string;
  url: string;
  duracao: number | null;
  status: string;
  pedidoId: string;
  dataInicio: string;
  dataFim: string;
  buildings: BuildingInfo[];
  diasAtivos: number;
  diasRestantes: number;
  progresso: number;
  exibicoesEstimadas: number;
  publicoImpactado: number;
  totalTelas: number;
}

export interface CampaignSummary {
  totalVideosAtivos: number;
  totalExibicoes: number;
  totalPublicoImpactado: number;
  totalPrediosAtivos: number;
}

export const useVideoReportData = (clientId: string | undefined) => {
  const [videos, setVideos] = useState<VideoReport[]>([]);
  const [summary, setSummary] = useState<CampaignSummary>({
    totalVideosAtivos: 0,
    totalExibicoes: 0,
    totalPublicoImpactado: 0,
    totalPrediosAtivos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideoReports = async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📊 [VIDEO REPORT] Iniciando busca de dados para cliente:', clientId);

      // 1. Buscar pedidos do cliente
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['ativo', 'pendente', 'pago_pendente_video']);

      if (pedidosError) throw pedidosError;

      if (!pedidos || pedidos.length === 0) {
        console.log('📊 [VIDEO REPORT] Nenhum pedido encontrado');
        setVideos([]);
        return;
      }

      const pedidoIds = pedidos.map(p => p.id);

      // 2. Buscar pedido_videos com vídeos
      const { data: pedidoVideos, error: pedidoVideosError } = await supabase
        .from('pedido_videos')
        .select(`
          pedido_id,
          video_id,
          approval_status,
          videos!inner (
            id,
            nome,
            url,
            duracao
          )
        `)
        .in('pedido_id', pedidoIds);

      if (pedidoVideosError) throw pedidoVideosError;

      if (!pedidoVideos || pedidoVideos.length === 0) {
        console.log('📊 [VIDEO REPORT] Nenhum vídeo encontrado nos pedidos');
        setVideos([]);
        return;
      }

      // 3. Processar dados
      const hoje = new Date();
      const videosProcessados: VideoReport[] = [];
      const buildingsSet = new Set<string>();

      for (const pv of pedidoVideos) {
        const pedido = pedidos.find(p => p.id === pv.pedido_id);
        if (!pedido) continue;

        const video = pv.videos as any;
        if (!video) continue;

        // Buscar buildings
        const buildingIds = pedido.lista_predios || [];
        const { data: buildings, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, nome, bairro, endereco, codigo_predio, quantidade_telas, publico_estimado')
          .in('id', buildingIds);

        if (buildingsError) {
          console.error('Erro ao buscar buildings:', buildingsError);
          continue;
        }

        const buildingsInfo = (buildings || []) as BuildingInfo[];
        
        // Calcular métricas
        const dataInicio = new Date(pedido.data_inicio);
        const dataFim = new Date(pedido.data_fim);
        const totalDias = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
        const diasAtivos = Math.ceil((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
        const diasRestantes = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        const progresso = Math.min(100, Math.max(0, (diasAtivos / totalDias) * 100));

        const totalTelas = buildingsInfo.reduce((sum, b) => sum + (b.quantidade_telas || 0), 0);
        const exibicoesEstimadas = totalTelas * 245 * Math.max(0, diasAtivos);
        const publicoImpactado = buildingsInfo.reduce((sum, b) => 
          sum + ((b.publico_estimado || 0) * Math.max(0, diasAtivos)), 0
        );

        // Adicionar buildings ao set
        buildingsInfo.forEach(b => buildingsSet.add(b.id));

        videosProcessados.push({
          id: video.id,
          nome: video.nome,
          url: video.url,
          duracao: video.duracao,
          status: pv.approval_status || 'pending',
          pedidoId: pedido.id,
          dataInicio: pedido.data_inicio,
          dataFim: pedido.data_fim,
          buildings: buildingsInfo,
          diasAtivos: Math.max(0, diasAtivos),
          diasRestantes: Math.max(0, diasRestantes),
          progresso,
          exibicoesEstimadas,
          publicoImpactado,
          totalTelas,
        });
      }

      // 4. Calcular resumo
      const totalVideosAtivos = videosProcessados.filter(v => v.status === 'approved').length;
      const totalExibicoes = videosProcessados.reduce((sum, v) => sum + v.exibicoesEstimadas, 0);
      const totalPublicoImpactado = videosProcessados.reduce((sum, v) => sum + v.publicoImpactado, 0);
      const totalPrediosAtivos = buildingsSet.size;

      setSummary({
        totalVideosAtivos,
        totalExibicoes,
        totalPublicoImpactado,
        totalPrediosAtivos,
      });

      setVideos(videosProcessados);
      console.log('✅ [VIDEO REPORT] Processados', videosProcessados.length, 'vídeos');

    } catch (error: any) {
      console.error('💥 [VIDEO REPORT] Erro:', error);
      setError(error.message || 'Erro ao carregar relatório de campanhas');
      toast.error('Erro ao carregar relatório de campanhas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchVideoReports();
    }

    // Real-time subscriptions
    const channel = supabase
      .channel('video-report-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => fetchVideoReports()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedido_videos' },
        () => fetchVideoReports()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  return { videos, summary, loading, error, refetch: fetchVideoReports };
};

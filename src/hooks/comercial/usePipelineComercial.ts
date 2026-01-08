import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineColumn {
  id: string;
  titulo: string;
  valor: number;
  quantidade: number;
  cor: string;
  bgColor: string;
}

export interface PipelineComercialData {
  colunas: PipelineColumn[];
  totalPipeline: number;
  totalPropostas: number;
}

export const usePipelineComercial = () => {
  const [data, setData] = useState<PipelineComercialData>({
    colunas: [],
    totalPipeline: 0,
    totalPropostas: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipeline = async () => {
    try {
      setLoading(true);

      // Buscar leads qualificados (pontuação alta ou temperatura quente)
      const { data: leadsQualificados, error: errLeads } = await supabase
        .from('contacts')
        .select('id, pontuacao')
        .eq('funil_status', 'lead')
        .or('temperatura.eq.quente,pontuacao.gte.70');

      // Buscar propostas por status
      const { data: propostas, error: errPropostas } = await supabase
        .from('proposals')
        .select('id, status, cash_total_value');

      // Buscar vendas em negociação
      const { data: vendasNegociacao, error: errNegociacao } = await supabase
        .from('vendas')
        .select('id, valor_total')
        .eq('status_venda', 'em_negociacao');

      // Buscar vendas ganhas (último mês)
      const umMesAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: vendasGanhas, error: errGanhas } = await supabase
        .from('vendas')
        .select('id, valor_total')
        .eq('status_venda', 'ganha')
        .gte('data_fechamento', umMesAtras);

      // Calcular valores
      const valorLeadsQualificados = (leadsQualificados?.length || 0) * 5000; // Estimativa por lead

      const propostasEnviadas = propostas?.filter(p => 
        ['enviada', 'visualizada', 'atualizada'].includes(p.status || '')
      ) || [];
      const valorPropostasEnviadas = propostasEnviadas.reduce((acc, p) => acc + (p.cash_total_value || 0), 0);

      const valorNegociacao = vendasNegociacao?.reduce((acc, v) => acc + (v.valor_total || 0), 0) || 0;

      const propostasAceitas = propostas?.filter(p => p.status === 'aceita') || [];
      const valorAceitas = propostasAceitas.reduce((acc, p) => acc + (p.cash_total_value || 0), 0);

      const valorVendasGanhas = vendasGanhas?.reduce((acc, v) => acc + (v.valor_total || 0), 0) || 0;

      const colunas: PipelineColumn[] = [
        {
          id: 'lead_qualificado',
          titulo: 'Lead Qualificado',
          valor: valorLeadsQualificados,
          quantidade: leadsQualificados?.length || 0,
          cor: '#3B82F6',
          bgColor: 'bg-blue-500/10'
        },
        {
          id: 'proposta_enviada',
          titulo: 'Proposta Enviada',
          valor: valorPropostasEnviadas,
          quantidade: propostasEnviadas.length,
          cor: '#F59E0B',
          bgColor: 'bg-amber-500/10'
        },
        {
          id: 'em_negociacao',
          titulo: 'Em Negociação',
          valor: valorNegociacao,
          quantidade: vendasNegociacao?.length || 0,
          cor: '#8B5CF6',
          bgColor: 'bg-purple-500/10'
        },
        {
          id: 'aceite_verbal',
          titulo: 'Aceite Verbal',
          valor: valorAceitas,
          quantidade: propostasAceitas.length,
          cor: '#10B981',
          bgColor: 'bg-emerald-500/10'
        },
        {
          id: 'venda_concluida',
          titulo: 'Venda Concluída',
          valor: valorVendasGanhas,
          quantidade: vendasGanhas?.length || 0,
          cor: '#059669',
          bgColor: 'bg-green-600/10'
        }
      ];

      const totalPipeline = colunas.reduce((acc, c) => acc + c.valor, 0);
      const totalPropostas = colunas.reduce((acc, c) => acc + c.quantidade, 0);

      setData({
        colunas,
        totalPipeline,
        totalPropostas
      });

    } catch (err) {
      console.error('Erro ao buscar pipeline comercial:', err);
      setError('Erro ao carregar pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();

    const channel = supabase
      .channel('pipeline-comercial')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, fetchPipeline)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendas' }, fetchPipeline)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, fetchPipeline)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { data, loading, error, refetch: fetchPipeline };
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProdutoExa {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  duracao_video_segundos: number;
  max_clientes_por_painel: number;
  max_videos_por_pedido: number | null;
  vendido_no_site: boolean;
  contratacao_parcial: boolean;
  vendedor_responsavel: string | null;
  telefone_vendedor: string | null;
  formato: string;
  resolucao: string | null;
  proporcao: string | null;
  tipo_exibicao: string | null;
  ativo: boolean;
  ordem_exibicao: number;
  created_at: string;
  updated_at: string;
  ultima_alteracao_em: string | null;
  ultima_alteracao_por: string | null;
}

export interface ConfiguracaoExibicao {
  id: string;
  horas_operacao_dia: number;
  dias_mes: number;
  updated_at: string;
  updated_by: string | null;
}

export interface CalculosExibicao {
  tempoCicloSegundos: number;
  segundosPorDia: number;
  ciclosPorDia: number;
  exibicoesPorDia: number;
  exibicoesPorMes: number;
  detalheProdutos: {
    codigo: string;
    nome: string;
    tempoTotal: number;
    percentualCiclo: number;
  }[];
}

export function useProdutosExa() {
  const queryClient = useQueryClient();

  // Buscar produtos
  const { data: produtos, isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos-exa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos_exa')
        .select('*')
        .order('ordem_exibicao');
      
      if (error) throw error;
      return data as ProdutoExa[];
    }
  });

  // Buscar configurações globais
  const { data: configuracao, isLoading: loadingConfig } = useQuery({
    queryKey: ['configuracao-exibicao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_exibicao')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as ConfiguracaoExibicao | null;
    }
  });

  // Calcular métricas de exibição
  const calcularExibicoes = (
    produtosAtivos: ProdutoExa[] = [],
    config: ConfiguracaoExibicao | null = null
  ): CalculosExibicao => {
    const horasOperacao = config?.horas_operacao_dia ?? 21;
    const diasMes = config?.dias_mes ?? 30;
    
    // Calcular tempo total do ciclo
    let tempoCicloSegundos = 0;
    const detalheProdutos: CalculosExibicao['detalheProdutos'] = [];
    
    produtosAtivos.filter(p => p.ativo).forEach(produto => {
      const tempoTotal = produto.duracao_video_segundos * produto.max_clientes_por_painel;
      tempoCicloSegundos += tempoTotal;
      detalheProdutos.push({
        codigo: produto.codigo,
        nome: produto.nome,
        tempoTotal,
        percentualCiclo: 0 // calculado depois
      });
    });

    // Se não houver produtos, usar valor padrão
    if (tempoCicloSegundos === 0) {
      tempoCicloSegundos = 195; // (10*15) + (15*3)
    }

    // Calcular percentuais
    detalheProdutos.forEach(d => {
      d.percentualCiclo = Math.round((d.tempoTotal / tempoCicloSegundos) * 100);
    });

    const segundosPorDia = horasOperacao * 3600;
    const ciclosPorDia = Math.floor(segundosPorDia / tempoCicloSegundos);
    const exibicoesPorDia = ciclosPorDia;
    const exibicoesPorMes = ciclosPorDia * diasMes;

    return {
      tempoCicloSegundos,
      segundosPorDia,
      ciclosPorDia,
      exibicoesPorDia,
      exibicoesPorMes,
      detalheProdutos
    };
  };

  // Mutation para atualizar produto
  const atualizarProdutoMutation = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: Partial<ProdutoExa> }) => {
      const { data, error } = await supabase
        .from('produtos_exa')
        .update(dados)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-exa'] });
      toast.success('Produto atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    }
  });

  // Mutation para atualizar configurações globais
  const atualizarConfiguracaoMutation = useMutation({
    mutationFn: async (dados: Partial<ConfiguracaoExibicao>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('configuracoes_exibicao')
        .update({ ...dados, updated_by: user.user?.id })
        .eq('id', configuracao?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-exibicao'] });
      toast.success('Configurações atualizadas');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar configurações: ' + error.message);
    }
  });

  // Mutation para sincronizar todos os buildings
  const sincronizarBuildingsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('sincronizar_exibicoes_buildings');
      
      if (error) throw error;
      return data as {
        success: boolean;
        tempo_ciclo: number;
        ciclos_dia: number;
        exibicoes_mes_por_tela: number;
        buildings_atualizados: number;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success(`${data.buildings_atualizados} prédios atualizados com ${data.exibicoes_mes_por_tela.toLocaleString('pt-BR')} exibições/mês por tela`);
    },
    onError: (error) => {
      toast.error('Erro ao sincronizar prédios: ' + error.message);
    }
  });

  // Calcular valores atuais
  const calculos = calcularExibicoes(produtos || [], configuracao);

  // Buscar produto por código
  const getProdutoByCodigo = (codigo: string) => {
    return produtos?.find(p => p.codigo === codigo);
  };

  // Obter produto horizontal
  const produtoHorizontal = getProdutoByCodigo('horizontal');

  // Obter produto vertical premium
  const produtoVertical = getProdutoByCodigo('vertical_premium');

  return {
    // Dados
    produtos,
    configuracao,
    calculos,
    produtoHorizontal,
    produtoVertical,
    
    // Loading states
    isLoading: loadingProdutos || loadingConfig,
    
    // Funções de cálculo
    calcularExibicoes,
    getProdutoByCodigo,
    
    // Mutations
    atualizarProduto: atualizarProdutoMutation.mutate,
    atualizarConfiguracao: atualizarConfiguracaoMutation.mutate,
    sincronizarBuildings: sincronizarBuildingsMutation.mutate,
    
    // Loading states das mutations
    isUpdatingProduto: atualizarProdutoMutation.isPending,
    isUpdatingConfig: atualizarConfiguracaoMutation.isPending,
    isSincronizando: sincronizarBuildingsMutation.isPending
  };
}

/**
 * Hook centralizado para configurações de exibição
 * FONTE ÚNICA DE VERDADE para todo o sistema
 * 
 * Baseado no Manual Técnico Oficial 2026:
 * - Horizontal: 1440×1080 (4:3), 10s, até 15 marcas — 502 exib/dia · 15.060/mês · 83 min presença/dia
 * - Vertical Premium: 1080×1920 (9:16), 15s, apenas 3 marcas — 167 exib/dia · 5.010/mês · 42 min tela cheia/dia
 * - 23h operação/dia, 30 dias/mês
 * - Ciclo: 165s (15×10s horizontal + 1×15s vertical)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProdutoExaConfig {
  id: string;
  codigo: string;
  nome: string;
  duracao_video_segundos: number;
  max_clientes_por_painel: number;
  formato: string;
  resolucao: string | null;
  proporcao: string | null;
  tipo_exibicao: string | null;
  vendedor_responsavel: string | null;
  telefone_vendedor: string | null;
  vendido_no_site: boolean;
  contratacao_parcial: boolean;
  ativo: boolean;
}

export interface ConfiguracaoGlobal {
  horas_operacao_dia: number;
  dias_mes: number;
}

export interface CalculosExibicao {
  tempoCicloSegundos: number;
  segundosPorDia: number;
  ciclosPorDia: number;
  exibicoesPorDia: number;
  exibicoesPorMes: number;
}

export interface EspecificacoesTecnicas {
  horizontal: {
    resolucao: string;
    proporcao: string;
    duracao: number;
    maxClientes: number;
    tipoExibicao: string;
    formato: string;
  };
  vertical: {
    resolucao: string;
    proporcao: string;
    duracao: number;
    maxClientes: number;
    tipoExibicao: string;
    formato: string;
    vendedor: string | null;
    telefone: string | null;
  };
}

// Valores padrão baseados no Manual v3.0 (fallback se banco não responder)
const DEFAULT_HORIZONTAL = {
  resolucao: '1440×1080',
  proporcao: '4:3',
  duracao: 10,
  maxClientes: 15,
  tipoExibicao: 'Convencional',
  formato: 'Horizontal'
};

const DEFAULT_VERTICAL = {
  resolucao: '1080×1920',
  proporcao: '9:16',
  duracao: 15,
  maxClientes: 3,
  tipoExibicao: 'Tela Cheia',
  formato: 'Vertical',
  vendedor: 'Eduardo',
  telefone: '+55 45 99141-5856'
};

const DEFAULT_CONFIG: ConfiguracaoGlobal = {
  horas_operacao_dia: 23,
  dias_mes: 30
};

export function useExibicoesConfig() {
  // Buscar produtos do banco
  const { data: produtos, isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos-exa-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos_exa')
        .select('*')
        .eq('ativo', true)
        .order('ordem_exibicao');
      
      if (error) {
        console.error('[useExibicoesConfig] Erro ao buscar produtos:', error);
        throw error;
      }
      return data as ProdutoExaConfig[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  // Buscar configurações globais
  const { data: configRaw, isLoading: loadingConfig } = useQuery({
    queryKey: ['configuracao-exibicao-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_exibicao')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('[useExibicoesConfig] Erro ao buscar config:', error);
        throw error;
      }
      return data as ConfiguracaoGlobal | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Extrair produtos específicos
  const produtoHorizontal = produtos?.find(p => p.codigo === 'horizontal');
  const produtoVertical = produtos?.find(p => p.codigo === 'vertical_premium');
  
  // Configuração global (com fallback)
  const configuracao: ConfiguracaoGlobal = {
    horas_operacao_dia: configRaw?.horas_operacao_dia ?? DEFAULT_CONFIG.horas_operacao_dia,
    dias_mes: configRaw?.dias_mes ?? DEFAULT_CONFIG.dias_mes
  };

  // Especificações técnicas (do banco ou fallback)
  const especificacoes: EspecificacoesTecnicas = {
    horizontal: {
      resolucao: produtoHorizontal?.resolucao || DEFAULT_HORIZONTAL.resolucao,
      proporcao: (produtoHorizontal as any)?.proporcao || DEFAULT_HORIZONTAL.proporcao,
      duracao: produtoHorizontal?.duracao_video_segundos || DEFAULT_HORIZONTAL.duracao,
      maxClientes: produtoHorizontal?.max_clientes_por_painel || DEFAULT_HORIZONTAL.maxClientes,
      tipoExibicao: (produtoHorizontal as any)?.tipo_exibicao || DEFAULT_HORIZONTAL.tipoExibicao,
      formato: produtoHorizontal?.formato || DEFAULT_HORIZONTAL.formato
    },
    vertical: {
      resolucao: produtoVertical?.resolucao || DEFAULT_VERTICAL.resolucao,
      proporcao: (produtoVertical as any)?.proporcao || DEFAULT_VERTICAL.proporcao,
      duracao: produtoVertical?.duracao_video_segundos || DEFAULT_VERTICAL.duracao,
      maxClientes: produtoVertical?.max_clientes_por_painel || DEFAULT_VERTICAL.maxClientes,
      tipoExibicao: (produtoVertical as any)?.tipo_exibicao || DEFAULT_VERTICAL.tipoExibicao,
      formato: produtoVertical?.formato || DEFAULT_VERTICAL.formato,
      vendedor: produtoVertical?.vendedor_responsavel || DEFAULT_VERTICAL.vendedor,
      telefone: produtoVertical?.telefone_vendedor || DEFAULT_VERTICAL.telefone
    }
  };

  // Calcular métricas de exibição conforme Manual 2026
  // Ciclo oficial: 15 horizontais (10s) + 1 vertical (15s) = 165s
  const calcularExibicoes = (): CalculosExibicao => {
    const tempoHorizontal = especificacoes.horizontal.duracao * especificacoes.horizontal.maxClientes; // 10×15=150
    const tempoVertical = especificacoes.vertical.duracao; // 1 vertical por ciclo = 15s
    const tempoCicloSegundos = tempoHorizontal + tempoVertical; // 150 + 15 = 165s
    
    const segundosPorDia = configuracao.horas_operacao_dia * 3600; // 23h = 82.800s
    const ciclosPorDia = Math.floor(segundosPorDia / tempoCicloSegundos); // ~502
    const exibicoesPorDia = ciclosPorDia; // Cada ciclo = 1 exibição por cliente horizontal
    const exibicoesPorMes = exibicoesPorDia * configuracao.dias_mes; // ~15.060

    return {
      tempoCicloSegundos,
      segundosPorDia,
      ciclosPorDia,
      exibicoesPorDia,
      exibicoesPorMes
    };
  };

  const calculos = calcularExibicoes();

  // Função para formatar especificações para contratos
  const getEspecificacoesContrato = (tipo: 'horizontal' | 'vertical' = 'horizontal') => {
    const spec = tipo === 'horizontal' ? especificacoes.horizontal : especificacoes.vertical;
    return {
      resolucao: spec.resolucao,
      proporcao: spec.proporcao,
      duracao: spec.duracao,
      duracaoTexto: `${spec.duracao} segundos`,
      tipoExibicao: spec.tipoExibicao,
      formato: spec.formato,
      exibicoesDia: calculos.exibicoesPorDia,
      exibicoesMes: calculos.exibicoesPorMes,
      exibicoesDiaFormatado: calculos.exibicoesPorDia.toLocaleString('pt-BR'),
      exibicoesMesFormatado: calculos.exibicoesPorMes.toLocaleString('pt-BR')
    };
  };

  // Função para texto de especificações técnicas
  const getTextoEspecificacoes = (tipo: 'horizontal' | 'vertical' = 'horizontal') => {
    const spec = getEspecificacoesContrato(tipo);
    return `Vídeo ${spec.formato.toLowerCase()} ${spec.resolucao} (${spec.proporcao}), duração máxima de ${spec.duracao} segundos, sem áudio. O vídeo será exibido aproximadamente ${spec.exibicoesDiaFormatado} vezes por dia em cada tela contratada.`;
  };

  // Calcular exibições por quantidade de telas
  const calcularExibicoesPorTelas = (quantidadeTelas: number): number => {
    return calculos.exibicoesPorMes * quantidadeTelas;
  };

  return {
    // Dados brutos
    produtos,
    produtoHorizontal,
    produtoVertical,
    configuracao,
    
    // Especificações técnicas
    especificacoes,
    
    // Cálculos
    calculos,
    
    // Funções auxiliares
    getEspecificacoesContrato,
    getTextoEspecificacoes,
    calcularExibicoesPorTelas,
    
    // Loading state
    isLoading: loadingProdutos || loadingConfig
  };
}

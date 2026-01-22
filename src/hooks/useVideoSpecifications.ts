import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VideoSpecifications {
  horizontal: {
    duracaoSegundos: number;
    resolucao: string;
    proporcao: string;
    formato: string;
    maxClientesPainel: number;
    maxVideosPorPedido: number;
    ultimaAlteracao: string | null;
  };
  vertical: {
    duracaoSegundos: number;
    resolucao: string;
    proporcao: string;
    formato: string;
    maxClientesPainel: number;
    maxVideosPorPedido: number;
    ultimaAlteracao: string | null;
  };
  exibicoes: {
    porDia: number;
    porMes: number;
    horasOperacao: number;
    diasMes: number;
  };
}

/**
 * Hook para buscar especificações técnicas dos produtos EXA
 * Fonte única de verdade para validação de vídeos
 */
export function useVideoSpecifications() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['video-specifications'],
    queryFn: async (): Promise<VideoSpecifications> => {
      // Buscar produtos
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos_exa')
        .select('*')
        .in('codigo', ['horizontal', 'vertical_premium']);
      
      if (produtosError) throw produtosError;
      
      // Buscar configurações globais
      const { data: config, error: configError } = await supabase
        .from('configuracoes_exibicao')
        .select('*')
        .limit(1)
        .single();
      
      if (configError && configError.code !== 'PGRST116') throw configError;
      
      const horizontal = produtos?.find(p => p.codigo === 'horizontal');
      const vertical = produtos?.find(p => p.codigo === 'vertical_premium');
      
      const horasOperacao = config?.horas_operacao_dia ?? 21;
      const diasMes = config?.dias_mes ?? 30;
      const segundosDia = horasOperacao * 3600;
      
      // Calcular tempo do ciclo
      const tempoHorizontal = (horizontal?.duracao_video_segundos ?? 10) * (horizontal?.max_clientes_por_painel ?? 15);
      const tempoVertical = (vertical?.duracao_video_segundos ?? 15) * (vertical?.max_clientes_por_painel ?? 3);
      const tempoCiclo = tempoHorizontal + tempoVertical || 195;
      
      const ciclosPorDia = Math.floor(segundosDia / tempoCiclo);
      const exibicoesPorMes = ciclosPorDia * diasMes;
      
      return {
        horizontal: {
          duracaoSegundos: horizontal?.duracao_video_segundos ?? 10,
          resolucao: horizontal?.resolucao ?? '1440×1080',
          proporcao: (horizontal as any)?.proporcao ?? '4:3',
          formato: horizontal?.formato ?? 'horizontal',
          maxClientesPainel: horizontal?.max_clientes_por_painel ?? 15,
          maxVideosPorPedido: (horizontal as any)?.max_videos_por_pedido ?? 4,
          ultimaAlteracao: (horizontal as any)?.ultima_alteracao_em ?? null
        },
        vertical: {
          duracaoSegundos: vertical?.duracao_video_segundos ?? 15,
          resolucao: vertical?.resolucao ?? '1080×1920',
          proporcao: (vertical as any)?.proporcao ?? '9:16',
          formato: vertical?.formato ?? 'vertical',
          maxClientesPainel: vertical?.max_clientes_por_painel ?? 3,
          maxVideosPorPedido: (vertical as any)?.max_videos_por_pedido ?? 1,
          ultimaAlteracao: (vertical as any)?.ultima_alteracao_em ?? null
        },
        exibicoes: {
          porDia: ciclosPorDia,
          porMes: exibicoesPorMes,
          horasOperacao,
          diasMes
        }
      };
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    refetchOnWindowFocus: false
  });

  /**
   * Retorna a duração máxima permitida para um tipo de vídeo
   */
  const getMaxDuration = (tipo: 'horizontal' | 'vertical' = 'horizontal'): number => {
    if (!data) return tipo === 'horizontal' ? 10 : 15; // Defaults seguros
    return tipo === 'horizontal' 
      ? data.horizontal.duracaoSegundos 
      : data.vertical.duracaoSegundos;
  };

  /**
   * Retorna todas as especificações para exibição na área do anunciante
   */
  const getSpecsDisplay = (tipo: 'horizontal' | 'vertical' = 'horizontal') => {
    if (!data) {
      return {
        duracao: tipo === 'horizontal' ? 10 : 15,
        resolucao: tipo === 'horizontal' ? '1440×1080' : '1080×1920',
        proporcao: tipo === 'horizontal' ? '4:3' : '9:16',
        ultimaAlteracao: null
      };
    }
    
    const specs = tipo === 'horizontal' ? data.horizontal : data.vertical;
    return {
      duracao: specs.duracaoSegundos,
      resolucao: specs.resolucao,
      proporcao: specs.proporcao,
      ultimaAlteracao: specs.ultimaAlteracao
    };
  };

  return {
    specifications: data,
    isLoading,
    error,
    getMaxDuration,
    getSpecsDisplay
  };
}

/**
 * Função standalone para validação de vídeo (usada em services)
 * Busca duração máxima diretamente do banco
 */
export async function fetchMaxVideoDuration(tipo: 'horizontal' | 'vertical' = 'horizontal'): Promise<number> {
  try {
    const codigo = tipo === 'horizontal' ? 'horizontal' : 'vertical_premium';
    
    const { data, error } = await supabase
      .from('produtos_exa')
      .select('duracao_video_segundos')
      .eq('codigo', codigo)
      .single();
    
    if (error || !data) {
      console.warn('⚠️ Falha ao buscar duração do banco, usando default:', tipo === 'horizontal' ? 10 : 15);
      return tipo === 'horizontal' ? 10 : 15;
    }
    
    return data.duracao_video_segundos;
  } catch (err) {
    console.error('❌ Erro ao buscar especificações:', err);
    return tipo === 'horizontal' ? 10 : 15;
  }
}

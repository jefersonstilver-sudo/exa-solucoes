import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface PosicoesPredio {
  buildingId: string;
  maxClientes: number;
  ocupadas: number;      // Pedidos ativos
  reservadas: number;    // Propostas não expiradas
  disponiveis: number;   // maxClientes - ocupadas - reservadas
  percentualOcupado: number;
  isLotado: boolean;
}

export interface PosicoesData {
  posicoesMap: Record<string, PosicoesPredio>;
  totalPosicoes: number;
  totalOcupadas: number;
  totalReservadas: number;
  totalDisponiveis: number;
  percentualGeral: number;
  prediosLotados: number;
  isLoading: boolean;
  refetch: () => void;
}

export const usePosicoesDisponiveis = () => {
  // Buscar produto horizontal para pegar max_clientes_por_painel
  const { data: produtoHorizontal } = useQuery({
    queryKey: ['produto-horizontal-max'],
    queryFn: async () => {
      const { data } = await supabase
        .from('produtos_exa')
        .select('max_clientes_por_painel')
        .eq('formato', 'horizontal')
        .eq('ativo', true)
        .single();
      return data?.max_clientes_por_painel ?? 15;
    },
    staleTime: 5 * 60 * 1000
  });

  const maxClientes = produtoHorizontal ?? 15;

  // Buscar todos os prédios ativos
  const { data: predios } = useQuery({
    queryKey: ['predios-posicoes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('buildings')
        .select('id, nome, bairro, imagem_principal, numero_elevadores, publico_estimado, status')
        .eq('status', 'ativo');
      return data || [];
    },
    staleTime: 2 * 60 * 1000
  });

  // Buscar pedidos ativos (ocupam posições) - apenas horizontal
  const { data: pedidosAtivos } = useQuery({
    queryKey: ['pedidos-ocupando-posicoes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('id, lista_predios, tipo_produto')
        .in('status', ['ativo', 'pago', 'pago_pendente_video', 'video_aprovado'])
        .or('tipo_produto.eq.horizontal,tipo_produto.is.null');
      return data || [];
    },
    staleTime: 1 * 60 * 1000
  });

  // Buscar propostas não expiradas (reservam posições)
  const { data: propostasAtivas, refetch } = useQuery({
    queryKey: ['propostas-reservando-posicoes'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('proposals')
        .select('id, selected_buildings, expires_at')
        .in('status', ['sent', 'opened', 'pending'])
        .gt('expires_at', now);
      return data || [];
    },
    staleTime: 1 * 60 * 1000
  });

  // Calcular posições por prédio
  const posicoesData = useMemo<PosicoesData>(() => {
    const posicoesMap: Record<string, PosicoesPredio> = {};
    
    // Inicializar todos os prédios
    (predios || []).forEach(predio => {
      posicoesMap[predio.id] = {
        buildingId: predio.id,
        maxClientes,
        ocupadas: 0,
        reservadas: 0,
        disponiveis: maxClientes,
        percentualOcupado: 0,
        isLotado: false
      };
    });

    // Contar posições ocupadas (pedidos ativos)
    (pedidosAtivos || []).forEach(pedido => {
      const listaPredios = pedido.lista_predios as string[] || [];
      listaPredios.forEach(buildingId => {
        if (posicoesMap[buildingId]) {
          posicoesMap[buildingId].ocupadas += 1;
        }
      });
    });

    // Contar posições reservadas (propostas ativas)
    (propostasAtivas || []).forEach(proposta => {
      const selectedBuildings = proposta.selected_buildings as Array<{ building_id: string }> || [];
      selectedBuildings.forEach(item => {
        const buildingId = item.building_id;
        if (posicoesMap[buildingId]) {
          posicoesMap[buildingId].reservadas += 1;
        }
      });
    });

    // Calcular disponíveis e percentuais
    let totalPosicoes = 0;
    let totalOcupadas = 0;
    let totalReservadas = 0;
    let prediosLotados = 0;

    Object.values(posicoesMap).forEach(posicao => {
      posicao.disponiveis = Math.max(0, posicao.maxClientes - posicao.ocupadas - posicao.reservadas);
      posicao.percentualOcupado = Math.round(((posicao.ocupadas + posicao.reservadas) / posicao.maxClientes) * 100);
      posicao.isLotado = posicao.disponiveis === 0;
      
      totalPosicoes += posicao.maxClientes;
      totalOcupadas += posicao.ocupadas;
      totalReservadas += posicao.reservadas;
      
      if (posicao.isLotado) {
        prediosLotados += 1;
      }
    });

    const totalDisponiveis = totalPosicoes - totalOcupadas - totalReservadas;
    const percentualGeral = totalPosicoes > 0 
      ? Math.round(((totalOcupadas + totalReservadas) / totalPosicoes) * 100) 
      : 0;

    return {
      posicoesMap,
      totalPosicoes,
      totalOcupadas,
      totalReservadas,
      totalDisponiveis,
      percentualGeral,
      prediosLotados,
      isLoading: !predios || !pedidosAtivos || !propostasAtivas,
      refetch
    };
  }, [predios, pedidosAtivos, propostasAtivas, maxClientes, refetch]);

  return posicoesData;
};

// Hook helper para pegar posição de um prédio específico
export const usePosicaoPredio = (buildingId: string) => {
  const { posicoesMap, isLoading } = usePosicoesDisponiveis();
  
  return {
    posicao: posicoesMap[buildingId] || null,
    isLoading
  };
};

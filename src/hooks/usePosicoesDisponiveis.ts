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

export interface EmpresaPedido {
  pedidoId: string;
  empresaNome: string;
  email: string;
  valorTotal: number;
}

export interface ProjecaoPredio {
  buildingId: string;
  nome: string;
  bairro: string;
  disponiveis: number;
  precoBase: number;
  valorProjecao: number;
}

export interface ProjecaoVendas {
  total: number;
  porPredio: ProjecaoPredio[];
  totalPrediosComPreco: number;
  totalPosicoesComPreco: number;
}

export interface PosicoesData {
  posicoesMap: Record<string, PosicoesPredio>;
  totalPosicoes: number;
  totalOcupadas: number;
  totalReservadas: number;
  totalDisponiveis: number;
  percentualGeral: number;
  prediosLotados: number;
  totalPredios: number;
  totalPedidosAtivos: number;
  pedidosAtivos: Array<{
    id: string;
    lista_predios: string[];
    valor_total: number;
    empresaNome: string;
    email: string;
  }>;
  empresasPorPredio: Record<string, EmpresaPedido[]>;
  projecaoVendas: ProjecaoVendas;
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

  // Buscar apenas prédios da loja pública (com imagem e status ativo/instalação) - incluindo preco_base
  const { data: predios } = useQuery({
    queryKey: ['predios-posicoes-loja-publica-com-preco'],
    queryFn: async () => {
      const { data } = await supabase
        .from('buildings')
        .select('id, nome, bairro, imagem_principal, numero_elevadores, publico_estimado, status, preco_base')
        .in('status', ['ativo', 'instalacao', 'instalação'])
        .not('imagem_principal', 'is', null)
        .neq('imagem_principal', '');
      return data || [];
    },
    staleTime: 2 * 60 * 1000
  });

  // Buscar pedidos ativos (ocupam posições) - apenas horizontal com dados da empresa
  const { data: pedidosAtivos } = useQuery({
    queryKey: ['pedidos-ocupando-posicoes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pedidos')
        .select(`
          id, 
          lista_predios, 
          tipo_produto, 
          valor_total,
          client_id,
          users!pedidos_client_id_fkey(id, email, empresa_nome)
        `)
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
    const empresasPorPredio: Record<string, EmpresaPedido[]> = {};
    const prediosInfo: Record<string, { nome: string; bairro: string; precoBase: number }> = {};
    
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
      empresasPorPredio[predio.id] = [];
      prediosInfo[predio.id] = {
        nome: predio.nome,
        bairro: predio.bairro,
        precoBase: predio.preco_base || 0
      };
    });

    // Processar pedidos ativos
    const pedidosProcessados = (pedidosAtivos || []).map(pedido => {
      const user = pedido.users as { id: string; email: string; empresa_nome: string | null } | null;
      return {
        id: pedido.id,
        lista_predios: (pedido.lista_predios as string[]) || [],
        valor_total: pedido.valor_total || 0,
        empresaNome: user?.empresa_nome || 'Empresa não informada',
        email: user?.email || ''
      };
    });

    // Contar posições ocupadas (pedidos ativos) e mapear empresas por prédio
    pedidosProcessados.forEach(pedido => {
      pedido.lista_predios.forEach(buildingId => {
        if (posicoesMap[buildingId]) {
          posicoesMap[buildingId].ocupadas += 1;
          
          // Adicionar empresa ao prédio
          if (!empresasPorPredio[buildingId]) {
            empresasPorPredio[buildingId] = [];
          }
          empresasPorPredio[buildingId].push({
            pedidoId: pedido.id,
            empresaNome: pedido.empresaNome,
            email: pedido.email,
            valorTotal: pedido.valor_total
          });
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

    // Calcular disponíveis, percentuais e projeção de vendas
    let totalPosicoes = 0;
    let totalOcupadas = 0;
    let totalReservadas = 0;
    let prediosLotados = 0;
    
    const projecaoPorPredio: ProjecaoPredio[] = [];
    let totalProjecao = 0;
    let totalPrediosComPreco = 0;
    let totalPosicoesComPreco = 0;

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

      // Calcular projeção de vendas para prédios com preço
      const info = prediosInfo[posicao.buildingId];
      if (info && info.precoBase > 0 && posicao.disponiveis > 0) {
        const valorProjecao = posicao.disponiveis * info.precoBase;
        projecaoPorPredio.push({
          buildingId: posicao.buildingId,
          nome: info.nome,
          bairro: info.bairro,
          disponiveis: posicao.disponiveis,
          precoBase: info.precoBase,
          valorProjecao
        });
        totalProjecao += valorProjecao;
        totalPrediosComPreco += 1;
        totalPosicoesComPreco += posicao.disponiveis;
      }
    });

    // Ordenar projeção por valor (maior primeiro)
    projecaoPorPredio.sort((a, b) => b.valorProjecao - a.valorProjecao);

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
      totalPredios: predios?.length || 0,
      totalPedidosAtivos: pedidosProcessados.length,
      pedidosAtivos: pedidosProcessados,
      empresasPorPredio,
      projecaoVendas: {
        total: totalProjecao,
        porPredio: projecaoPorPredio,
        totalPrediosComPreco,
        totalPosicoesComPreco
      },
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

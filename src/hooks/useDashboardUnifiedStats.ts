import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationTypeStats {
  conversas: number;
  enviadas: number;
  recebidas: number;
}

export interface AgentConversationStats {
  conversas: number;
  enviadas: number;
  recebidas: number;
  enviadasPorTipo: Record<string, number>;
}

export interface VendedorProposalStats {
  vendedorId: string;
  vendedorNome: string;
  enviadas: number;
  aguardando: number;
  aceitas: number;
  valorRecebido: number;     // Receita EFETIVA (parcelas pagas)
  valorProjetado: number;    // Receita PROJETADA (parcelas pendentes)
  valorVendido: number;      // Soma total (recebido + projetado)
  taxaConversao: number;
}

export interface UnifiedDashboardStats {
  cadastros: number;
  cadastrosAnterior: number;
  pedidos: number;
  pedidosDetalhes: {
    pagos: number;
    pendentes: number;
    ticketMedio: number;
  };
  vendas: number;              // Receita EFETIVAMENTE recebida (parcelas pagas)
  vendasProjetadas: number;    // Parcelas PENDENTES (receita futura)
  vendasAnterior: number;
  conversas: number;
  conversasPorTipo: Record<string, ConversationTypeStats>;
  conversasPorAgente: Record<string, AgentConversationStats>;
  mensagensEnviadas: number;
  mensagensRecebidas: number;
  novosContatos: number;
  prediosAtivos: number;
  prediosTotal: number;
  prediosPercentual: number;
  // Devices/Painéis (separado de prédios)
  devicesOnline: number;
  devicesOffline: number;
  devicesTotal: number;
  quedasPeriodo: number;
  vouchersPendentes: number;
  vouchersList: Array<{
    provider_name: string;
    benefit_choice: string;
    benefit_chosen_at: string;
  }>;
  // Propostas
  propostasEnviadas: number;
  propostasAguardando: number;
  propostasAceitas: number;
  propostasValorPotencial: number;
  propostasPorVendedor: VendedorProposalStats[];
  loading: boolean;
}

export const useDashboardUnifiedStats = (startDate: Date, endDate: Date) => {
  const [stats, setStats] = useState<UnifiedDashboardStats>({
    cadastros: 0,
    cadastrosAnterior: 0,
    pedidos: 0,
    pedidosDetalhes: { pagos: 0, pendentes: 0, ticketMedio: 0 },
    vendas: 0,
    vendasProjetadas: 0,
    vendasAnterior: 0,
    conversas: 0,
    conversasPorTipo: {},
    conversasPorAgente: {},
    mensagensEnviadas: 0,
    mensagensRecebidas: 0,
    novosContatos: 0,
    prediosAtivos: 0,
    prediosTotal: 0,
    prediosPercentual: 0,
    devicesOnline: 0,
    devicesOffline: 0,
    devicesTotal: 0,
    quedasPeriodo: 0,
    vouchersPendentes: 0,
    vouchersList: [],
    propostasEnviadas: 0,
    propostasAguardando: 0,
    propostasAceitas: 0,
    propostasValorPotencial: 0,
    propostasPorVendedor: [],
    loading: true
  });

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      const start = startDate.toISOString();
      const end = endDate.toISOString();

      // Período anterior para comparação
      const diffMs = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - diffMs);
      const previousEnd = startDate;

      // 1. Cadastros
      const { count: cadastros } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start)
        .lte('created_at', end);

      const { count: cadastrosAnterior } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString());

      // 2. Pedidos (não cortesia)
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('status, valor_total')
        .gte('created_at', start)
        .lte('created_at', end)
        .gt('valor_total', 0);

      const pedidos = pedidosData?.length || 0;
      const paidStatuses = ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'];
      const pagos = pedidosData?.filter(p => paidStatuses.includes(p.status)).length || 0;
      const pendentes = pedidosData?.filter(p => !paidStatuses.includes(p.status)).length || 0;
      const ticketMedio = pedidosData?.length 
        ? pedidosData.reduce((sum, p) => sum + (p.valor_total || 0), 0) / pedidosData.length 
        : 0;

      // 3. Vendas - Calcular baseado em PARCELAS PAGAS para pedidos parcelados
      const { data: vendasData } = await supabase
        .from('pedidos')
        .select('id, valor_total, is_fidelidade, total_parcelas')
        .in('status', ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'])
        .gte('created_at', start)
        .lte('created_at', end)
        .gt('valor_total', 0);

      // Buscar todas as parcelas dos pedidos do período
      const pedidoIds = vendasData?.map(p => p.id) || [];
      let vendasEfetivas = 0;
      let vendasProjetadas = 0;

      if (pedidoIds.length > 0) {
        // Buscar parcelas pagas
        const { data: parcelasPagas } = await supabase
          .from('parcelas')
          .select('pedido_id, valor_final')
          .in('pedido_id', pedidoIds)
          .eq('status', 'pago');

        // Buscar parcelas pendentes
        const { data: parcelasPendentes } = await supabase
          .from('parcelas')
          .select('pedido_id, valor_final')
          .in('pedido_id', pedidoIds)
          .in('status', ['pendente', 'atrasado']);

        // Criar mapa de valores pagos e pendentes por pedido
        const parcelasPagasPorPedido: Record<string, number> = {};
        const parcelasPendentesPorPedido: Record<string, number> = {};
        
        parcelasPagas?.forEach(p => {
          parcelasPagasPorPedido[p.pedido_id] = (parcelasPagasPorPedido[p.pedido_id] || 0) + (p.valor_final || 0);
        });

        parcelasPendentes?.forEach(p => {
          parcelasPendentesPorPedido[p.pedido_id] = (parcelasPendentesPorPedido[p.pedido_id] || 0) + (p.valor_final || 0);
        });

        // Calcular receita efetiva e projetada
        vendasData?.forEach(pedido => {
          const temParcelas = pedido.is_fidelidade || (pedido.total_parcelas && pedido.total_parcelas > 1);
          
          if (temParcelas) {
            // Pedido parcelado: usar valores das parcelas
            vendasEfetivas += parcelasPagasPorPedido[pedido.id] || 0;
            vendasProjetadas += parcelasPendentesPorPedido[pedido.id] || 0;
          } else {
            // Pedido único: usar valor_total como receita efetiva
            vendasEfetivas += pedido.valor_total || 0;
          }
        });
      }

      const vendas = vendasEfetivas;

      // Período anterior (mantém cálculo simples para comparação)
      const { data: vendasAnteriores } = await supabase
        .from('pedidos')
        .select('valor_total')
        .in('status', ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'])
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString())
        .gt('valor_total', 0);

      const vendasAnterior = vendasAnteriores?.reduce((sum, p) => sum + (p.valor_total || 0), 0) || 0;

      // 4. Conversas com Mensagens do Período
      const { data: mensagensData } = await supabase
        .from('messages')
        .select(`
          conversation_id,
          direction,
          agent_key,
          conversations!inner(contact_type)
        `)
        .gte('created_at', start)
        .lte('created_at', end);

      // Contar conversas únicas
      const conversasUnicas = new Set(mensagensData?.map(m => m.conversation_id) || []);
      const conversas = conversasUnicas.size;

      // Agrupar por tipo de contato E por agente
      const conversasPorTipo: Record<string, ConversationTypeStats> = {};
      const conversasPorAgente: Record<string, AgentConversationStats> = {};
      const conversasPorId: Record<string, string> = {};
      const conversasPorIdAgente: Record<string, string> = {};

      mensagensData?.forEach(msg => {
        const contactType = (msg.conversations as any)?.contact_type || 'Sem tipo';
        const agentKey = msg.agent_key;
        const agentName = agentKey === 'eduardo' ? 'Eduardo' : 
                          agentKey === 'sofia' ? 'Sofia' : 'Outro';
        
        // Registrar tipo de conversa
        if (!conversasPorId[msg.conversation_id]) {
          conversasPorId[msg.conversation_id] = contactType;
        }

        // Registrar agente da conversa
        if (!conversasPorIdAgente[msg.conversation_id]) {
          conversasPorIdAgente[msg.conversation_id] = agentName;
        }

        // Inicializar stats por tipo se não existir
        if (!conversasPorTipo[contactType]) {
          conversasPorTipo[contactType] = {
            conversas: 0,
            enviadas: 0,
            recebidas: 0
          };
        }

        // Inicializar stats por agente se não existir
        if (!conversasPorAgente[agentName]) {
          conversasPorAgente[agentName] = {
            conversas: 0,
            enviadas: 0,
            recebidas: 0,
            enviadasPorTipo: {}
          };
        }

        // Contar mensagens (corrigido para inbound/outbound)
        if (msg.direction === 'outbound') {
          conversasPorTipo[contactType].enviadas++;
          conversasPorAgente[agentName].enviadas++;
          
          // Contar enviadas por tipo para este agente
          if (!conversasPorAgente[agentName].enviadasPorTipo[contactType]) {
            conversasPorAgente[agentName].enviadasPorTipo[contactType] = 0;
          }
          conversasPorAgente[agentName].enviadasPorTipo[contactType]++;
        } else if (msg.direction === 'inbound') {
          conversasPorTipo[contactType].recebidas++;
          conversasPorAgente[agentName].recebidas++;
        }
      });

      // Contar conversas únicas por tipo
      Object.values(conversasPorId).forEach(tipo => {
        if (conversasPorTipo[tipo]) {
          conversasPorTipo[tipo].conversas++;
        }
      });

      // Contar conversas únicas por agente
      Object.values(conversasPorIdAgente).forEach(agente => {
        if (conversasPorAgente[agente]) {
          conversasPorAgente[agente].conversas++;
        }
      });

      // Totais gerais
      const mensagensEnviadas = Object.values(conversasPorTipo).reduce((sum, stats) => sum + stats.enviadas, 0);
      const mensagensRecebidas = Object.values(conversasPorTipo).reduce((sum, stats) => sum + stats.recebidas, 0);

      // 4.1. Novos Contatos - Conversas criadas no período
      const { count: novosContatos } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start)
        .lte('created_at', end);

      // 5. Prédios Ativos
      const { data: predios } = await supabase
        .from('buildings')
        .select('status');

      const prediosTotal = predios?.length || 0;
      const prediosAtivos = predios?.filter(p => p.status === 'ativo').length || 0;
      const prediosPercentual = prediosTotal > 0 ? (prediosAtivos / prediosTotal) * 100 : 0;

      // 5.1. Devices/Painéis (tabela devices separada de buildings)
      const { data: devices } = await supabase
        .from('devices')
        .select('status');

      const devicesTotal = devices?.length || 0;
      const devicesOnline = devices?.filter(d => d.status === 'online').length || 0;
      const devicesOffline = devicesTotal - devicesOnline;

      // 5.2. Quedas no Período
      const { data: quedas } = await supabase
        .from('connection_history')
        .select('id')
        .eq('event_type', 'offline')
        .gte('started_at', start)
        .lte('started_at', end);
      
      const quedasPeriodo = quedas?.length || 0;

      // 6. Vouchers Pendentes
      const { data: vouchers } = await supabase
        .from('provider_benefits')
        .select('provider_name, benefit_choice, benefit_chosen_at')
        .eq('status', 'choice_made')
        .is('gift_code', null)
        .order('benefit_chosen_at', { ascending: false });

      // 7. Propostas do Período
      const { data: propostasData } = await supabase
        .from('proposals')
        .select('id, status, cash_total_value, created_by, seller_name, payment_type')
        .gte('created_at', start)
        .lte('created_at', end);

      const propostasEnviadas = propostasData?.length || 0;
      const propostasAguardando = propostasData?.filter(p => 
        ['enviada', 'visualizada'].includes(p.status)
      ).length || 0;
      const propostasAceitas = propostasData?.filter(p => 
        ['aceita', 'convertida'].includes(p.status)
      ).length || 0;
      const propostasValorPotencial = propostasData?.reduce((sum, p) => 
        sum + (p.cash_total_value || 0), 0
      ) || 0;

      // Buscar pedidos convertidos de propostas aceitas para calcular receita efetiva
      const propostasAceitasIds = propostasData
        ?.filter(p => ['aceita', 'convertida'].includes(p.status))
        .map(p => p.id) || [];

      // Buscar pedidos que vieram dessas propostas
      let pedidosPorPropostaMap: Record<string, { id: string; is_fidelidade: boolean; total_parcelas: number }> = {};
      let parcelasPagasPorPedidoRanking: Record<string, number> = {};
      let parcelasPendentesPorPedidoRanking: Record<string, number> = {};

      if (propostasAceitasIds.length > 0) {
        const { data: pedidosConvertidos } = await supabase
          .from('pedidos')
          .select('id, proposal_id, is_fidelidade, total_parcelas, metodo_pagamento')
          .in('proposal_id', propostasAceitasIds);

        pedidosConvertidos?.forEach(ped => {
          if (ped.proposal_id) {
            pedidosPorPropostaMap[ped.proposal_id] = {
              id: ped.id,
              is_fidelidade: ped.is_fidelidade || ped.metodo_pagamento === 'personalizado',
              total_parcelas: ped.total_parcelas || 1
            };
          }
        });

        // Buscar parcelas pagas e pendentes desses pedidos
        const pedidoIdsConvertidos = pedidosConvertidos?.map(p => p.id) || [];
        if (pedidoIdsConvertidos.length > 0) {
          const { data: parcelasRankingPagas } = await supabase
            .from('parcelas')
            .select('pedido_id, valor_final')
            .in('pedido_id', pedidoIdsConvertidos)
            .eq('status', 'pago');

          const { data: parcelasRankingPendentes } = await supabase
            .from('parcelas')
            .select('pedido_id, valor_final')
            .in('pedido_id', pedidoIdsConvertidos)
            .in('status', ['pendente', 'atrasado']);

          parcelasRankingPagas?.forEach(p => {
            parcelasPagasPorPedidoRanking[p.pedido_id] = (parcelasPagasPorPedidoRanking[p.pedido_id] || 0) + (p.valor_final || 0);
          });

          parcelasRankingPendentes?.forEach(p => {
            parcelasPendentesPorPedidoRanking[p.pedido_id] = (parcelasPendentesPorPedidoRanking[p.pedido_id] || 0) + (p.valor_final || 0);
          });
        }
      }

      // Agrupar por vendedor com receita efetiva e projetada
      const vendedoresMap: Record<string, VendedorProposalStats> = {};
      propostasData?.forEach(p => {
        const vendedorId = p.created_by || 'unknown';
        const vendedorNome = p.seller_name || 'Vendedor';
        
        if (!vendedoresMap[vendedorId]) {
          vendedoresMap[vendedorId] = {
            vendedorId,
            vendedorNome,
            enviadas: 0,
            aguardando: 0,
            aceitas: 0,
            valorRecebido: 0,
            valorProjetado: 0,
            valorVendido: 0,
            taxaConversao: 0
          };
        }
        
        vendedoresMap[vendedorId].enviadas++;
        
        if (['enviada', 'visualizada'].includes(p.status)) {
          vendedoresMap[vendedorId].aguardando++;
        }
        
        if (['aceita', 'convertida'].includes(p.status)) {
          vendedoresMap[vendedorId].aceitas++;
          
          // Verificar se tem pedido convertido com parcelas
          const pedidoConvertido = pedidosPorPropostaMap[p.id];
          
          if (pedidoConvertido && (pedidoConvertido.is_fidelidade || pedidoConvertido.total_parcelas > 1)) {
            // Pedido parcelado: usar valores das parcelas
            const valorPago = parcelasPagasPorPedidoRanking[pedidoConvertido.id] || 0;
            const valorPendente = parcelasPendentesPorPedidoRanking[pedidoConvertido.id] || 0;
            
            vendedoresMap[vendedorId].valorRecebido += valorPago;
            vendedoresMap[vendedorId].valorProjetado += valorPendente;
          } else {
            // Pagamento único (PIX à vista): usar valor cheio como recebido
            vendedoresMap[vendedorId].valorRecebido += p.cash_total_value || 0;
          }
        }
      });

      // Calcular taxa de conversão e ordenar por valor RECEBIDO (não projetado)
      const propostasPorVendedor = Object.values(vendedoresMap)
        .map(v => ({
          ...v,
          valorVendido: v.valorRecebido + v.valorProjetado,
          taxaConversao: v.enviadas > 0 ? (v.aceitas / v.enviadas) * 100 : 0
        }))
        .sort((a, b) => b.valorRecebido - a.valorRecebido);

      setStats({
        cadastros: cadastros || 0,
        cadastrosAnterior: cadastrosAnterior || 0,
        pedidos,
        pedidosDetalhes: { pagos, pendentes, ticketMedio },
        vendas,
        vendasProjetadas,
        vendasAnterior,
        conversas,
        conversasPorTipo,
        conversasPorAgente,
        mensagensEnviadas,
        mensagensRecebidas,
        novosContatos: novosContatos || 0,
        prediosAtivos,
        prediosTotal,
        prediosPercentual,
        devicesOnline,
        devicesOffline,
        devicesTotal,
        quedasPeriodo,
        vouchersPendentes: vouchers?.length || 0,
        vouchersList: vouchers || [],
        propostasEnviadas,
        propostasAguardando,
        propostasAceitas,
        propostasValorPotencial,
        propostasPorVendedor,
        loading: false
      });
    } catch (error) {
      console.error('[useDashboardUnifiedStats] Error:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  return { stats, refetch: fetchStats };
};

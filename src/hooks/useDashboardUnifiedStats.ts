import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isAsaasPaid } from '@/services/asaasPaymentService';

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
  visualizadas: number;      // Propostas apenas visualizadas
  aguardando: number;        // Propostas aguardando (enviadas + visualizadas)
  aceitas: number;
  valorRecebido: number;     // Receita EFETIVA (parcelas pagas)
  valorProjetado: number;    // Receita PROJETADA (parcelas pendentes)
  valorVendido: number;      // Soma total (recebido + projetado)
  taxaConversao: number;
  pedidosPagos?: number;     // Pedidos com cobrança Asaas paga (status oficial)
  avatarUrl?: string | null;
  isAI?: boolean;
}

export interface CadastroDetalhado {
  id: string;
  nome: string;
  email: string;
  role: string;
  data_criacao: string;
}

export interface VendaProjetadaDetalhada {
  clienteNome: string;
  produto: string;
  periodo: string;
  valorMes: number;
  valorTotal: number;
}

export interface UnifiedDashboardStats {
  cadastros: number;
  cadastrosAnterior: number;
  cadastrosLista: CadastroDetalhado[];  // Lista detalhada para HoverCard
  pedidos: number;
  pedidosAtivos: number;               // Pedidos ativos
  pedidosSemContrato: number;          // Pedidos ativos sem contrato assinado
  pedidosDetalhes: {
    pagos: number;
    pendentes: number;
    ticketMedio: number;
  };
  vendas: number | null;       // Asaas confirmed receipts; null when unavailable
  vendasProjetadas: number;    // Parcelas PENDENTES (receita futura)
  vendasProjetadasLista: VendaProjetadaDetalhada[]; // Lista detalhada para hover
  vendasProjetadas2025: number; // Projeção anual 2025
  vendasAnterior: number | null;
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
    cadastrosLista: [],
    pedidos: 0,
    pedidosAtivos: 0,
    pedidosSemContrato: 0,
    pedidosDetalhes: { pagos: 0, pendentes: 0, ticketMedio: 0 },
    vendas: null,
    vendasProjetadas: 0,
    vendasProjetadasLista: [],
    vendasProjetadas2025: 0,
    vendasAnterior: null,
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

  // Ref to track if this is the initial load
  const isInitialLoad = useRef(true);
  // Debounce ref for realtime updates
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async (showLoading = true) => {
    try {
      // Only show loading on initial load, not on realtime updates
      if (showLoading && isInitialLoad.current) {
        setStats(prev => ({ ...prev, loading: true }));
      }

      const start = startDate.toISOString();
      const end = endDate.toISOString();

      // Período anterior para comparação
      const diffMs = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - diffMs);
      const previousEnd = startDate;

      // 1. Cadastros - Usando tabela users com data_criacao
      const { data: cadastrosData } = await supabase
        .from('users')
        .select('id, nome, email, role, data_criacao')
        .gte('data_criacao', start)
        .lte('data_criacao', end);

      const cadastros = cadastrosData?.length || 0;
      const cadastrosLista: CadastroDetalhado[] = cadastrosData?.map(u => ({
        id: u.id,
        nome: u.nome || 'Sem nome',
        email: u.email || '',
        role: u.role || 'cliente',
        data_criacao: u.data_criacao || ''
      })) || [];

      const { count: cadastrosAnterior } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('data_criacao', previousStart.toISOString())
        .lte('data_criacao', previousEnd.toISOString());

      // 2. Pedidos (não cortesia)
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('status, valor_total, contrato_status')
        .gte('created_at', start)
        .lte('created_at', end)
        .gt('valor_total', 0);

      const pedidos = pedidosData?.length || 0;
      // MÁQUINA DE ESTADOS CANÔNICA v1.0 - Status canônicos apenas
      // Removidos status legados: 'pago', 'pago_pendente_video'
      const paidStatuses = ['video_enviado', 'video_aprovado', 'ativo'];
      const pagos = pedidosData?.filter(p => paidStatuses.includes(p.status)).length || 0;
      const pendentes = pedidosData?.filter(p => !paidStatuses.includes(p.status)).length || 0;
      const ticketMedio = pedidosData?.length 
        ? pedidosData.reduce((sum, p) => sum + (p.valor_total || 0), 0) / pedidosData.length 
        : 0;

      // 2.1. Pedidos Ativos (campanhas em exibição) e sem contrato
      // CANÔNICO: status = 'ativo' apenas
      const { data: pedidosAtivosData } = await supabase
        .from('pedidos')
        .select('id, status, contrato_status')
        .eq('status', 'ativo');

      const pedidosAtivos = pedidosAtivosData?.length || 0;
      const pedidosSemContrato = pedidosAtivosData?.filter(p => 
        p.contrato_status !== 'assinado'
      ).length || 0;

      // Cash receipts: only official Asaas PAYMENT_RECEIVED statement lines, by movement date.
      // Never infer receipt from order status, valor_total or legacy installments.
      const collectReceipts = async (begin: string, finish: string): Promise<number | null> => {
        let total = 0;
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await supabase.from('asaas_extrato_movimentos')
            .select('valor').eq('tipo', 'PAYMENT_RECEIVED')
            .gte('data', begin.slice(0, 10)).lte('data', finish.slice(0, 10))
            .order('ordem_asaas', { ascending: true }).range(offset, offset + 499);
          if (error || !data) return null;
          total += data.reduce((sum, row) => sum + Number(row.valor || 0), 0);
          if (data.length < 500) return total;
        }
      };
      const [vendas, vendasAnterior] = await Promise.all([
        collectReceipts(start, end), collectReceipts(previousStart.toISOString(), previousEnd.toISOString())
      ]);
      // Contracted/forecast revenue is deliberately not added to received cash.
      const vendasProjetadas = 0;
      const vendasProjetadas2025 = 0;
      const vendasProjetadasLista: VendaProjetadaDetalhada[] = [];

      // 4. Conversas com Mensagens do Período
      const { data: mensagensData } = await supabase
        .from('messages')
        .select(`
          conversation_id,
          direction,
          agent_key,
          conversations!inner(contact_type, agent_key)
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
        // Usar agent_key da CONVERSA (preferência) ou da mensagem (fallback)
        const agentKey = (msg.conversations as any)?.agent_key || msg.agent_key;
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
        .select('id, status, cash_total_value, created_by, seller_name, payment_type, metadata')
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

      // Pedidos fechados pela Sofia (sofia_aceites.pedido_id) — atribuídos a "Sofia (IA)"
      const { data: sofiaAceitesRows } = await (supabase as any)
        .from('sofia_aceites')
        .select('pedido_id, proposal_id, accepted_at')
        .not('pedido_id', 'is', null)
        .gte('created_at', start)
        .lte('created_at', end);
      const sofiaPedidoIds: string[] = Array.from(new Set((sofiaAceitesRows || []).map((r: any) => r.pedido_id).filter(Boolean)));
      const sofiaChargePaid: Record<string, number> = {};
      const sofiaChargePending: Record<string, number> = {};
      if (sofiaPedidoIds.length > 0) {
        const { data: sCharges } = await supabase.from('sofia_cobrancas')
          .select('pedido_id,value,status').in('pedido_id', sofiaPedidoIds);
        sCharges?.forEach((c: any) => {
          if (!c.pedido_id) return;
          const m = isAsaasPaid(c.status) ? sofiaChargePaid : sofiaChargePending;
          m[c.pedido_id] = (m[c.pedido_id] || 0) + Number(c.value);
        });
      }

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

        // Billing status is operational, distinct from bank-statement cash.
        const pedidoIdsConvertidos = pedidosConvertidos?.map(p => p.id) || [];
        if (pedidoIdsConvertidos.length > 0) {
          const { data: charges, error: chargeError } = await supabase.from('sofia_cobrancas')
            .select('pedido_id,value,status').in('pedido_id', pedidoIdsConvertidos);
          if (chargeError) throw chargeError;
          charges?.forEach(charge => {
            if (!charge.pedido_id) return;
            const map = isAsaasPaid(charge.status) ? parcelasPagasPorPedidoRanking : parcelasPendentesPorPedidoRanking;
            map[charge.pedido_id] = (map[charge.pedido_id] || 0) + Number(charge.value);
          });
        }

      }

      // Agrupar por vendedor com receita efetiva e projetada
      const vendedoresMap: Record<string, VendedorProposalStats> = {};
      const SOFIA_ID = 'sofia-ia';
      const countedPedidos = new Set<string>();
      propostasData?.forEach((p: any) => {
        const isSofia = p?.metadata?.origem === 'sofia';
        // Modelos de proposta (status 'modelo') não são envios reais
        if (p.status === 'modelo') return;
        const vendedorId = isSofia ? SOFIA_ID : (p.created_by || 'unknown');
        const vendedorNome = isSofia ? 'Sofia (IA)' : (p.seller_name || 'Vendedor');
        
        if (!vendedoresMap[vendedorId]) {
          vendedoresMap[vendedorId] = {
            vendedorId,
            vendedorNome,
            enviadas: 0,
            visualizadas: 0,
            aguardando: 0,
            aceitas: 0,
            valorRecebido: 0,
            valorProjetado: 0,
            valorVendido: 0,
            taxaConversao: 0
          };
        }
        
        vendedoresMap[vendedorId].enviadas++;
        
        // Contagem separada para visualizadas
        if (p.status === 'visualizada') {
          vendedoresMap[vendedorId].visualizadas++;
        }
        
        if (['enviada', 'visualizada'].includes(p.status)) {
          vendedoresMap[vendedorId].aguardando++;
        }
        
        if (['aceita', 'convertida'].includes(p.status)) {
          vendedoresMap[vendedorId].aceitas++;
          
          // Verificar se tem pedido convertido com parcelas
          const pedidoConvertido = pedidosPorPropostaMap[p.id];
          
          if (pedidoConvertido && !countedPedidos.has(pedidoConvertido.id)) {
            countedPedidos.add(pedidoConvertido.id);
            if ((parcelasPagasPorPedidoRanking[pedidoConvertido.id] || 0) > 0) {
              vendedoresMap[vendedorId].pedidosPagos = (vendedoresMap[vendedorId].pedidosPagos || 0) + 1;
            }
            vendedoresMap[vendedorId].valorRecebido += parcelasPagasPorPedidoRanking[pedidoConvertido.id] || 0;
            vendedoresMap[vendedorId].valorProjetado += parcelasPendentesPorPedidoRanking[pedidoConvertido.id] || 0;
          }

        }
      });

      // Pedidos da Sofia (sofia_aceites) ainda não contados via proposta
      if (sofiaPedidoIds.length > 0) {
        if (!vendedoresMap[SOFIA_ID]) {
          vendedoresMap[SOFIA_ID] = {
            vendedorId: SOFIA_ID, vendedorNome: 'Sofia (IA)', enviadas: 0, visualizadas: 0,
            aguardando: 0, aceitas: 0, valorRecebido: 0, valorProjetado: 0, valorVendido: 0, taxaConversao: 0,
          };
        }
        const sofia = vendedoresMap[SOFIA_ID];
        (sofiaAceitesRows || []).forEach((r: any) => {
          if (!r.pedido_id || countedPedidos.has(r.pedido_id)) return;
          countedPedidos.add(r.pedido_id);
          if (r.accepted_at) sofia.aceitas++;
          if ((sofiaChargePaid[r.pedido_id] || 0) > 0) sofia.pedidosPagos = (sofia.pedidosPagos || 0) + 1;
          sofia.valorRecebido += sofiaChargePaid[r.pedido_id] || 0;
          sofia.valorProjetado += sofiaChargePending[r.pedido_id] || 0;
        });
        if (sofia.enviadas < sofia.aceitas) sofia.enviadas = sofia.aceitas;
      }
      if (vendedoresMap[SOFIA_ID]) {
        vendedoresMap[SOFIA_ID].isAI = true;
        vendedoresMap[SOFIA_ID].avatarUrl = null;
      }

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
        cadastrosLista,
        pedidos,
        pedidosAtivos,
        pedidosSemContrato,
        pedidosDetalhes: { pagos, pendentes, ticketMedio },
        vendas,
        vendasProjetadas,
        vendasProjetadasLista,
        vendasProjetadas2025,
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
      
      // Mark initial load as complete
      isInitialLoad.current = false;
    } catch (error) {
      console.error('[useDashboardUnifiedStats] Error:', error);
      setStats(prev => ({ ...prev, loading: false }));
      isInitialLoad.current = false;
    }
  }, [startDate, endDate]);

  // Debounced refresh for realtime updates
  const debouncedRefresh = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchStats(false); // Don't show loading for realtime updates
    }, 500);
  }, [fetchStats]);

  useEffect(() => {
    // Reset initial load flag when dates change
    isInitialLoad.current = true;
    fetchStats(true);

    // Real-time subscriptions with DEBOUNCE to prevent flickering
    const channels = [
      supabase.channel('unified-users-rt-v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          console.log('[useDashboardUnifiedStats] Users changed - debounced refresh');
          debouncedRefresh();
        })
        .subscribe(),
      supabase.channel('unified-pedidos-rt-v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
          console.log('[useDashboardUnifiedStats] Pedidos changed - debounced refresh');
          debouncedRefresh();
        })
        .subscribe(),
      supabase.channel('unified-parcelas-rt-v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parcelas' }, () => {
          console.log('[useDashboardUnifiedStats] Parcelas changed - debounced refresh');
          debouncedRefresh();
        })
        .subscribe(),
      supabase.channel('unified-messages-rt-v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          console.log('[useDashboardUnifiedStats] Messages changed - debounced refresh');
          debouncedRefresh();
        })
        .subscribe(),
      supabase.channel('unified-conversations-rt-v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          console.log('[useDashboardUnifiedStats] Conversations changed - debounced refresh');
          debouncedRefresh();
        })
        .subscribe(),
      supabase.channel('unified-buildings-rt-v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'buildings' }, () => {
          console.log('[useDashboardUnifiedStats] Buildings changed - debounced refresh');
          debouncedRefresh();
        })
        .subscribe(),
      supabase.channel('unified-devices-rt-v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
          console.log('[useDashboardUnifiedStats] Devices changed - debounced refresh');
          debouncedRefresh();
        })
        .subscribe(),
      supabase.channel('unified-proposals-rt-v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, () => {
          console.log('[useDashboardUnifiedStats] Proposals changed - debounced refresh');
          debouncedRefresh();
        })
        .subscribe(),
      supabase.channel('unified-provider-benefits-rt-v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_benefits' }, () => {
          console.log('[useDashboardUnifiedStats] Provider benefits changed - debounced refresh');
          debouncedRefresh();
        })
        .subscribe(),
      supabase.channel('unified-connection-history-rt-v2')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'connection_history' }, () => {
          console.log('[useDashboardUnifiedStats] Connection history changed - debounced refresh');
          debouncedRefresh();
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [fetchStats, debouncedRefresh]);

  return { stats, refetch: fetchStats };
};

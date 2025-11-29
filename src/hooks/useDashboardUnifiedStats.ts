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

export interface UnifiedDashboardStats {
  cadastros: number;
  cadastrosAnterior: number;
  pedidos: number;
  pedidosDetalhes: {
    pagos: number;
    pendentes: number;
    ticketMedio: number;
  };
  vendas: number;
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
  quedasPeriodo: number;
  vouchersPendentes: number;
  vouchersList: Array<{
    provider_name: string;
    benefit_choice: string;
    benefit_chosen_at: string;
  }>;
  loading: boolean;
}

export const useDashboardUnifiedStats = (startDate: Date, endDate: Date) => {
  const [stats, setStats] = useState<UnifiedDashboardStats>({
    cadastros: 0,
    cadastrosAnterior: 0,
    pedidos: 0,
    pedidosDetalhes: { pagos: 0, pendentes: 0, ticketMedio: 0 },
    vendas: 0,
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
    quedasPeriodo: 0,
    vouchersPendentes: 0,
    vouchersList: [],
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

      // 3. Vendas
      const { data: vendasData } = await supabase
        .from('pedidos')
        .select('valor_total')
        .in('status', ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'])
        .gte('created_at', start)
        .lte('created_at', end)
        .gt('valor_total', 0);

      const vendas = vendasData?.reduce((sum, p) => sum + (p.valor_total || 0), 0) || 0;

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

      // 5.1. Quedas no Período
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

      setStats({
        cadastros: cadastros || 0,
        cadastrosAnterior: cadastrosAnterior || 0,
        pedidos,
        pedidosDetalhes: { pagos, pendentes, ticketMedio },
        vendas,
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
        quedasPeriodo,
        vouchersPendentes: vouchers?.length || 0,
        vouchersList: vouchers || [],
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
